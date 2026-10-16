# MaPeM SK Pekan Telipok 2026 — Aplikasi PWA

**GitHub → Cloudflare Pages + Pages Functions → Cloudflare D1 → Log masuk Google**

**Versi baharu:** log masuk akaun Google, pemasangan aplikasi pada Android sebagai PWA, kawalan akses mengikut peranan dan penerbitan berperingkat. Versi baharu **menggantikan akses lama melalui pautan token kelas serta `ADMIN_KEY`**. Jangan edarkan pautan lama.

## Peranan

| Peranan | Diperoleh dengan | Hak akses |
|---|---|---|
| Pentadbir / urus setia | E-mel dalam `ADMIN_EMAILS` atau ditambah oleh admin | Semua kelas, tugasan guru, kategori khas, semak, eksport, terbit/tarik balik |
| Guru kelas | E-mel Google ditugaskan oleh admin kepada satu kelas | Tahun 1–2: PBD sahaja; Tahun 3: PBD dan 4 pencalonan; melihat paparan diterbitkan |
| Guru bertugas / penyelaras | E-mel ditugaskan kepada kategori oleh admin | Pengisian / pemilihan kategori sendiri bagi kelas yang berkaitan; boleh juga memegang tugasan kelas |
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

Baca **[PANDUAN_GOOGLE_PWA.md](PANDUAN_GOOGLE_PWA.md)** dahulu. Jangan jalankan `0001_init.sql` semula jika jadual `classes` dan `drafts` telah berjaya dibuat. Jalankan migrasi tambahan `0002` hingga `0004` yang belum digunakan, mengikut turutan. Workflow deployment menguruskannya secara automatik tanpa memadam data.

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


## Pembahagian pengisian mengikut senarai anugerah Tahap 1

| Pengisi | Tugasan |
| --- | --- |
| Guru kelas Tahun 1 dan 2 | PBD sahaja (tepat 5 murid setiap kelas) |
| Guru kelas Tahun 3 (5 pengisian) | PBD (tepat 5 murid setiap kelas), pencalonan Ikon Cemara, Khas Kurikulum, Harapan Kokurikulum dan Harapan HEM |
| Cikgu Fitri | UASA dan Mata Pelajaran Terbaik |
| Guru PSS | AINS NILAM hamper individu dan Tokoh AINS Tahap 1 |
| Teacher Abby | Ikon Navigator DELIMa |
| Cikgu Wyn / Cikgu Zura | Anugerah Khas PLAN dan Tokoh Murid Mawar (Tahun 3 sahaja) |
| Penyelaras / keputusan undian guru-guru | Pilih penerima akhir bagi empat kategori pencalonan; kuota 2 bagi setiap kategori untuk Tahun 3 |

Admin membuka **Tugasan kategori**, mendaftarkan e-mel Google sebenar dan memilih profil panduan atau kategori satu persatu. Nama dalam senarai sumber tidak ditukarkan kepada e-mel secara automatik. Seorang guru boleh memegang tugasan kelas dan kategori serentak. Guru kategori hanya mempunyai akses kepada kategori yang diberikan, bukan akses admin.

**Pemilihan & pengisian** menampilkan calon daripada guru kelas. Empat kategori khas disimpan dalam `nominations`, berasingan daripada penerima akhir di `drafts`. Calon tidak dieksport atau diterbitkan sebagai penerima secara automatik. Penyelaras memilih nama mengikut kelas dan mengesahkan semakan L/P serta keputusan pemilihan. Sistem merekod pengesah dan versi keputusan. Jika melebihi 2 calon, pemilihan/undian dibuat oleh pihak sekolah; portal tidak menjalankan undian secara automatik.

Kuota penerima akhir disemak merentas kelas, termasuk 2 bagi kategori khas, UASA 10 setiap tahun, mata pelajaran 30 setiap tahun, hamper AINS 18/18/16 dan Tokoh AINS Tahap 1 sebanyak 3. Catatan sumber 100 hamper/sijil dan 3 piala Tahap 2 disimpan sebagai nota; portal ini mengekalkan skop Tahap 1. Data penerima lama tidak dipadam atau ditukar menjadi pencalonan secara automatik. Migrasi `0004_award_responsibilities.sql` hanya menambah jadual tugasan, pencalonan dan semakan.

Senarai yang sudah diterbitkan dikunci daripada suntingan. Admin menarik balik penerbitan dahulu untuk membolehkan guru kategori menyunting; guru kelas pula memerlukan kelas dibuka semula.

### Pengumuman halaman log masuk
Admin: menu **Pengumuman portal** → sunting tajuk/mesej → semak pratonton → tandakan paparan awam → Simpan. Nyah tanda dan simpan untuk menyembunyikan. Teks dipaparkan sebagai teks biasa, bukan HTML. Versi simpanan mengelakkan perubahan admin lain tertindih. Pengumuman awam tidak mengandungi data murid; senarai penerima masih memerlukan log masuk.

### Admin yang juga guru kelas atau guru kategori
Gunakan e-mel Google admin yang sama dalam **Akses guru** untuk menetapkan kelas, dan **Tugasan kategori** untuk menetapkan anugerah khas. Sidebar memaparkan **Mod Admin**, **Kelas Saya** (Tahun 1–2: PBD sahaja; Tahun 3: 5 pengisian) dan **Tugasan Saya** (kategori yang ditugaskan sahaja). Pertukaran ruang tidak memerlukan log keluar. Kuasa admin dikekalkan; kelas sendiri tetap tertakluk kepada kuota, penghantaran dan kunci pengeditan. Tugasan Saya menggunakan skop `mine` pada API; Pemilihan & pengisian dalam Mod Admin kekal merentas semua kategori. Tiada kelas atau kategori ditetapkan secara automatik.

**Ketetapan terkini:** GK Tahun 1 dan 2 hanya mengisi PBD. Empat pencalonan (Cemara, Khas Kurikulum, Harapan Kokurikulum, Harapan HEM) hanya untuk Tahun 3. Pemilihan kategori berkenaan juga terhad kepada Tahun 3. Rekod lama Tahun 1–2 dikekalkan dalam database tetapi tidak digunakan dalam pemilihan, penerbitan dan eksport semasa.

### Hab Guru & Ibu Bapa
Menu hab memuatkan tiga tab: Penerima, Info majlis dan Makluman. Penerima hanya daripada snapshot yang diterbitkan; dikelompokkan mengikut nama dalam kelas yang sama (bukan pengesahan identiti anak). Carian dan penapis tahun/kelas/anugerah serta penomboran halaman dibuat di pelayar. Kad penerima boleh dicetak/disimpan PDF melalui dialog cetakan peranti, dan dilabel bukan sijil rasmi. Tiada nama disimpan dalam storan pelayar.
Admin → Maklumat majlis: isi dan pratonton butiran yang disahkan, kemudian terbit. Belum ada butiran majlis diterbitkan secara lalai. Info umum menyediakan atur cara, peta carian alamat dan fail kalendar .ics (waktu Malaysia). Pengumuman portal turut dipaparkan dalam tab Makluman. Senarai nama kekal memerlukan Google login.
