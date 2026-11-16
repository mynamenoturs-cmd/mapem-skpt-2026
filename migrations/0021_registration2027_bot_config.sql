-- Bot FAQ dan ucapan sambutan boleh dikemas kini oleh pentadbir pendaftaran sahaja.
-- Semua data di sini ialah maklumat awam sekolah, bukan rekod murid.
CREATE TABLE IF NOT EXISTS registration_2027_bot_config (
 id INTEGER PRIMARY KEY CHECK(id=1),
 greeting TEXT NOT NULL,
 faq_json TEXT NOT NULL DEFAULT '[]',
 updated_by TEXT NOT NULL DEFAULT 'system',
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT OR IGNORE INTO registration_2027_bot_config(id,greeting,faq_json) VALUES (
 1, 'Assalamualaikum dan salam sejahtera! 🌸 Saya Cikgu Wanwan BOT 🤖, pembantu maya Pendaftaran Tahun 1 Sesi 2027 SK Pekan Telipok. Saya sedia membantu ibu bapa dan penjaga mendapatkan maklumat tentang pendaftaran, guru kelas, semakan kelas anak dan cara menghubungi pihak sekolah. Pilih soalan di bawah atau taip pertanyaan anda. 😊',
 '[{"question":"Cara semak kelas anak","answer":"Buka Paparan Ibu Bapa dan gunakan ruang Semakan Kelas Anak apabila fungsi semakan diaktifkan oleh pihak sekolah. Jika belum tersedia, sila hubungi pejabat sekolah untuk pengesahan.","enabled":true},{"question":"Senarai guru kelas","answer":"Nama sembilan guru kelas Tahun 1 2027 dipaparkan pada Paparan Ibu Bapa. Sila rujuk senarai terkini dalam portal sekolah.","enabled":true},{"question":"Dokumen diperlukan","answer":"Senarai dokumen rasmi untuk pendaftaran belum dinyatakan dalam portal. Sila rujuk pengumuman sekolah atau hubungi pentadbir untuk pengesahan.","enabled":true},{"question":"Tarikh pendaftaran","answer":"Tarikh dan waktu urusan pendaftaran Tahun 1 2027 belum dinyatakan dalam portal. Sila semak pengumuman rasmi sekolah atau hubungi pentadbir.","enabled":true},{"question":"Hubungi admin","answer":"Untuk pertanyaan atau pembetulan maklumat, sila hubungi pihak pentadbir pendaftaran melalui pilihan yang disediakan dalam Paparan Ibu Bapa atau pejabat SK Pekan Telipok.","enabled":true}]'
);
