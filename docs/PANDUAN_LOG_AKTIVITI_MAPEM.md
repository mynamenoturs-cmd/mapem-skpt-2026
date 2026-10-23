# MaPeM SKPT 2026 — Pembetulan dan Log Aktiviti

## Makluman anugerah diterima 23 Oktober 2026

| Anugerah | Tahap / kuota | Pegawai/PIC |
|---|---|---|
| Ikon Navigator DELIMa | Tahap 1 = 3 orang keseluruhan | Teacher Abby |
| Ikon Navigator DELIMa | Tahap 2 = 3 orang keseluruhan | Cikgu Fandi Ajam |
| Anugerah Cerdas PLaN | **6 penerima gabungan Tahap 1 dan 2**: 3 murid PLaN + 3 murid Pemulihan Khas | Cikgu Puja |
| Pencapaian Lonjakan Akademik M.A.W.A.R | Y2=10, Y3=14, Y4=2, Y5=4 — **30 keseluruhan** | Cikgu Norbaizura |
| UASA & Pencapaian Mata Pelajaran Tahap 2 | Tahun 4 dan 5, kuota belum disahkan | Fenny Fiona |
| AINS NILAM Tahun 4/5 | Ikon NILAM 2 orang sekelas; Tokoh NILAM Tahap 2: 3 piala keseluruhan | Nadiah Mohd Naim / Laila |
| PBD Tahap 2 | 5 murid setiap kelas Tahun 4/5 | Guru kelas |
| Anugerah Tokoh Murid M.A.W.A.R | Tahun 3, 2 orang; kategori berasingan daripada **Lonjakan Akademik** | Cikgu Marwyn |

Tiada Tahun 6 dalam portal. Tahap 1 = Y1–3; Tahap 2 = Y4–5. Nama PIC ialah keterangan tugas sahaja; akses sebenar hanya diberi dengan e-mel Google oleh Admin.

## Cara padam atau betulkan nama yang salah

### PBD, guru kelas sebelum menghantar
1. Log masuk → Kelas Saya → Kategori PBD.
2. Padam baris nama yang salah atau betulkan ejaannya.
3. Tunggu indikator **Disimpan** (autosave) dan semak jumlah 5 sebelum menghantar.
4. Jika kelas sudah dihantar, minta Admin klik **Buka semula** supaya guru boleh membetulkan.

### Pembetulan PBD terus oleh Admin
1. Admin → **Pengurusan kelas** → pilih Tahap dan Tahun.
2. Klik **Betulkan PBD** pada baris kelas yang berkaitan.
3. Klik **Padam** pada nama yang salah atau sunting senarai (satu nama sebaris).
4. Isi **Sebab pembetulan** (wajib), kemudian **Sahkan & simpan pembetulan**.
5. Jika senarai telah diterbitkan, Admin mesti **Tarik balik** penerbitan dahulu, betulkan, lengkapkan semula 5 nama dan **Terbitkan** semula.
6. Pembetulan direkodkan sebagai log dengan e-mel Google dan sebelum/selepas.

### Anugerah selain PBD
Admin atau guru penyelaras yang ditugaskan boleh membuka **Pemilihan & pengisian**, pilih tahap, kategori dan kelas, buang baris nama salah, kemudian tekan **Simpan**. Jika sudah diterbitkan, tarik balik penerbitan dahulu.

## Cara semak siapa yang membuat pengisian

1. Log masuk dengan akaun **Admin**.
2. Sidebar → **Log aktiviti**.
3. Pilih Tahap 1 atau Tahap 2, tapis e-mel dan kelas.
4. Semak masa (waktu Malaysia), e-mel, peranan, nama anugerah, nama ditambah/dipadam serta sebab pembetulan.
5. Buka **Lihat sebelum & selepas** bagi senarai penuh sebelum dan selepas.

Audit log untuk nama dalam `drafts`/`nominations` dijana secara **transaksi database** menggunakan SQL trigger; aplikasi tidak menerima e-mel pengisi daripada medan borang (identiti berasal daripada sesi Google). Perubahan pengisian bermula selepas fungsi ini dipasang. Rekod lama yang wujud sebelum audit diaktifkan tidak dapat dipastikan nama pengisinya secara retrospektif.

## Privasi dan keselamatan

Log sebelum/selepas mengandungi nama murid. Aksesnya hanya melalui endpoint Admin yang memerlukan log masuk dan peranan Admin. Jangan kongsi paparan log secara umum dan jangan masukkan nama murid dalam pengumuman portal. Log tidak mempunyai butang hapus untuk menghalang pemadaman bukti oleh pengguna biasa.

## Kuota belum disahkan

PDF yang dibekalkan mempunyai angka Tahap 1 bagi UASA dan mata pelajaran, tetapi tidak menetapkan angka jelas bagi Tahun 4/5. Oleh itu, kuota Tahap 2 dipaparkan sebagai **belum disahkan**, bukan diandaikan 10 atau 7. Admin boleh menyimpan nama sementara, kemudian pihak sekolah menetapkan kuota rasmi.
