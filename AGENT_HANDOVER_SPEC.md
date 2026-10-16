# REVELATION GROUP — DOKUMEN HANDOVER & SPESIFIKASI LENGKAP (UNTUK AGENT SELANJUTNYA)

> **Tujuan Dokumen Ini:**  
> Dokumen ini merangkum seluruh arsitektur, aturan bisnis, desain UI/UX, struktur database, fitur yang sudah diimplementasikan, serta riwayat keputusan produk pada aplikasi web **Revelation Group (Multi-Business Management Web App)**. Agent atau developer berikutnya dapat membaca satu file ini untuk langsung memahami konteks penuh dan melanjutkan pengembangan tanpa kehilangan detail sedikit pun.

---

## 1. Gambaran Umum Proyek & Lokasi Direktori

- **Nama Aplikasi:** Revelation Group — Multi-Business Management Web App
- **Lokasi Proyek:** `/Users/davidcalvin/Revelation Group`
- **Tech Stack:**
  - **Frontend:** React 18 + TypeScript + Vite 6
  - **Routing:** `react-router-dom` v6
  - **Styling:** Tailwind CSS v3 + Custom CSS (`src/index.css`)
  - **Icons:** `lucide-react` + Custom Editorial SVG Doodles (`src/components/Doodles.tsx`)
  - **Database & Persistensi:** Dual-Storage Architecture:
    1. `localStorage` (`revelation_group_db_v1`) untuk kecepatan instan & offline resilience.
    2. **Google Sheets Real-Time Database** via Google Apps Script Web App (`google-apps-script/Code.gs`) yang terhubung ke akun Owner/Super Admin (`david.calvin89@gmail.com`).
    3. **1-Click Export Excel (`.xls`)** multi-worksheet di `src/services/googleSheetsService.ts`.
- **Perintah Build & Verifikasi di Mac User:**
  - Binary Node berada di `/usr/local/bin/node`.
  - Cek TypeScript: `/usr/local/bin/node ./node_modules/typescript/bin/tsc -b`
  - Build Production: `/usr/local/bin/node ./node_modules/vite/bin/vite.js build`
  - Jalankan Dev Server: `npm run dev` (atau `/usr/local/bin/node ./node_modules/vite/bin/vite.js`)

---

## 2. Desain Visual & Tema ("Playful Editorial & Clean Card UI")

Aplikasi ini mengusung tema **Playful Editorial & Clean Card UI** dengan karakteristik:
1. **Palet Warna Utama (`tailwind.config.js`):**
   - `cream` (`#FAF7F2`): Background utama halaman yang hangat dan bersih.
   - `surface` (`#FFFFFF`): Kartu dan permukaan komponen.
   - `ink` (`#111827`): Teks utama charcoal gelap & warna tombol utama.
   - `cobalt` (`#1A45E5`): Warna aksen brand utama (judul halaman, fokus input, aksen aktif).
   - **Warna Aksen Pastel Bisnis:**
     - `pastel-yellow`: `#FDE047`
     - `pastel-lavender`: `#DDD6FE`
     - `pastel-coral`: `#F25C54`
     - `pastel-blue`: `#DBEAFE`
     - Mint Hijau: `#BBF7D0`, Peach: `#FED7AA`, Pink Rose: `#FBCFE8`
   - **Indikator Finansial:**
     - **PROFIT:** `profit-bg` (`#DCFCE7`), `profit-text` (`#15803D`), `profit-accent` (`#22C55E`)
     - **LOSS:** `loss-bg` (`#FEE2E2`), `loss-text` (`#B91C1C`), `loss-accent` (`#EF4444`)
2. **Tipografi:**
   - `font-serif` (*Fraunces*): Digunakan untuk angka nominal Rupiah utama, metrik, dan judul halaman editorial.
   - `font-sans` (*Plus Jakarta Sans*): Digunakan untuk tabel, label, form, dan navigasi.
   - `font-hand` (*Caveat*): Digunakan untuk sub-label aksen tulisan tangan dan catatan dekoratif.
3. **Aturan Penting Modal Backdrop (`!m-0 z-[100]`):**
   - Semua container halaman menggunakan `space-y-8`.
   - Oleh karena itu, setiap elemen modal dengan `fixed inset-0` yang berada langsung di dalam container `space-y-8` **WAJIB** menyertakan class `!m-0 z-[100]` (contoh: `<div className="fixed inset-0 !m-0 z-[100] bg-ink/50 backdrop-blur-sm ...">`) agar `margin-top` dari `space-y-8` tidak membuat celah kosong di bagian atas layar.

---

## 3. Sistem Role, Autentikasi, & Hak Akses (RBAC)

Terdapat **3 Role Pengguna** dengan aturan ketat:

1. **Super Admin (`super_admin`) — Hard-Locked ke `david.calvin89@gmail.com`:**
   - Hanya akun dengan email `david.calvin89@gmail.com` yang dapat memiliki role `super_admin` (`enforceSuperAdminLock` di `src/context/AppContext.tsx`).
   - Memiliki akses penuh ke seluruh halaman termasuk halaman eksklusif **`/super-admin`**.
   - Dapat mengundang user baru (`admin` atau `member`), mengubah role/status user, mengatur integrasi Google Sheets Webhook, serta mereset seed data.
2. **Partner Admin (`admin`) — Rekan Bisnis (misal: Hendra Wijaya, Siska Pratama, Budi Santoso, Rina Kusuma):**
   - Variabel helper: `canManageBusinessAndProducts = isSuperAdmin || currentUser.role === 'admin'`.
   - Dapat mengakses:
     - **Global Dashboard (`/dashboard`)**
     - **Business Dashboard (`/business/:businessId/dashboard`)**
     - **Input Transaksi (`/transactions`)**
     - **Kelola Bisnis (`/businesses`)** — tambah, edit, arsip, hapus bisnis.
     - **Produk & HPP (`/products` & `/business/:businessId/products`)** — tambah, edit, hapus produk & kalkulator HPP.
     - **Kas & Rekening Bank Bersama Partner** di Global Dashboard — **Partner Admin BOLEH** mengatur **Saldo Awal Bank (`Atur Saldo Awal`)** dan melakukan **Rekonsiliasi Saldo Bank (`Rekonsiliasi Saldo Bank`)**.
   - **TIDAK BISA** mengakses `/super-admin` (otomatis diarahkan ke `/404`).
3. **Member / Staf Inputer (`member`):**
   - **HANYA** dapat mengakses halaman **Input Transaksi (`/transactions`)** untuk mencatat penjualan harian dan pengeluaran operasional.
   - Jika mencoba membuka `/dashboard`, `/businesses`, `/products`, atau `/super-admin`, sistem otomatis mengarahkan mereka ke `/transactions` (atau `/404` untuk `/super-admin`).
   - Tidak dapat menghapus riwayat transaksi dan tidak dapat mengatur saldo bank.

### Batasan Nama User (`maxLength={20}` & Tanpa Tanda Kurung Role):
- Seluruh nama user (`full_name`) dibatasi **maksimum 20 karakter termasuk spasi** (`maxLength={20}`) dan otomatis dibersihkan dari embel-embel dalam kurung seperti `(Owner)` atau `(Partner 1)` menggunakan `stripParenthesesFromName()` di `AppContext.tsx`.

---

## 4. Rincian Fitur yang Sudah Diimplementasikan per Halaman

### A. Navigasi Utama (`src/components/Layout.tsx` & `src/components/CustomSelect.tsx`)
- **Model Navigasi:** Menggunakan **Single-Row Integrated Topbar** di mana Logo Brand (`Revelation Group`), Menu Navigasi Tengah (`Global Dashboard`, `Input Transaksi`, `Kelola Bisnis`, `Produk & HPP`, `Super Admin`), Dropdown Switcher Bisnis (`Semua Bisnis (Global)` + daftar bisnis aktif), dan Pill Switcher Akun User berada dalam satu baris header yang rapi.
- **Logo Bisnis di Dropdown:** Jika suatu unit bisnis memiliki foto/logo (`logo_url`), maka di seluruh dropdown (`CustomSelect`) lingkaran warna pastel otomatis digantikan oleh gambar logo bisnis tersebut (`object-cover`). Jika belum ada logo, tetap menampilkan lingkaran warna pastel bisnis tersebut.
- **Switcher User Compact:** Pill pemilih user di pojok kanan atas dibuat ringkas (`max-w-[165px]`), menampilkan nama user (maks 20 karakter) tanpa embel-embel dalam kurung.

### B. Halaman Login & Lupa Password (`src/pages/LoginPage.tsx`) & Setup Password Undangan (`src/pages/SetupPasswordPage.tsx`)
- **Desain Kartu Login:**
  - Memiliki dekorasi kartu bertumpuk miring (`rotate-[2deg]` dan `-rotate-[1.5deg]`), pita kuning `"PORTAL INTERNAL RESMI"` di bagian atas, serta aksen sudut.
  - Tidak ada tombol Login Google, tidak ada badge `"Google Sheets Ready"`, dan tidak ada bagian `"Login Cepat Sesuai Role"` di kartu login.
  - Field input tidak menggunakan label di luar kotak, melainkan langsung menggunakan placeholder **`"E-mail"`** (dengan ikon amplop) dan **`"Password"`** (dengan ikon gembok) di dalam kotak input.
  - Terdapat **2 tombol bersebelahan**:
    1. Tombol **`Login`** (hitam solid, fleksibel).
    2. Tombol **`Lupa Password`** di sebelahnya.
- **Alur Popup Lupa Password:**
  - Saat **`Lupa Password`** diklik, muncul popup modal 2-tahap:
    - **Tahap 1 (`input`):** User mengisi alamat E-mail terdaftar lalu klik **`Kirim Password`**.
    - **Tahap 2 (`confirmed`):** Menampilkan halaman konfirmasi di dalam popup bahwa password telah dikirimkan ke alamat email yang ditulis (serta memicu action `sendForgotPasswordEmail` ke Google Apps Script jika webhook aktif).
- **Alur Undangan User Baru & Setup Password (`/setup-password`):**
  - Saat Super Admin (`david.calvin89@gmail.com`) mengundang user baru di `/super-admin`, sistem men-generate **Password Lama (Sementara)** (contoh: `REV-4829`) dan **Link Undangan yang memiliki batas waktu kadaluarsa 5 menit (`invite_expires_at = Date.now() + 5 * 60 * 1000`)**.
  - Ketika user membuka link `/setup-password?token=...&email=...`:
    - Jika sudah lewat 5 menit, halaman menolak akses dan menampilkan pesan bahwa link sudah kadaluarsa.
    - Jika masih berlaku, user wajib memasukkan **Password Lama (Sementara)** dari email dan **Password Baru** pilihan mereka untuk mengaktifkan akun.

### C. Filter Tanggal Seragam di Dashboard (`src/components/DashboardDateFilterBar.tsx`)
- Digunakan baik di **Global Dashboard (`/dashboard`)** maupun **Business Dashboard (`/business/:businessId/dashboard`)**.
- **1 Baris (Single-Line) dengan tinggi seragam (`h-8`)**:
  - Tombol preset: `7 Hari`, `15 Hari`, `30 Hari`, `60 Hari`, `90 Hari`, `1 Tahun`, `All Time`, dan tombol **`📅 Pilih Tanggal`**.
- **Popover Kalender `📅 Pilih Tanggal`:**
  - Default-nya adalah pemilihan **1 Tanggal Spesifik** (1 kalender).
  - Di bagian paling bawah popover terdapat toggle switch **`Rentang Tanggal` (ON/OFF)**.
  - Jika **`Rentang Tanggal`** diaktifkan (ON), popover melebar dan menampilkan **2 kalender berdampingan** (`Dari Tanggal` & `Sampai Tanggal`).
- Seluruh perhitungan filter waktu mengacu pada **`transaction_date`** (mendukung penuh input transaksi backdate/mundur tanggal).

### D. Global Dashboard (`src/pages/GlobalDashboardPage.tsx`)
1. **Header:**
   - Teks subjudul memiliki line-break tepat sebelum kata `"berdasarkan tanggal transaksi."` dan sejajar dengan bar filter tanggal di sebelah kanan.
2. **Panel Kas & Rekening Bank Bersama Partner (`BankSettings` & `BalanceAdjustment`):**
   - Menampilkan **4 Kotak Ringkasan Rekening Bank Partner**:
     1. **1. Saldo Awal Bank** (`bank_settings.opening_balance` beserta tanggal `opening_date`).
     2. **2. Laba/Rugi Bersih & R&D (All-Time)** (akumulasi seluruh laba/rugi bersih bisnis dikurangi pengeluaran R&D pusat).
     3. **3. Penyesuaian Rekonsiliasi** (akumulasi koreksi saldo dari `balance_adjustments`).
     4. **4. SALDO AKHIR BANK SAAT INI** (`Saldo Awal + Laba/Rugi Bersih All-Time ± Rekonsiliasi`).
   - **Kontrol untuk Partner Admin & Super Admin (`canManageBusinessAndProducts`):**
     - Tombol **`Atur Saldo Awal`**: Membuka modal untuk mengubah nama bank/rekening bersama, nominal saldo awal, dan tanggal pencatatan saldo awal.
     - Tombol **`Rekonsiliasi Saldo Bank`**: Membuka modal ketika saldo di mutasi bank tidak seimbang dengan catatan buku Revelation. User cukup mengetik **Saldo Riil di Bank Saat Ini (Rp)** dan **Catatan / Alasan Penyesuaian** (misal: biaya admin bank, pajak/bunga, atau selisih opname). Sistem otomatis menghitung selisih koreksinya (`actual_bank_balance - system_balance_before`) dan menyeimbangkan saldo akhir.
     - Tombol **`Riwayat (N)`**: Membuka daftar log audit seluruh rekonsiliasi saldo yang pernah dilakukan beserta nama penginputnya.
3. **3 Kartu Ringkasan Periode:**
   - **1. Total Omzet Gabungan**
   - **2. Total Pengeluaran (HPP + Ops + R&D)** — merinci *Total Beban HPP (COGS)*, *Operasional Unit Bisnis*, dan *🧪 Dana R&D / Pusat*.
   - **3. Laba / Rugi Bersih Global**
4. **Tabel Performa Antar Bisnis & Alokasi Dana R&D:**
   - Menampilkan performa murni tiap unit bisnis aktif (Omzet, Total HPP, Operasional, Laba/Rugi Bersih, Status).
   - Di bawah daftar bisnis (tepat di atas baris Grand Total), terdapat baris khusus **`🧪 Dana R&D & Beban Pusat (Holding)`** yang menampilkan total pengeluaran R&D periode tersebut tanpa mengotori rapor bisnis individu.
   - Baris footer **`TOTAL GABUNGAN REVELATION GROUP`** menghitung total konsolidasi setelah dikurangi beban R&D.

### E. Business Dashboard Spesifik (`src/pages/BusinessDashboardPage.tsx`)
- Dilengkapi **`DashboardDateFilterBar`** di bagian kanan header kartu bisnis.
- **Visualisasi Produk Terlaris & Kontributor Laba (`Produk Terlaris & Kontributor Laba`):**
  - Menampilkan **Seluruh Produk yang Terjual** (diurutkan dari kontribusi laba tertinggi).
  - **3 Produk Teratas** diberikan highlight spesial (`★ TOP #1` emas, `★ TOP #2` lavender, `★ TOP #3` biru).
  - Dilengkapi **Donut Chart SVG Bundar** di sisi kiri yang memvisualisasikan proporsi/persentase kontribusi laba tiap produk terhadap total laba kotor bisnis, serta **Circular Percentage Progress Ring** bundar pada masing-masing kartu produk.

### F. Input Transaksi & Dana R&D (`src/pages/TransactionsPage.tsx`)
- **Top Picker Card:**
  - **1. Pilih Tanggal Transaksi** (4 kolom, komponen `CustomDatePicker` dengan format tanggal Indonesia lengkap seperti `Kamis, 16 Oktober 2026`, mendukung backdate).
  - **2. Pilih Unit Bisnis / Pos Dana R&D Revelation Group** (8 kolom, komponen `CustomSelect` berukuran besar).
- **Pilihan Khusus Dana R&D (`HOLDING_RND`):**
  - Di dalam dropdown bisnis terdapat opsi **`🧪 Revelation Group — Dana R&D / Pusat (Non-Bisnis)`**.
  - Saat dipilih, tab otomatis berpindah ke **Tab 2 — Input Dana R&D / Pengeluaran Pusat** dan menyediakan kategori khusus R&D:
    - *Riset & Pengembangan Produk (R&D)*
    - *Eksperimen / Trial Bisnis Baru*
    - *Pembelian Alat & Sampel R&D*
    - *Biaya Legal & Administrasi Grup*
    - *Lain-lain R&D / Holding*
- **Riwayat Transaksi:**
  - Setiap item penjualan maupun biaya operasional/R&D menampilkan badge **`Diinput oleh: [Nama User]`**.
  - Pengeluaran R&D ditandai dengan badge kuning **`🧪 Dana R&D / Pusat`**.

### G. Kelola Unit Bisnis (`src/pages/BusinessesPage.tsx`)
- **Desain Kartu Bisnis:**
  - Tidak menggunakan bar warna di bagian atas kartu.
  - Sebagai gantinya, **3 kotak metrik di tengah kartu (`Total Produk`, `Total Omzet`, `Status All-Time`) menggunakan warna latar pastel sesuai warna identitas bisnis (`business.card_accent_color`)**.
  - **4 Tombol Aksi Berbentuk Ikon Bulat** (`Kelola Produk & HPP`, `Edit Profil`, `Arsipkan/Aktifkan`, `Hapus`) diletakkan di bagian **footer kanan bawah kartu** (sebaris dengan tanggal dibuat), dan saat di-hover berubah warna mengikuti warna pastel bisnis (`hover:bg-[var(--biz-accent)]`).
- **Urutan Kartu Bisnis Aktif vs Arsip:**
  - Bisnis yang **diarsipkan (`is_archived: true`)** otomatis dipindahkan ke **urutan paling bawah**.
  - Bisnis yang **diaktifkan kembali dari arsip** otomatis diletakkan di **urutan paling bawah dari daftar bisnis aktif**.
- **Upload Logo Bisnis:**
  - Mendukung upload gambar dari perangkat (otomatis di-resize & dikompresi ke Base64 Data URL maks `256x256` di client-side agar ringan disimpan di `localStorage` dan Google Sheets).

### H. Kalkulator Produk & HPP (`src/pages/ProductsHppPage.tsx`)
- **Auto-Generated SKU (`generateProductSku` di `src/utils/calculations.ts`):**
  - User tidak perlu mengetik SKU manual. Sistem otomatis membuat kode SKU dengan format `[KODE_BISNIS]-[URUTAN_2_DIGIT]-[KODE_PRODUK]` (contoh: `KNS-01-KSS`).
- **4 Kotak Metrik Produk (1 Baris Tanpa Wrap):**
  - Kotak `Total HPP Aktif`, `Harga Jual`, `Laba Kotor / Pcs`, dan `Margin Kotor` menggunakan fungsi **`getDynamicMetricFontSize()`** dan `whitespace-nowrap` sehingga nominal Rupiah sebesar apa pun otomatis menyesuaikan ukuran font dan selalu muat dalam **1 baris**.
- **Scroll Rincian Komponen HPP:**
  - Daftar rincian komponen HPP pada kartu produk dibatasi tingginya (`max-h-[72px] overflow-y-auto revelation-scroll`) sehingga jika komponen lebih dari 3 item, kartu tetap rapi dan daftarnya bisa di-scroll halus.
- **Historical Snapshot Safe:**
  - Mengubah HPP atau Harga Jual produk hanya memperbarui `current_total_hpp` dan `current_selling_price` untuk transaksi berikutnya; transaksi masa lalu di `sales_transactions` tetap menggunakan `hpp_snapshot` dan `selling_price_snapshot` saat transaksi tersebut dibuat.

---

## 5. Struktur File Utama

```text
/Users/davidcalvin/Revelation Group/
├── AGENT_HANDOVER_SPEC.md          # Dokumen handover lengkap ini
├── README.md                       # Ringkasan proyek
├── google-apps-script/
│   └── Code.gs                     # Script backend Google Sheets (7 tabel + kirim email)
├── src/
│   ├── types.ts                    # Definisi interface TypeScript & konstanta HOLDING_RND_ID
│   ├── index.css                   # Styling global, utility editorial, & custom scrollbar
│   ├── App.tsx                     # Konfigurasi route & proteksi RBAC
│   ├── context/
│   │   └── AppContext.tsx          # State utama, CRUD bisnis/produk/transaksi/bank, & sync
│   ├── data/
│   │   └── seedData.ts             # Data awal (users, businesses, products, transactions, R&D, bank)
│   ├── services/
│   │   └── googleSheetsService.ts  # Fetch/Post ke Google Sheets + Export Excel (.xls)
│   ├── utils/
│   │   └── calculations.ts         # Kalkulasi Laba/Rugi, filter tanggal, format Rupiah, & auto-SKU
│   ├── components/
│   │   ├── Layout.tsx              # Single-row topbar navigation & user/business switchers
│   │   ├── IosInstallPrompt.tsx    # Panduan otomatis Add to Home Screen di Safari iPhone
│   │   ├── DashboardDateFilterBar.tsx # Bar filter rentang waktu + kalender single/range
│   │   ├── CustomDatePicker.tsx    # Pemilih tanggal interaktif berbahasa Indonesia
│   │   ├── CustomSelect.tsx        # Dropdown custom dengan dukungan logo bisnis & aksen warna
│   │   └── Doodles.tsx             # Komponen badge Profit/Loss & elemen grafis editorial
│   └── pages/
│       ├── LoginPage.tsx           # Halaman login & popup 2-langkah Lupa Password
│       ├── SetupPasswordPage.tsx   # Halaman aktivasi password undangan (expired 5 menit)
│       ├── GlobalDashboardPage.tsx # Dashboard konsolidasi, Kas/Bank Partner, Rekonsiliasi, & R&D
│       ├── BusinessDashboardPage.tsx # Dashboard per bisnis + Donut Chart & Top 3 Produk
│       ├── TransactionsPage.tsx    # Input penjualan harian, biaya operasional, & Dana R&D
│       ├── BusinessesPage.tsx      # CRUD unit bisnis + upload logo + arsip
│       ├── ProductsHppPage.tsx     # CRUD produk & kalkulator HPP dual-mode
│       ├── SuperAdminPage.tsx      # Manajemen user, undangan 5 menit, & konfigurasi Google Sheets
│       └── NotFoundPage.tsx        # Halaman 404 proteksi akses
├── public/
│   ├── manifest.json               # Web App Manifest PWA (standalone, orientation portrait)
│   ├── sw.js                       # Service Worker caching & offline capabilities
│   ├── apple-touch-icon.png        # Icon resmi iOS Home Screen (180x180 px)
│   ├── pwa-192x192.png             # Icon PWA 192x192 px
│   ├── pwa-512x512.png             # Icon PWA 512x512 px (maskable)
│   ├── favicon-32x32.png           # Favicon 32x32 px
│   ├── icon-ios.svg                # Master vector icon solid
│   └── icon.svg                    # SVG icon
```

---

## 6. Rumus Inti yang Wajib Dijaga Konsistensinya

1. **Laba Kotor Transaksi Penjualan (`gross_profit`):**
   $$\text{Gross Profit} = (\text{Qty} \times \text{Selling Price Snapshot}) - (\text{Qty} \times \text{HPP Snapshot})$$
2. **Laba / Rugi Bersih Unit Bisnis (`net_profit_or_loss`):**
   $$\text{Net Profit Bisnis} = \text{Gross Profit Bisnis} - \text{Biaya Operasional Bisnis}$$
   *(Tidak dikurangi beban `HOLDING_RND` agar performa tiap bisnis tetap murni).*
3. **Laba / Rugi Bersih Konsolidasi Grup (`globalSummary.net_profit_or_loss`):**
   $$\text{Net Profit Global} = \text{Total Gross Profit Seluruh Bisnis} - (\text{Total Operasional Bisnis} + \text{Total Dana R\&D Pusat})$$
4. **Saldo Akhir Rekening Bank Bersama Partner (`currentBankBalance`):**
   $$\text{Saldo Akhir Bank} = \text{Saldo Awal Bank} + \text{Net Profit Global (All-Time)} + \sum \text{Selisih Rekonsiliasi Saldo}$$

---

## 7. Optimasi Mobile & Dukungan PWA iPhone (iOS Add to Home Screen)

Aplikasi telah dikonfigurasi penuh agar saat dibuka di **iPhone (Safari)** dapat di-**Add to Home Screen** dan berjalan **layaknya aplikasi native (Standalone App)**:
1. **Asset Ikon Khusus iOS & PWA:**
   - `apple-touch-icon.png` (180×180 px) dihasilkan dengan latar solid Cobalt Blue (`#1A45E5`) dan huruf `R` putih + dot kuning emas. iOS secara otomatis memotongnya menjadi squircle khas iPhone tanpa tepi hitam.
   - `pwa-192x192.png` & `pwa-512x512.png` untuk Android/Desktop PWA.
2. **Meta Tag Standalone di `index.html`:**
   - `<meta name="apple-mobile-web-app-capable" content="yes" />`
   - `<meta name="apple-mobile-web-app-status-bar-style" content="default" />` (mengikuti warna cream `#FAF7F2`).
   - `<meta name="apple-mobile-web-app-title" content="Revelation" />` (nama pendek agar tidak terpotong di homescreen iPhone).
   - `<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />` (mencegah auto-zoom input iOS dan mendukung Dynamic Island / Notch).
   - `<meta name="format-detection" content="telephone=no" />` (mencegah angka nominal Rupiah berubah jadi tautan telepon di iOS).
3. **Safe Area Insets (iPhone Notch, Dynamic Island, & Home Indicator):**
   - Menggunakan utility `.pt-safe`, `.pb-safe`, dan `viewport-fit=cover`.
   - Header atas memiliki padding `pt-safe` sehingga tidak tertutup Dynamic Island / Notch.
   - Bilah navigasi bawah (`Mobile Bottom Navigation Bar`) memiliki padding `pb-safe` sehingga tidak bertabrakan dengan garis swipe home iPhone.
4. **Service Worker (`public/sw.js`):**
   - Terdaftar di `src/main.tsx` untuk meng-cache asset statis dan shell halaman sehingga aplikasi responsif dan memenuhi kriteria installable PWA.
5. **Panduan Visual Add to Home Screen (`src/components/IosInstallPrompt.tsx`):**
   - Otomatis mendeteksi perangkat iOS di Safari browser (bukan standalone).
   - Menampilkan popup panduan praktis 3 langkah: Ketuk tombol **Bagikan (Share)** -> Pilih **Tambah ke Layar Utama (Add to Home Screen)** -> Ketuk **Tambah (Add)**.

---

## 8. Cyber Security Hardening & Perlindungan Hacker

Aplikasi telah diperkuat dengan arsitektur pertahanan siber menyeluruh:

1. **Autentikasi API Secret Key (Google Apps Script Endpoint):**
   - `google-apps-script/Code.gs` dan `src/services/googleSheetsService.ts` dilindungi oleh token otentikasi rahasia (`API_SECRET`).
   - Setiap panggilan `GET` wajib menyertakan parameter `?key=...` dan panggilan `POST` wajib menyertakan `apiKey: "..."`.
   - Permintaan tanpa token yang cocok akan langsung ditolak (`HTTP 401 Unauthorized`), mencegah pihak asing membaca atau merusak spreadsheet Revelation Group.
   - Kunci rahasia dapat dikonfigurasi langsung oleh Super Admin di menu **Super Admin > Integrasi Google Sheets**.

2. **Pengamanan Password Pengguna (Salted SHA-256):**
   - File `src/utils/security.ts` mengimplementasikan fungsi kriptografi SHA-256 murni zero-dependency.
   - Password disimpan dalam bentuk hash terenkripsi dengan salt aplikasi (`rev_secure_salt_v1_`), bukan teks polos (*plaintext*).
   - Mendukung migrasi transparan: pengguna dengan password lama akan otomatis di-upgrade ke salted hash saat login berikutnya.

3. **Pencegahan Open Email Relay di Apps Script:**
   - Aksi `sendForgotPasswordEmail` di `Code.gs` memverifikasi terlebih dahulu apakah email penerima benar-benar terdaftar di lembar kerja `users`.
   - Menutup celah penyerang menggunakan webhook Google Apps Script sebagai server pengirim spam/phishing massal.

4. **Mitigasi CSV / Excel Formula Injection (DDE):**
   - Pada fitur Export Excel (`exportDatabaseToExcel`), seluruh data string yang berawalan karakter formula bahaya (`=`, `+`, `-`, `@`, `\t`, `\r`) secara otomatis di-escape dengan tanda kutip tunggal (`'`).
   - Mencegah eksekusi script atau perintah shell berbahaya saat spreadsheet dibuka di Microsoft Excel.

5. **Sanitasi URL Gambar & Logo Bisnis (Anti-XSS):**
   - URL logo pada `BusinessesPage.tsx` divalidasi dengan `isSafeImageUrl()`, hanya mengizinkan `data:image/`, `https://`, atau `http://`.
   - Protokol berbahaya seperti `javascript:` atau `data:text/html` diblokir total.

---

## 9. Arsip Elemen Desain & Supresi Netlify HUD Badge

Sesuai permintaan pemilik proyek, bagian ini mencatat elemen yang telah dilepas dan solusi penyembunyian badge Netlify:

### A. Catatan Kode Elemen Login yang Dihapus ("Catat Dulu")
Jika sewaktu-waktu ingin diaktifkan kembali, berikut cuplikan kode asli yang sebelumnya berada di `src/pages/LoginPage.tsx`:

1. **Emblem "R" & Pill Versi Header:**
   ```tsx
   <div className="inline-flex items-center justify-center mb-4">
     <div className="w-14 h-14 rounded-2xl bg-cobalt border-2 border-ink shadow-[4px_4px_0px_#111827] flex items-center justify-center text-white font-serif font-extrabold text-2xl -rotate-3 relative">
       R
       <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-pastel-yellow border-2 border-ink" />
     </div>
   </div>
   <div>
     <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-pastel-lavender/90 border border-ink/15 text-ink text-xs font-extrabold mb-3 shadow-sm">
       <span>✨ REVELATION GROUP • MULTI-BUSINESS PORTAL v1.2.0</span>
     </div>
   </div>
   ```

2. **3 Kartu Fitur Mini di Bawah Form Login:**
   ```tsx
   <div className="mt-6 pt-5 border-t border-dashed border-ink/15 grid grid-cols-3 gap-2 text-center">
     <div className="p-2 rounded-xl bg-pastel-blue/40 border border-ink/10">
       <Layers className="w-3.5 h-3.5 text-cobalt mx-auto mb-0.5" />
       <span className="text-[10px] font-extrabold text-ink/80 block leading-tight">Multi-Bisnis</span>
     </div>
     <div className="p-2 rounded-xl bg-pastel-yellow/45 border border-ink/10">
       <Sparkles className="w-3.5 h-3.5 text-ink mx-auto mb-0.5" />
       <span className="text-[10px] font-extrabold text-ink/80 block leading-tight">Kalkulator HPP</span>
     </div>
     <div className="p-2 rounded-xl bg-pastel-lavender/50 border border-ink/10">
       <ShieldCheck className="w-3.5 h-3.5 text-cobalt mx-auto mb-0.5" />
       <span className="text-[10px] font-extrabold text-ink/80 block leading-tight">Akses Aman</span>
     </div>
   </div>
   ```

### B. Supresi Badge "Powered by Netlify" ("Tutupi Ini, Catat")
Badge mengambang *"Powered by Netlify"* diinjeksi secara dinamis oleh Netlify Edge melalui script `/.netlify/scripts/hud?variant=public` yang me-mount iframe `#nl-badge-frame`.

**Solusi yang Diterapkan:**
1. **Aturan CSS di `src/index.css`:**
   Menyembunyikan `#nl-badge-frame`, `iframe[title*="Netlify"]`, `.nl-wrap`, `.nl-badge`, dan kelas terkait menggunakan `display: none !important; opacity: 0 !important; pointer-events: none !important; clip-path: path("M0 0Z") !important; z-index: -999999 !important;`.
2. **Skrip DOM MutationObserver di `index.html`:**
   Mendeteksi keberadaan elemen `#nl-badge-frame` dan script Netlify HUD secara seketika saat di-mount ke DOM lalu langsung menghapusnya (`remove()`).
3. **Panduan Dashboard Netlify (Permanen Rp 0):**
   Untuk menonaktifkan sepenuhnya dari sisi server Netlify:
   - Buka akun Netlify -> Pilih proyek **revelation-group**.
   - Masuk ke menu **Project configuration** -> **General** -> cari bagian **Powered by Netlify badge**.
   - Alihkan tombol toggle ke posisi **Off** dan Simpan.

