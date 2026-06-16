# Safari 26 Status Bar Tinting — Cara Kerjanya

**Demo Langsung:** [next-webkit-bar.vercel.app](https://next-webkit-bar.vercel.app/)
**Repositori:** [github.com/ianfebi01/next-webkit-bar](https://github.com/ianfebi01/next-webkit-bar)

## Latar Belakang

Mulai Safari 26 (macOS & iOS), Apple **meninggalkan** pendekatan `<meta name="theme-color">` (yang digunakan di Safari 15–18) dan beralih ke pengambilan warna UI browser secara otomatis dari `background-color` elemen halaman standar — khususnya `<body>` atau elemen `position: fixed | sticky` yang memenuhi syarat.

> **Sumber:** [andesco/safari-color-tinting](https://github.com/andesco/safari-color-tinting)

---

## `viewport-fit=cover` Diabaikan untuk Tinting

Berlawanan dengan anggapan umum, **`viewport-fit=cover` TIDAK berpengaruh pada perilaku tinting status bar Safari 26**. Tinting sepenuhnya ditentukan oleh sampling elemen DOM, bukan oleh meta tag viewport.

`viewport-fit=cover` hanya diperlukan untuk:
- Mengaktifkan CSS environment variables `env(safe-area-inset-*)`
- Tinting bottom bar di home-screen web apps (PWA)

---

## Cara Safari 26 Melakukan Sampling Elemen

Safari mengambil sampel `background-color` dari elemen yang memenuhi SEMUA kriteria berikut:

| Kriteria | iOS | macOS |
|----------|-----|-------|
| Positioning | `fixed` atau `sticky` | `fixed` atau `sticky` |
| Jarak dari atas | ≤ 4px dari atas | ≤ 4px dari atas |
| Lebar | ≥ 80% viewport | ≥ 90% viewport |
| Tinggi | > 4px (minimum 5px) | > 4px (minimum 5px) |

### Yang Tetap Di-sampling (Mengejutkan)

- `visibility: hidden` — **tetap di-sampling**
- `pointer-events: none` — **tetap di-sampling**
- Elemen yang sebagian off-screen (hingga `bottom: -8px` dengan `min-height: 12px`)

### Yang TIDAK Di-sampling

- `display: none`
- Anak `position: absolute` di dalam parent fixed/sticky
- Pseudo-elements (`::before`, `::after`) pada elemen fixed/sticky
- Efek `backdrop-filter`

---

## Masalah Re-Sample Saat Runtime

Safari 26 memiliki **live observer** yang memantau perubahan `background-color` pada elemen yang memenuhi syarat. Namun, observer ini tidak konsisten — beberapa transisi diabaikan secara diam-diam:

| Transisi | Terdeteksi? |
|----------|-------------|
| Warna A → Warna B | ✅ Biasanya |
| Warna → `transparent` | ❌ Sering terlewat |
| `transparent` → Warna | ❌ Sering terlewat |
| Properti dihapus sepenuhnya (tidak ada `background-color`) | ❌ Tidak pernah terdeteksi |

### Solusinya: Tarian Meta Tag `+ "fe"`

Meskipun Safari 26 mengabaikan `<meta name="theme-color">` sebagai *sumber* tint, **mengubah atribut `content` meta tag tetap menusuk internal observer Safari** dan memaksa re-sample penuh semua sumber tinting DOM (body + elemen fixed).

Pola 3-langkah yang terbukti:

```tsx
// Langkah 1: Set body background + meta ke target segera
document.body.style.backgroundColor = targetColor;
meta.setAttribute("content", targetColor);

// Langkah 2: Frame berikutnya — sentil meta dengan sufiks "+fe"
requestAnimationFrame(() => {
  meta.setAttribute("content", targetColor + "fe");

  // Langkah 3: Frame setelahnya — kembalikan ke nilai bersih
  requestAnimationFrame(() => {
    meta.setAttribute("content", targetColor);
  });
});
```

Sufiks `+ "fe"` membuat nilai warna yang sedikit berbeda (invalid) yang didaftarkan observer Safari sebagai *perubahan*, membangunkannya. Nilai bersih dikembalikan segera setelahnya. Perubahan ganda ini tidak terlihat oleh pengguna tetapi memaksa Safari untuk me-re-sample setiap elemen yang memenuhi syarat.

### Implementasi Hook Lengkap

```tsx
function useSafariTintForce(targetColor: string) {
  const metaRef = useRef<HTMLMetaElement | null>(null);
  const prevRef = useRef(targetColor);

  // Pastikan <meta name="theme-color"> ada di <head>
  useEffect(() => {
    let meta = document.querySelector<HTMLMetaElement>(
      'meta[name="theme-color"]',
    );
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "theme-color";
      meta.content = "";
      document.head.appendChild(meta);
    }
    metaRef.current = meta;
  }, []);

  useEffect(() => {
    const meta = metaRef.current;
    if (!meta) return;
    if (targetColor === prevRef.current) return;
    prevRef.current = targetColor;

    const color = targetColor || "transparent";
    const metaColor = targetColor || "#ffffff";

    document.body.style.backgroundColor = color;
    meta.setAttribute("content", metaColor);

    const r1 = requestAnimationFrame(() => {
      meta.setAttribute("content", metaColor + "fe");
      const r2 = requestAnimationFrame(() => {
        meta.setAttribute("content", metaColor);
      });
      return () => cancelAnimationFrame(r2);
    });
    return () => cancelAnimationFrame(r1);
  }, [targetColor]);
}
```

### Yang TIDAK Berhasil

Pendekatan-pendekatan ini telah diuji dan **gagal** memicu observer Safari:

| Percobaan | Mengapa gagal |
|-----------|---------------|
| Mengubah `el.style.backgroundColor` langsung | Observer melewatkan transisi transparent ↔ warna |
| Kedip `rAF`: `transparent → rgb(0,0,0,0.004) → transparent` | Nilai hampir identik diabaikan |
| DOM unmount/remount via React `key` | Observer tidak terpicu ulang saat re-insertion |
| Tailwind classes (`bg-blue-600` → `""`) | Menghapus properti sepenuhnya = tidak ada perubahan terdeteksi |

---

## Pola Tinting Strip

Anda tidak perlu header yang terlihat sebagai sumber tinting. **Strip tipis tak terlihat** di bagian paling atas halaman dapat mengontrol status bar secara independen:

```html
<!-- Strip 11px tak terlihat — Safari mengambil sampel INI untuk warna status bar -->
<div
  aria-hidden="true"
  style="position: fixed; top: 0; width: 100%; height: 11px;
         background-color: #2563eb; pointer-events: none; z-index: 200"
/>

<!-- Header yang terlihat — bisa warna APA SAJA, independen dari status bar -->
<header
  style="position: fixed; top: 0; width: 100%; height: 96px;
         background-color: #ffffff; z-index: 100"
>
  Header situs Anda...
</header>
```

**Mengapa 5px?** Ambang batas Safari adalah *lebih dari* 4px — tepat di 4px tint bekerja saat awal tetapi menghilang saat di-scroll. 5px membuatnya tetap di-sampling dengan andal di semua posisi scroll.

### Diagram Arsitektur

```
┌── Tinting Strip (5px, z-200) ──┐  ← Safari sampling INI
├── Header Terlihat (h-24, z-100) ─┤  ← Pengguna melihat INI (warna bebas)
│                                  │
│         Konten Halaman           │  ← Body background (independen)
│                                  │
└──────────────────────────────────┘
```

Pemisahan ini memungkinkan Anda:
- Mengatur status bar ke `Merah` sementara header `Putih`
- Membuat status bar transparan sambil mempertahankan header berwarna yang terlihat
- Mewarnai status bar tanpa header yang terlihat sama sekali

---

## Pola Dua Elemen (Kontrol Safe Zone)

Menggunakan dua elemen fixed bersamaan:

```tsx
{/* Elemen 1 — Mengontrol tint status bar */}
<header
  className="fixed top-0 w-full h-24 z-100 pointer-events-none"
  style={{ backgroundColor: statusColor }}
/>

{/* Elemen 2 — Safe zone enforcer overlay */}
<div className="fixed inset-0 z-80 pointer-events-none">
  <div className="absolute inset-0 bg-transparent" />
</div>
```

| Elemen | Tujuan |
|--------|--------|
| `<header>` fixed di atas | Tinting controller — `background-color`-nya menentukan tampilan status bar |
| `<div>` fixed fullscreen | Safe zone enforcer — memastikan konten menghormati safe-area insets |

### Matriks Perilaku

| Warna Status Bar | Overlay | Hasil |
|-----------------|---------|-------|
| `transparent` (tanpa bg) | ON | **Status bar transparan** — konten mengalir di belakangnya |
| Warna apa pun (mis. `#2563eb`) | ON | **Status bar berwarna** — sesuai warna, konten di safe zone |
| N/A (header dihapus) | ON | Jatuh ke background `<body>`, konten di safe zone |
| Apa pun | OFF | Jatuh ke background `<body>` |

### Body BG "None" + Status Bar Berwarna

Saat body background di-set ke **None** (transparan) dan status bar memiliki warna:
- Saat di-scroll, **navbar (URL bar)** menampilkan **bayangan (shadow)** warna status bar
- Efek gradien halus — warna status bar "merembes" ke area navbar saat scrolling

---

## Inline Styles vs Tailwind Classes

**Selalu gunakan inline styles** untuk `background-color` yang di-sampling Safari. Tailwind classes tidak dapat diandalkan karena:

```tsx
// ❌ RUSAK — Interpolasi Tailwind class
// Saat navBg = "", properti background-color DIHAPUS sepenuhnya.
// Observer Safari melihat tidak ada properti → tidak ada perubahan → tidak ada re-sample.
<nav className={`fixed top-0 … ${navBg}`} />

// ✅ BEKERJA — Inline style
// background-color SELALU di-set secara eksplisit, bahkan saat "transparent".
// Observer Safari melihat setiap perubahan nilai.
<nav style={{ backgroundColor: navBg || "transparent" }} />
```

---

## Ambang Batas Tinggi: 4px vs 5px vs 11px

Tinggi tinting strip sangat memengaruhi perilaku Safari. Ambang batas ini ditemukan melalui pengujian empiris:

| Tinggi | Tint Awal | Perilaku Scroll | Ganti Warna | Catatan |
|--------|-----------|-----------------|-------------|---------|
| **4px** | ✅ Berfungsi | ❌ Memudar jadi bayangan, transparan | N/A | Tidak andal — tint hanya terlihat saat statis |
| **5px–10px** | ✅ Berfungsi | ✅ Tetap saat scroll | ❌ Tidak otomatis ganti | Perlu tarian meta tag `+ "fe"` setiap kali |
| **11px+** | ✅ Berfungsi | ✅ Solid saat scroll | ✅ Langsung ganti | Sepenuhnya andal. **Direkomendasikan.** |

### 11px+ Adalah Titik Terbaik

Pada 11px atau lebih:
- Warna tetap solid saat di-scroll (tidak memudar)
- Mengganti warna terjadi instan — tidak perlu tarian meta tag (meski tetap membantu)
- Tint status bar tetap independen dari warna background body
- Bekerja andal di semua skenario yang diuji

### Interaksi Body Background & Navbar

Dengan overlay **ON** dan body background color di-set:
- **URL bar** (navbar di bawah status bar) mengikuti warna **body background**
- Mengubah body background TIDAK langsung memperbarui navbar
- Harus toggle overlay **OFF → ON** untuk menyinkronkan navbar ke warna body baru
- **Status bar** tetap benar apa pun yang terjadi

### Navbar Transparan (Konten Terlihat di Belakang)

Untuk membuat navbar transparan agar konten terlihat di belakang URL bar:
- Overlay harus **OFF**
- Tanpa overlay, Safari jatuh ke background `<body>` untuk tinting navbar

### Konten di Bawah Status Bar

Agar konten muncul di belakang status bar (edge-to-edge):
- Tempatkan elemen `position: fixed | sticky` di paling atas dengan **tanpa background color** (transparan)
- Ini **memerlukan reload halaman** agar berlaku — Safari tidak mendeteksi ini saat runtime

---

## Poin Penting

1. **`viewport-fit=cover` tidak mengontrol tinting.** Jangan mengandalkannya untuk warna status bar.
2. **Re-sample saat runtime memerlukan tarian meta tag `+ "fe"`.** Live observer Safari mengabaikan banyak transisi kecuali ditusuk via manipulasi `<meta name="theme-color">`.
3. **Gunakan inline styles, bukan Tailwind classes.** Properti `background-color` harus selalu ada secara eksplisit agar Safari melacak perubahan.
4. **Gunakan minimal 11px untuk tinting strip.** 4px memudar saat scroll, 5–10px tidak otomatis ganti warna. 11px+ sepenuhnya andal.
5. **`pointer-events: none` tidak mencegah sampling Safari.** Gunakan untuk membuat kontroler tinting yang tidak terlihat.
6. **Overlay fullscreen** (fixed `inset-0` dengan background transparan) bertindak sebagai safe zone enforcer. Toggle OFF→ON untuk sinkronisasi navbar body background.
7. **Konten di bawah status bar** memerlukan elemen fixed transparan + reload halaman untuk aktif.
8. **Safari menggunakan luma (kecerahan yang dirasakan)** dari warna yang di-sampling untuk menentukan apakah teks/ikon status bar harus gelap atau terang.

---

## Penggunaan Praktis

```tsx
// Tinting strip andal (minimal 11px)
<header style={{
  position: "fixed", top: 0, width: "100%", height: "11px",
  backgroundColor: "#2563eb", pointerEvents: "none"
}} />

// Status bar transparan (konten di belakang — perlu reload halaman)
<header style={{
  position: "fixed", top: 0, width: "100%", height: "11px",
  backgroundColor: "transparent", pointerEvents: "none"
}} />

// Dengan hook re-sample
function HalamanSaya() {
  const [color, setColor] = useState("#ffffff");
  useSafariTintForce(color);

  return (
    <header style={{
      position: "fixed", top: 0, width: "100%", height: "11px",
      backgroundColor: color, pointerEvents: "none"
    }} />
  );
}
```

---

## Referensi

- [Safari Color Tinting — Demo & Dokumentasi](https://safari-color-tinting.pages.dev/)
- [GitHub: andesco/safari-color-tinting](https://github.com/andesco/safari-color-tinting)
- [Luma: Apple & Kecerahan yang Dirasakan](https://github.com/andesco/safari-color-tinting/blob/main/luma.md)
- [Demo Langsung (proyek ini)](https://next-webkit-bar.vercel.app/)
- [Repositori](https://github.com/ianfebi01/next-webkit-bar)
