# Portal MaPeM SK Pekan Telipok 2026

**Sistem pencalonan & pengumpulan penerima anugerah Tahap 1** untuk 26 kelas (Tahun 1: 9, Tahun 2: 9, Tahun 3: 8 tanpa Amber). Menggunakan **GitHub → Cloudflare Pages + Pages Functions + Cloudflare D1**.

## Ciri

- Reka bentuk responsif, tema merah songket/emas, dengan imej rasmi MaPeM.
- Semua kategori anugerah di halaman yang sama; nama murid sahaja, satu nama sebaris.
- Simpan automatik (setiap kategori), versi data untuk mengelak suntingan bertembung.
- Pautan bertoken **khusus satu kelas**; guru tidak boleh menyunting kelas lain.
- Hantar sekali sahaja apabila siap; hanya pentadbir boleh membuka semula.
- Dashboard urus setia: 26 kelas, status, bilangan penerima, kuota kategori, eksport CSV.
- Tukar kunci pautan kelas jika bocor, tanpa menjejaskan data kelas.
- Tiada keperluan e-mel guru, log masuk Google, borang berulang atau Supabase.

## A. Cipta repositori GitHub (sekali sahaja)

1. Di GitHub, klik **New repository** dan namakan `mapem-skpt-2026`.
2. Pilih **Private** kerana kod projek sekolah ini berkaitan sistem data murid, walaupun tiada data murid disimpan dalam repo.
3. Muat naik **semua kandungan ZIP selepas diekstrak** ke akar repositori (bukan fail ZIP sahaja). Kekalkan folder `public`, `functions` dan `migrations`.
4. Pilih branch utama `main`. Setiap `push` seterusnya akan membina semula laman jika GitHub disambungkan ke Cloudflare Pages.

## B. Sambungkan GitHub ke Cloudflare Pages

1. Di https://dash.cloudflare.com → **Workers & Pages** → **Create** → **Pages** → **Connect to Git** (label mungkin berubah mengikut UI).
2. Benarkan akses Cloudflare kepada repositori `mapem-skpt-2026`, kemudian pilih repositori itu.
3. **Project name:** `mapem-skpt-2026` (jika tersedia).
4. **Production branch:** `main`.
5. **Framework preset:** `None`.
6. **Build command:** kosong (*none*, tidak perlu npm build).
7. **Build output directory:** `public`.
8. Klik **Save and Deploy**. UI statik boleh muncul dahulu, tetapi API akan memaparkan bahawa D1/ADMIN_KEY belum dipautkan. Itu normal sehingga langkah C–E selesai.

**Penting:** Folder `functions` mesti berada di akar repo, setaraf dengan `public`; bukan di dalam `public`.

## C. Cipta dan sediakan Cloudflare D1

1. Cloudflare → **D1 SQL Database** → **Create database** → nama `mapem-skpt-2026`.
2. Buka database → **Console**.
3. Buka fail `migrations/0001_init.sql`, salin keseluruhan SQL, tampal dan jalankan di Console. Ia akan mencipta jadual `classes` dan `drafts` serta **26 kelas**.
4. Semak SQL `SELECT COUNT(*) AS bilangan FROM classes;` → hasil sepatutnya **26**.

SQL menggunakan `INSERT OR IGNORE`, jadi menjalankan semula migrasi tidak memadam rekod sedia ada.

## D. Pautkan D1 kepada Cloudflare Pages

1. Buka **Workers & Pages → mapem-skpt-2026 → Settings → Bindings**.
2. Pilih **Add binding → D1 database**.
3. Namakan binding **`DB`** (huruf besar), pilih database `mapem-skpt-2026`.
4. Simpan untuk **Production**. Jika mahu menguji Preview, pastikan ada database ujian berlainan bagi Preview agar data murid sebenar tidak tertukar.

## E. Tetapkan kunci rahsia admin

1. Dalam projek Pages, buka **Settings → Variables and Secrets** (atau **Environment variables**).
2. Tambah rahsia bernama tepat **`ADMIN_KEY`**, untuk **Production**. Nilainya mestilah rentetan rawak yang kuat dengan **minimum 32 aksara**.
3. Tandakan sebagai **Secret/Encrypted** jika pilihan tersedia. **Jangan** masukkan kunci ini ke GitHub atau dalam fail sumber.
4. **Deploy semula** projek Pages supaya binding dan rahsia baharu digunakan.

Jika kunci `ADMIN_KEY` diubah kemudian, *semua pautan kelas lama* akan terbatal kerana tandatangan pautan diterbitkan daripada kunci tersebut.

## F. Log masuk, beri pautan guru, uji

1. Buka `https://mapem-skpt-2026.pages.dev` (atau domain projek sebenar).
2. Di bahagian **Akses Urus Setia**, masukkan nilai `ADMIN_KEY` yang disimpan di Cloudflare.
3. Dashboard akan menyenaraikan 26 kelas. Klik **Salin pautan** pada setiap kelas dan berikan hanya kepada guru berkenaan.
4. Buka satu pautan sebagai guru: kelas dipilih automatik, isi satu nama setiap baris. Tunggu status **Disimpan automatik**.
5. Klik **Hantar Senarai Akhir** selepas lengkap. Uji fungsi **Buka semula** dari dashboard admin, dan semak eksport CSV.
6. Periksa kuota keseluruhan. Penerima kategori khas yang perlu seorang L dan seorang P memerlukan semakan manual kerana medan jantina tidak dikumpul.

### Pautan admin pada telefon

Buka URL laman Pages yang sama dan masukkan `ADMIN_KEY` dalam ruangan admin pada telefon. Tidak perlu pautan Google Apps Script, jadi masalah Google `Request access` bagi `/exec` tidak timbul dalam sistem ini.

## Struktur projek

```text
mapem-skpt-2026/
├── public/
│   ├── index.html         # Paparan utama portal
│   ├── app.js             # UI guru + admin + autosave
│   ├── styles.css         # Reka bentuk responsif
│   ├── _headers           # Kawalan cache/index/sumber
│   └── assets/
│       └── mapem-logo.jpg
├── functions/
│   └── api/
│       └── [[path]].js    # API autentikasi, data & eksport
├── migrations/
│   └── 0001_init.sql      # Skema D1 + 26 kelas
├── tests/
│   └── api.test.mjs       # Ujian ringkas
├── package.json
└── README.md
```

## Kuota & kategori

Asal kuota daripada foto **Senarai Anugerah MaPeM Tahap 1 2026**. PBD 45/45/40, UASA 10/10/10, mata pelajaran 30/30/30, AINS hamper 18/18/16. Kategori khas yang disatukan pada Tahap 1 ditanda kuota keseluruhan (bukan 2 setiap kelas). Kategori PLAN dan DELIMa tidak mempunyai angka yang jelas dan belum diletakkan kuota. Tokoh AINS Tahap 2 **tidak dimasukkan** dalam portal Tahap 1. Anugerah Tokoh Murid Mawar hanya untuk Tahun 3.

> Angka 18 + 18 + 16 = 52 bagi AINS Tahap 1, walaupun catatan foto menyebut 100 orang merangkumi Tahap 1 & 2. Gunakan kuota dalam lajur Tahun 1–3 untuk portal ini.

## Privasi & keselamatan

- Data murid **hanya** disimpan dalam D1 Cloudflare, bukan GitHub.
- Kunci guru ialah pautan rahsia: **sesiapa yang memegang pautan boleh mengedit kelas berkenaan** sebelum kelas dihantar. Edarkan secara peribadi, jangan kongsi di media sosial.
- Semua API data memerlukan token admin atau token khas kelas. URL token disimpan sebagai **fragmen `#`**, tidak dihantar sebagai sebahagian daripada URL permintaan HTTP.
- Pentadbir boleh menukar kunci kelas yang terdedah; pautan lama tidak sah lagi.
- Tiada log masuk identiti guru. Jika sekolah memerlukan rekod audit per guru atau kawalan akses yang lebih ketat, tambahkan Cloudflare Access/SSO kemudian.
- Simpan eksport CSV di lokasi terhad dan padam selepas urusan selesai menurut polisi pengurusan data sekolah.
- Pastikan tiada data sebenar disalin ke repositori atau digunakan pada preview awam.

## Ujian tempatan

`npm test` untuk semakan logik, `node --check public/app.js` untuk sintaks. Untuk preview reka bentuk tanpa data sebenar, buka `/?demo=admin` atau `/?demo=teacher` pada halaman yang telah dihoskan; mod demo memaparkan data contoh dan tidak menyimpan nama ke D1.

## Keselamatan data ketika pindah dari Apps Script

Projek ini **tidak mengimport** rekod Google Apps Script/Google Sheets secara automatik. Jika ada data sebenar dalam sistem lama, sediakan pelan migrasi terkawal sebelum guru mengisi laman baharu. Versi awal bermula dengan D1 kosong.

## Had & perkara perlu pengesahan

- Tiada hard cap setiap kelas kerana kuota foto ialah kuota *peringkat tahun*; admin menerima amaran jika jumlah keseluruhan melebihi kuota.
- Medan subjek untuk Anugerah Mata Pelajaran Terbaik boleh ditambah pada versi berikutnya sekiranya perlu sijil mengikut mata pelajaran.
- Autosave memerlukan sambungan internet aktif. Tunggu `✓ Disimpan automatik` sebelum menutup tab.
- Kunci ADMIN_KEY mesti dirahsiakan; mengubahnya akan menukar pautan untuk semua guru.