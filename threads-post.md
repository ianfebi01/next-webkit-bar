🧵 Ternyata bikin status bar iOS ikut berubah warna itu gak semudah yang gue kira. 6 hari ngoprek, 4 pendekatan gagal, akhirnya nemu yang work 🤯

🧵 1/6
Jadi gini… Safari 26 (iOS & macOS) udah gak peduli sama `<meta name="theme-color">` lagi. Apple bikin aturan baru: warna status bar sekarang ngikutin elemen `position: fixed` paling atas di halaman kamu.

🧵 2/6
Cukup tambahin ini di halaman:

```html
<div style="position:fixed;top:0;width:100%;height:5px;
background:#2563eb;pointer-events:none"></div>
```

5px doang. Gak keliatan. Tapi Safari langsung nge-sample warnanya buat status bar.

⚠️ Harus >4px ya. Gue coba 4px — status bar berubah, tapi pas di-scroll balik transparan lagi. 5px aman.

🧵 3/6
Yang bikin ngakak:
• `pointer-events: none` → tetep ke-detect 🤷
• `visibility: hidden` → tetep ke-detect 🤷
• `viewport-fit=cover` → gak ngaruh sama sekali 😂

🧵 4/6
Nah disini gue mulai frustasi. Ganti warna pas runtime (misal biru → transparan), Safari diem aja. Gak update samsek. Gue coba ganti langsung, flicker rAF, unmount DOM… semua gagal.

Akhirnya nemu: ubah `<meta name="theme-color">` jadi `warna + "fe"`, terus balikin di frame berikutnya. Safari langsung "bangun" dan re-sample 🪄

🧵 5/6
Abis ngoprek 6 hari, ini 4 hal yang gagal & yang akhirnya work:

❌ Ganti `el.style.backgroundColor` langsung → ke-skip
❌ Flicker `transparent → rgb(0,0,0,0.004)` → diabaikan
❌ Unmount/remount DOM → gak mempan
❌ Tailwind class interpolation → properti ilang

✅ Inline style + meta tag `+ "fe"` dance + strip 5px fixed (>4px!)

🧵 6/6
Udah gue tulis lengkap + ada demo interaktif yang bisa lo utak-atik langsung:

🔗 https://www.ianfebisastrataruna.my.id/id/article/safari-26-bagaimana-status-bar-bisa-mengikuti-warna-halaman

Repo GitHub-nya juga open source kok 🙌

#Safari #WebDev #Frontend #iOS #CSS #NextJS