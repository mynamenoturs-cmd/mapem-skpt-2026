# PANDUAN PEMASANGAN — MAPEM SKPT 2026 (GOOGLE LOGIN + PWA)

**Objektif:** aplikasi yang boleh dipasang di telefon, masuk dengan Google, pengisian satu kelas untuk setiap guru, paparan sahaja untuk guru lain dan ibu bapa. Aplikasi beroperasi melalui Cloudflare, bukan Google Apps Script.

## 1. Semak D1 asas

Buka Cloudflare > Storage & Databases > D1 > `mapemskpt2026` > Console. Semak:

```sql
SELECT year, COUNT(*) AS jumlah_kelas FROM classes GROUP BY year ORDER BY year;
```

Hasil 9, 9, 8 = 26 kelas. Pastikan jadual `drafts` wujud:

```sql
SELECT name FROM sqlite_master WHERE type='table' AND name IN ('classes','drafts');
```

Jika kedua-dua jadual sedia ada, **jangan ulang migrasi pertama**.

## 2. Jalankan migrasi Google + PWA

Buka GitHub: `migrations/0002_google_pwa.sql`. Salin dan jalankan pernyataan SQL **satu demi satu** melalui D1 Console di telefon. Terdapat pernyataan untuk:

1. `users`
2. indeks `idx_users_email`
3. `teacher_assignments`
4. indeks `idx_assignments_class`
5. `sessions`
6. indeks `idx_sessions_expires`
7. `oauth_states`
8. `publications`

Arahan `CREATE TABLE IF NOT EXISTS` tidak memadam rekod. Uji jadual:

```sql
SELECT name FROM sqlite_master WHERE type='table' AND name IN ('users','teacher_assignments','sessions','oauth_states','publications') ORDER BY name;
```

Sepatutnya terdapat **5 jadual tambahan**.

## 3. Sambungkan D1

Cloudflare > Workers & Pages > `mapem-skpt-2026` > Settings > Bindings > Add > D1. Nama binding mestilah **`DB`** (huruf besar), pilih database **`mapemskpt2026`** (nama sebenar pada akaun Cloudflare anda), Production.

## 4. Cipta OAuth Google (buat sendiri dalam akaun Google Cloud)

Buka https://console.cloud.google.com/auth/overview dan cipta/ pilih projek Google Cloud.

- Konfigurasi **Google Auth Platform > Branding** menggunakan nama `MaPeM SKPT 2026` dan e-mel sokongan sekolah.
- Di **Audience**, pilih External jika ibu bapa dan guru dari akaun Gmail luar organisasi perlu login. Untuk percubaan External/Testing, masukkan akaun penguji di Test Users. Untuk penggunaan meluas, semak keperluan Google bagi status Production dan domain yang dimiliki/ disahkan sekolah. Jangan andaikan domain `pages.dev` semestinya memadai untuk penerbitan Google OAuth penuh.
- Di **Clients > Create Client**, pilih **Web application**.
- **Authorized JavaScript origins:** `https://mapem-skpt-2026.pages.dev`
- **Authorized redirect URI:** `https://mapem-skpt-2026.pages.dev/api/auth/google/callback`
- Simpan **Client ID** dan **Client Secret**. Kedua-duanya tidak dimasukkan dalam repositori GitHub, borang awam atau sembang.

Google mesti menerima URI redirect yang *sama tepat*, termasuk `https`, nama domain dan laluan `/api/auth/google/callback`. Jika sekolah memakai custom domain, semua alamat di atas serta `APP_ORIGIN` perlu diselaraskan.

## 5. Secrets dan variables Cloudflare Pages

Dalam **Settings > Variables and Secrets**, tambah untuk **Production**:

| Nama | Isi | Jenis disyorkan |
|---|---|---|
| `GOOGLE_CLIENT_ID` | Client ID daripada Google Cloud | Variable / Secret |
| `GOOGLE_CLIENT_SECRET` | Client Secret | **Secret/Encrypted** |
| `APP_ORIGIN` | `https://mapem-skpt-2026.pages.dev` | Variable |
| `ADMIN_EMAILS` | Gmail urus setia pertama, contoh `admin.sekolah@gmail.com` (gantikan dengan e-mel SEBENAR anda) | Secret atau variable terhad |

Bagi beberapa pentadbir, pisahkan alamat dalam `ADMIN_EMAILS` dengan koma. E-mel perlu sepadan dengan akaun Google yang digunakan untuk login. Jangan kongsi rahsia Google atau kata laluan dalam chat.

**`ADMIN_KEY` lama tidak digunakan dalam versi ini.** Selepas migrasi dan ujian selesai, boleh singkirkan rahsia lama daripada Cloudflare jika tidak lagi digunakan oleh aplikasi lain.

## 6. Deploy

Buka Cloudflare > projek `mapem-skpt-2026` > Deployments. Pastikan deployment terbaharu menggunakan commit GitHub terkini. Setelah binding dan variable dikemas kini, gunakan **Retry deployment** / **Create deployment** mengikut dashboard agar Functions dimuatkan dengan konfigurasi baharu.

Buka `https://mapem-skpt-2026.pages.dev/api/health`. Jika konfigurasi lengkap, respons: `{"ok":true,"configured":true}`. Ini hanya menguji kewujudan konfigurasi, **belum menjamin log masuk Google berfungsi**.

Buka laman utama, pilih **Teruskan dengan Google** dan log masuk e-mel pentadbir seperti `ADMIN_EMAILS`. Dashboard pentadbir perlu muncul.

## 7. Tugaskan guru kelas

Admin > tab **Akses Guru** > taip e-mel Google guru > pilih salah satu 26 kelas > Simpan Penugasan. Guru kelas log masuk dengan akaun tersebut; sistem terus membawa ke pengisian kelas sahaja.

Guru yang tidak mempunyai penugasan dan ibu bapa akan masuk sebagai **Paparan Sahaja**. Mereka **tidak boleh mengubah nama murid** atau melihat draf.

## 8. Hantar dan terbitkan

- Guru mengisi setiap kategori (satu nama penuh satu baris), tunggu `✓ Disimpan automatik`, dan klik **Hantar Senarai Akhir** apabila lengkap.
- Admin > **Kelas & Penerbitan** > **Semak nama**. Selepas kelulusan sekolah, klik **Terbitkan** bagi kelas tersebut.
- Senarai hanya boleh dilihat pengguna Paparan Sahaja **selepas diterbitkan**.
- Jika pembetulan diperlukan, Admin > **Buka semula**. Sistem menarik balik senarai diterbitkan sehingga disemak dan diterbitkan semula.
- Admin > **Anugerah Khas** untuk kategori peringkat Tahap 1 yang bukan tugasan guru kelas.
- Admin > **Pemantauan Kuota** untuk kuota keseluruhan.

## 9. Pasang pada telefon (Android)

Buka laman dengan **Google Chrome**, bukan pelayar dalaman WhatsApp. Di Chrome, pilih menu tiga titik > **Install app / Pasang aplikasi** (atau **Add to Home screen / Tambah ke skrin utama** bergantung pada peranti/pelayar). Selepas pemasangan, buka ikon MaPeM seperti aplikasi biasa. Internet masih diperlukan untuk log masuk dan simpanan data.

## 10. Privasi dan pelepasan penggunaan sebenar

**Sistem mengumpul data kanak-kanak.** Pastikan nama yang dipaparkan diluluskan sekolah, ikut dasar privasi/rekod murid dan maklumkan penjaga. Paparan sahaja dapat dibaca oleh **semua pengguna dengan akaun Google yang berjaya log masuk**, bukan penjaga murid tertentu sahaja. Jika hanya penjaga sah patut membaca nama tertentu, perlu tambahkan pengesahan hubungan penjaga dan kebenaran terperinci sebelum digunakan.

Untuk OAuth Production External, Google juga mungkin memerlukan laman polisi privasi, halaman utama dan pengesahan domain milik sekolah; siapkan dokumen sah dan domain sebelum penerbitan kepada ibu bapa secara meluas.

## 11. Masalah lazim

- `configured:false`: binding DB atau GOOGLE_CLIENT_ID/SECRET/APP_ORIGIN/ADMIN_EMAILS belum lengkap.
- `redirect_uri_mismatch`: URI redirect pada Google Cloud tidak sama tepat dengan konfigurasi Cloudflare.
- Akaun masuk sebagai `Paparan Sahaja`: e-mel itu tidak berada dalam `ADMIN_EMAILS` atau tidak ditugaskan pada tab Akses Guru.
- `D1 ... no such table`: belum jalankan `0002_google_pwa.sql` atau memilih database yang salah.
- Laman versi lama: deploy commit baharu, kemudian refresh/clear cache aplikasi PWA.
- `Access blocked` Google: semak Audience, Test Users, polisi OAuth dan pengesahan domain.
