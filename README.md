# MaPeM SK Pekan Telipok 2026 — Aplikasi PWA

**GitHub → Cloudflare Pages + Pages Functions → Cloudflare D1 → Log masuk Google**

**Versi baharu:** log masuk akaun Google, pemasangan aplikasi pada Android sebagai PWA, kawalan akses mengikut peranan dan penerbitan berperingkat. Versi baharu **menggantikan akses lama melalui pautan token kelas serta `ADMIN_KEY`**. Jangan edarkan pautan lama.

## Peranan

| Peranan | Diperoleh dengan | Hak akses |
|---|---|---|
| Pentadbir / urus setia | E-mel berada dalam `ADMIN_EMAILS` | Semua kelas, tugasan guru, kategori khas, semak, eksport, terbit/tarik balik |
| Guru kelas | E-mel Google ditugaskan oleh admin kepada satu kelas | Isi, ubah dan hantar nama **kelas sendiri sahaja**; melihat paparan diterbitkan |
| Paparan sahaja (guru lain/ibu bapa) | Akaun Google sah yang tidak mempunyai tugasan | Hanya melihat **nama penerima anugerah yang telah diterbitkan** |

Tiada nama murid dipaparkan kepada pengguna paparan sebelum admin menekan **Terbitkan**. Pengguna tanpa log masuk Google tidak dapat melihat senarai.

## Struktur

- `public/`: web PWA responsif (HTML/CSS/JS), manifest, service worker, imej.
- `functions/api/[[path]].js`: Google OAuth Authorization Code Flow, sesi HttpOnly, akses mengikut peranan, D1, penerbitan.
- `migrations/0001_init.sql`: jadual asal `classes`/`drafts` dan senarai 26 kelas.
- `migrations/0002_google_pwa.sql`: jadual tambahan untuk log masuk, tugasan, sesi, penerbitan.
- `tests/security.test.mjs`: ujian peranan, akses kelas dan penerbitan.

**Tiada data murid dalam GitHub.** GitHub hanya menyimpan kod dan SQL. Data sebenar disimpan dalam Cloudflare D1.

## Pemasangan

Baca **[PANDUAN_GOOGLE_PWA.md](PANDUAN_GOOGLE_PWA.md)** dahulu. Jangan jalankan `0001_init.sql` semula jika jadual `classes` dan `drafts` telah berjaya dibuat. **Jalankan hanya migrasi tambahan `0002_google_pwa.sql`**.

Cloudflare Pages:
- Repository: `mynamenoturs-cmd/mapem-skpt-2026`
- Branch: `main`
- Build command: kosong
- Output: `public`
- D1 binding `DB`: pilih database sebenar `mapemskpt2026`
- Secrets: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `APP_ORIGIN`, `ADMIN_EMAILS`.

Kunci `ADMIN_KEY` lama **tidak digunakan** oleh versi ini. Jangan simpan rahsia dalam GitHub.

## Catatan keselamatan

- Akaun Google mengesahkan identiti pengguna menggunakan profil minimum (`openid email profile`). Kata laluan Google tidak disimpan.
- Sesi menggunakan cookie `HttpOnly`, `Secure`, `SameSite=Lax`; token raw sesi tidak disimpan dalam D1 (hanya SHA-256).
- Penetapan guru dibuat admin dengan e-mel Google. Server menyemak kelas daripada sesi yang telah disahkan (bukan pilihan kelas dari borang).
- Hanya senarai *snapshot* yang diterbitkan berada di API bacaan `published`; draf tidak boleh dilihat pengguna biasa.
- Pentadbir harus mendapatkan kebenaran sekolah dan mengikuti dasar perlindungan data kanak-kanak sebelum menerbitkan nama. Untuk senarai yang hanya patut dilihat penjaga tertentu, sistem perlu kawalan keluarga/penjaga tambahan.
- Jangan gunakan data murid sebenar dalam mod demo atau ujian awam. Jangan kongsi eksport CSV secara terbuka.

## Ujian

`node --test tests/security.test.mjs` (Node 22+) dan semak pemasangan sebenar selepas konfigurasi Cloudflare/Google OAuth. Ujian tempatan **bukan pengesahan deployment production**.


## Pengurusan admin dalam portal

Pentadbir sedia ada boleh membuka **Menu → Urus admin**, memasukkan e-mel Google, kemudian mengesahkan **Tambah sebagai admin**. Akaun itu mendapat akses pentadbir pada permintaan seterusnya; muat semula portal jika paparan lama masih terbuka. Pentadbir yang ditambah boleh dibuang melalui **Buang akses**. Akaun dalam konfigurasi `ADMIN_EMAILS` kekal sebagai pentadbir utama dan dilindungi daripada pembatalan melalui portal. Pengguna tidak boleh membuang akses sendiri.

Migrasi tambahan `0003_admin_roles.sql` hanya mencipta jadual `admin_grants`, tanpa mengubah data kelas atau murid. Semakan peranan berlaku pada server untuk setiap permintaan; UI bukan sumber kebenaran akses.

Banner dan ikon baharu berada dalam `public/assets/mapem-banner-v2.webp` dan `public/assets/mapem-emblem-v2.webp`. `scripts/build-brand.mjs` membina ikon PWA dan laluan aset lama daripada imej yang sama. Animasi cahaya banner dan ikon dijalankan melalui CSS serta dihentikan apabila pengguna memilih reduced motion.
