# Automasi GitHub → Cloudflare untuk MaPeM SKPT 2026

## Apa yang sudah tersedia

- Projek: `mapem-skpt-2026` (branch `main`).
- Workflow: [MaPeM - Ujian, Migrasi D1 dan Deploy Pages](.github/workflows/mapem-cloudflare.yml).
- D1 production **yang sedia ada**: `mapemskpt2026`, bukan `mapem-skpt-2026`.
- Workflow akan menjalankan `npm run check` dan `npm test` pada setiap push ke `main` dan melalui **Run workflow**.
- Selepas kebenaran diberikan, workflow menggunakan Wrangler 4 untuk migrasi yang belum direkod, kemudian deployment Pages, kemudian semakan `/api/health`.
- Tiada SQL `DROP TABLE` / `DELETE` dalam migrasi sedia ada. `CREATE TABLE IF NOT EXISTS` dan `INSERT OR IGNORE` digunakan supaya rekod sedia ada dikekalkan.
- Cloudflare **tidak** akan dideploy melalui workflow sehingga tiga kelayakan berikut diset dalam GitHub. Jika tiada, ujian kod masih boleh berjalan.

## 1. Cipta token Cloudflare sekali sahaja

Buka Cloudflare Dashboard → **Manage Account → Account API Tokens → Create Token → Create Custom Token**.

Tetapkan sekurang-kurangnya izin akaun berkaitan:
- **Cloudflare Pages: Edit (Pages Write)** untuk deployment.
- **D1: Edit** untuk menjalankan migrasi.
- Hadkan **Account Resources** kepada akaun Cloudflare MaPeM sahaja.

Jangan gunakan Global API Key. Simpan token secara terus di GitHub Secrets, **jangan hantar token melalui chat atau commit**.

## 2. Tetapkan tiga nilai dalam GitHub

Buka [Settings → Secrets and variables → Actions](https://github.com/mynamenoturs-cmd/mapem-skpt-2026/settings/secrets/actions).

| Jenis | Nama tepat | Dari mana |
|---|---|---|
| **Repository secret** | `CLOUDFLARE_API_TOKEN` | Custom API Token Cloudflare (nilai rahsia) |
| **Repository variable** | `CLOUDFLARE_ACCOUNT_ID` | Cloudflare Account ID dari dashboard |
| **Repository variable** | `MAPEM_D1_DATABASE_ID` | ID database `mapemskpt2026` (UUID dari D1 → Overview) |

**Penting:** Database ID berlainan daripada database name; masukkan ID UUID sebenar. Secret dan variable mesti menggunakan huruf besar tepat seperti di atas. Jangan gunakan `GITHUB_TOKEN` sebagai ganti Cloudflare API Token.

## 3. Elakkan dua sistem deployment serentak

Projek Cloudflare Pages ini sudah mempunyai integrasi Git. Untuk menjadikan **GitHub Actions satu-satunya deployment automatik**:

1. Cloudflare → Workers & Pages → `mapem-skpt-2026` → **Settings → Builds → Branch control**.
2. Matikan **Automatic production branch deployments**. Jika digunakan, matikan juga automatic preview branch deployment.
3. **Jangan klik Disconnect**, jangan padam projek dan jangan cipta projek baru.

Ini mengelakkan Git integration dan GitHub Actions bersaing untuk deploy commit yang sama.

## 4. Pastikan binding & Google Login dalam Cloudflare (sekali sahaja)

Cloudflare Pages → Settings → **Bindings**: Production **D1 binding `DB`** perlu memilih database **`mapemskpt2026`**.

Dalam **Variables and secrets** untuk Production, aplikasi Google Login memerlukan:
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET` (**secret**)
- `APP_ORIGIN` = `https://mapem-skpt-2026.pages.dev`
- `ADMIN_EMAILS` = e-mel akaun pentadbir yang dibenarkan

Di Google Cloud Console, OAuth Authorized redirect URI ialah:
`https://mapem-skpt-2026.pages.dev/api/auth/google/callback`

**Jangan masukkan rahsia Google ke GitHub**. Tetapkan rahsia Google dalam Cloudflare Pages supaya ia kekal tersimpan di aplikasi, berasingan daripada kod.

## 5. Jalankan GitHub Action

1. Buka [GitHub Actions](https://github.com/mynamenoturs-cmd/mapem-skpt-2026/actions).
2. Pilih **MaPeM - Ujian, Migrasi D1 dan Deploy Pages**.
3. Tekan **Run workflow**, pilih branch `main`, kemudian **Run workflow**.
4. Semak setiap langkah log:
   - Semak sintaks + ujian keselamatan.
   - Kebenaran Cloudflare lengkap.
   - Migrasi D1 production.
   - Semakan jadual dan 26 kelas.
   - Deployment Cloudflare Pages.
   - `/api/health` boleh diakses.

**Jika nilai belum diset**, workflow akan menyatakan bahawa deployment dilangkau, bukannya menjalankan migrasi tanpa identiti database sah.

**Jika ujian atau migrasi gagal**, deployment tidak akan dijalankan. Betulkan ralat dalam GitHub dahulu. Jangan jalankan migrasi rawak atau padam database.

## 6. Kemas kini seterusnya

Selepas konfigurasi sekali selesai, setiap commit ke branch `main` mencetuskan ujian → migrasi yang belum dilaksanakan → deployment. Untuk mengubah struktur database pada masa hadapan, tambah fail `migrations/0003_....sql`; jangan sunting fail migrasi yang sudah dijalankan. Cloudflare Wrangler merekod migrasi dalam `d1_migrations` supaya ia tidak diulang sesuka hati.

## Nota penting

- Data murid sebenar hanya dalam D1, bukan GitHub.
- Jangan gunakan token kelas lama atau `ADMIN_KEY` dari versi Apps Script; versi ini menggunakan Google OAuth dan e-mel pentadbir.
- Pautan untuk guru/ibu bapa hanya akan berfungsi selepas OAuth/Production bindings lengkap.
- API health boleh menunjukkan `configured: false` sehingga rahsia OAuth diset, walaupun endpoint `/api/health` berjaya dibuka. Selesaikan rahsia OAuth sebelum ujian sebenar dengan pengguna.
- Automation **belum disahkan berjaya pada Cloudflare production** sehingga GitHub secret/variable dan Cloudflare Pages settings sudah diset.
