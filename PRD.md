
---

# PRODUCT REQUIREMENTS DOCUMENT (PRD)

**Proyek:** Dashboard Web Sistem Akuaponik Cerdas HYDROLA
**Divisi:** Website & Telegram (RnD IoT HME FT UB)
**Ketua Tim:** Muhammad Zidane Fajarianto
**Anggota Tim:** Fahmy Almaliki Dwi Aditya, Zahroti Syakira Niami
**Tanggal:** 28 Mei 2026

## 1. Executive Summary

Sistem web HYDROLA merupakan antarmuka utama (wajah sistem) yang bertugas memvisualisasikan data pemantauan kualitas air kolam akuaponik secara *real-time*. Sistem ini menerjemahkan data sensor yang masif (pH, DO, Suhu, TDS, NH3) dan prediksi kecerdasan buatan (AI) dari *edge computing* Jetson Nano menjadi indikator visual yang intuitif. Tujuan utamanya adalah memberikan sistem peringatan dini yang proaktif untuk mencegah kematian massal ikan nila akibat penumpukan amonia.

## 2. Tujuan & Sasaran (Objectives & Goals)

* **Aksesibilitas Tinggi:** Menyajikan *dashboard* pemantauan yang dapat diakses dengan cepat dan ringan, bahkan pada kondisi jaringan internet area pertanian yang tidak stabil (menggunakan optimasi SSR).


* **Translasi Data AI:** Menampilkan proyeksi atau tren kadar amonia bebas dalam beberapa hari ke depan (hasil dari algoritma LSTM dan Random Forest) ke dalam bentuk grafik dan status yang mudah dimengerti oleh operator kolam awam.


* **Stabilitas Sistem:** Mencegah *bottleneck* data dengan membaca *query* secara efisien dari InfluxDB dan memastikan layanan berjalan konsisten di dalam *container* Docker.



## 3. Target Pengguna (User Personas)

Aplikasi web ini difokuskan pada **Pengguna Akhir / Petani / Operator Lapangan**.
(Catatan: Kebutuhan analisis data mentah dan saintifik tingkat tinggi untuk dosen mitra dan tim riset akan diakomodasi secara terpisah melalui Grafana).

* **Kebutuhan Utama:** Indikator visual instan (Aman, Waspada, Kritis), grafik tren amonia yang simpel, dan log notifikasi peringatan.

## 4. Arsitektur & Teknologi Dasar

Sistem akan dibangun dengan *stack* teknologi berikut:

* **Front-end Framework:** Next.js (berperan vital untuk *Server-Side Rendering* dan optimasi performa pemuatan awal).


* **Styling:** Tailwind CSS (untuk pengembangan UI yang responsif dan konsisten).


* **Database Penarikan Data:** InfluxDB (Time-Series Database untuk mengelola fluks data sensor frekuensi tinggi tanpa *lagging*).


* **Infrastruktur Deployment:** Docker (seluruh aplikasi web akan dikontainerisasi agar dapat berjalan terisolasi dan stabil secara lokal di Jetson Nano).



## 5. Persyaratan Fungsional (Functional Requirements / FR)

**FR 1: Dashboard Monitoring Real-Time**

* Sistem harus menarik dan menampilkan data terbaru dari InfluxDB untuk parameter: pH, *Dissolved Oxygen* (DO), Suhu, dan Amonia (NH3).


* Data divisualisasikan dalam bentuk metrik angka dan grafik linier (*line chart*) sederhana.

**FR 2: Indikator Ambang Batas Kritis (Threshold Indicators)**
Sistem harus menampilkan *state* warna atau label peringatan berdasarkan parameter berikut:

* **pH:**
* BAIK: 6.5 - 8.5
* WASPADA: 6.0 - 6.5 atau 8.5 - 9.0
* KRITIS: < 6.0 atau > 9.0


* **DO (Oksigen Terlarut):**
* BAIK: > 5 mg/L
* WASPADA: 3 - 5 mg/L
* KRITIS: < 3 mg/L


* **Suhu:**
* BAIK: 25 - 30°C
* WASPADA: 22 - 25°C atau 30 - 32°C
* KRITIS: < 22°C atau > 32°C



**FR 3: Visualisasi Prediksi Tren Amonia (AI Layer)**

* Sistem harus menyediakan panel khusus yang menampilkan hasil kalkulasi dari model AI hibrida.


* Visualisasi tidak boleh berupa deret angka probabilitas rumit, melainkan grafik perkiraan cuaca/tren (misal: "Proyeksi Amonia 48 Jam ke Depan") dan status bahaya jika prediksi menyentuh ambang batas > 0.05 mg/L.



**FR 4: Log Riwayat Peringatan (Alert History)**

* Menampilkan tabel riwayat kapan parameter air menyentuh angka "Kritis".
* Log ini harus tersinkronisasi dengan waktu pengiriman *push notification* yang dieksekusi oleh Telegram Bot API.



## 6. Persyaratan Non-Fungsional (Non-Functional Requirements / NFR)

* **UI/UX (Desain Antarmuka):** Mengusung estetika *modern minimalist* yang *clean* dan bernuansa *high-tech*. Tata letak harus rapi, memiliki *whitespace* yang cukup, dan menonjolkan tipografi fungsional agar informasi langsung terbaca tanpa membebani kognitif pengguna awam.
* **Performa:** Kecepatan *render* halaman diutamakan menggunakan SSR pada Next.js, memastikan *dashboard* tidak *blank screen* saat koneksi sedang lemah.


* **Responsivitas:** Tampilan dijamin 100% *mobile-friendly*, mengingat kemungkinan besar operator kolam akan memantau melalui perangkat seluler cerdas saat berada di lapangan.
* **Local Network Capability:** Aplikasi web harus tetap dapat memuat seluruh *asset* (CSS, grafis) dengan sempurna meskipun *router* hanya terhubung ke jaringan *Intranet* / lokal sistem HYDROLA tanpa internet publik.



## 7. Fase Pengerjaan (Timeline Relevan)

Sesuai *roadmap* keseluruhan (Mei – November 2026), fokus utama divisi dalam 2 bulan pertama adalah:

* **Bulan 1 (Mei):** Menyelesaikan desain UI (Wireframing/Prototyping), perancangan sistem, dan estimasi biaya (RAB) *software*.


* **Bulan 2 (Juni):** Memulai instalasi lingkungan kerja lokal, penulisan kode Next.js, dan integrasi awal dengan InfluxDB simulasi (Fase Perancangan Software).

