# Aktifkan Google Login MaPeM — Konfigurasi sekali sahaja

**Status:** Kod Google OAuth, akses Admin/Guru/Paparan, database D1 dan automasi GitHub Actions tersedia. Cloudflare Pages menggunakan domain `https://mapem-skpt-2026.pages.dev`.

## A. Cipta OAuth Client di Google Cloud

1. Buka [Google Auth Platform](https://console.cloud.google.com/auth/overview). Pilih atau cipta satu projek Google Cloud.
2. Buka **Branding**. Nama aplikasi: **MaPeM SKPT 2026**. Masukkan e-mel sokongan yang sah.
3. Buka **Audience**: pilih **External** jika ibu bapa atau guru menggunakan akaun Gmail yang berlainan organisasi. Pada peringkat **Testing**, masukkan e-mel anda sebagai *Test user* untuk menguji. Google mengehadkan pengguna semasa mod Testing.
4. Buka **Clients → Create client → Web application**. Nama: **MaPeM SKPT 2026 Web**.
5. **Authorized JavaScript origins**:
   `https://mapem-skpt-2026.pages.dev`
6. **Authorized redirect URIs** (salin tepat):
   `https://mapem-skpt-2026.pages.dev/api/auth/google/callback`
7. Klik **Create** dan simpan **Client ID** dan **Client Secret** di tempat selamat. Jangan hantar Client Secret dalam chat atau commit ke repo GitHub.

## B. Konfigurasi GitHub sekali sahaja

Sambungan Cloudflare sedia ada menggunakan Repository Secret `CLOUDFLARE_API_TOKEN` dan Repository Variables `CLOUDFLARE_ACCOUNT_ID`, `MAPEM_D1_DATABASE_ID`. **Jangan ubah yang sudah berjaya.**

Buka [Actions Variables](https://github.com/mynamenoturs-cmd/mapem-skpt-2026/settings/variables/actions) dan tambah:

| Jenis | Nama | Nilai |
|---|---|---|
| Repository Variable | `GOOGLE_CLIENT_ID` | Client ID Google OAuth Web Application |

Buka [Actions Secrets](https://github.com/mynamenoturs-cmd/mapem-skpt-2026/settings/secrets/actions) dan tambah:

| Jenis | Nama | Nilai |
|---|---|---|
| Repository Secret | `GOOGLE_CLIENT_SECRET` | Client Secret Google OAuth Web Application |
| Repository Secret | `MAPEM_ADMIN_EMAILS` | Gmail admin sebenar yang akan log masuk, contoh `admin@example.com`; beberapa e-mel boleh dipisah dengan koma |

**Jangan masukkan kata laluan Google.** Akaun pentadbir dipilih melalui e-mel Google dalam `MAPEM_ADMIN_EMAILS`, bukannya kata laluan tersendiri.

## C. Automasi memuatkan Google Login ke Cloudflare

Buka [GitHub Actions](https://github.com/mynamenoturs-cmd/mapem-skpt-2026/actions) → **MaPeM - Ujian, Migrasi D1 dan Deploy Pages** → **Run workflow** → branch `main` → Run.

Workflow:
- menjalankan ujian kod dan keselamatan;
- memastikan D1 Production masih bound;
- menetapkan `APP_ORIGIN` secara automatik;
- apabila ketiga-tiga nilai Google di atas tersedia, mengkonfigurasi `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (secret) dan `ADMIN_EMAILS` (secret) dalam Cloudflare Pages Production;
- menerbitkan kod dan memeriksa `/api/health`.

Tiada nilai rahsia dipaparkan dalam log oleh skrip konfigurasi.

Semak [Health API](https://mapem-skpt-2026.pages.dev/api/health): `databaseConnected:true` dan `configured:true` bermaksud kelayakan disediakan dan D1 berjaya dihubungi. Pengesahan ini **tidak** menjamin Google OAuth boleh digunakan sebelum pengujian log masuk sebenar.

## D. Uji peranan

1. Buka [portal](https://mapem-skpt-2026.pages.dev), pilih **Teruskan dengan Google** dan gunakan akaun dalam `MAPEM_ADMIN_EMAILS`.
2. Anda sepatutnya memperoleh dashboard Admin.
3. Dalam **Akses Guru**, tetapkan e-mel Google guru kepada **satu kelas**.
4. Uji menggunakan akaun guru: hanya kelasnya boleh diisi.
5. Uji menggunakan akaun bukan guru: hanya nama yang telah diterbitkan oleh urus setia boleh dilihat.

**Privasi:** Nama murid adalah data kanak-kanak. Dapatkan kelulusan sekolah sebelum menerbitkan nama; akaun viewer sah tidak semestinya ibu bapa kepada murid. Jangan paparkan draf. 

## E. Mod Testing dan penerbitan

Jika aplikasi Google OAuth masih dalam **Testing**, hanya e-mel yang disenaraikan sebagai Test user dapat mengaksesnya. Jangan edarkan kepada semua guru/ibu bapa sebelum status penerbitan dan keperluan Google Cloud selesai. Projek awam mungkin memerlukan domain milik sekolah dan maklumat dasar privasi.

Sumber rasmi:
- https://developers.google.com/identity/protocols/oauth2/web-server
- https://support.google.com/cloud/answer/15549945
- https://developers.cloudflare.com/api/resources/pages/subresources/projects/methods/edit/
