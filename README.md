# Revelation Group — Multi-Business Management Web App (v1.2.0)

Aplikasi web manajemen multi-bisnis terpusat (**Mobile-First PWA**) untuk **Revelation Group** guna mencatat profil bisnis, kalkulasi HPP (COGS) produk dual-mode, pencatatan transaksi penjualan & biaya operasional per tanggal (mendukung **backdate**), serta dashboard analitik Laba/Rugi per bisnis dan konsolidasi seluruh bisnis.

## ✨ Fitur Utama & Spesifikasi

1. **Super Admin Hard-Locked (`david.calvin89@gmail.com`)**
   - Halaman eksklusif `/super-admin` hanya dapat diakses oleh `david.calvin89@gmail.com`.
   - Jika `admin` (4 Rekan Bisnis) atau `member` (Staf Inputer) mencoba mengakses `/super-admin`, sistem otomatis mengarahkan mereka ke `/404`.
2. **Integrasi Google Sheets Real-Time Database + Export Excel (`.xls`)**
   - Dilengkapi kode **Google Apps Script (`google-apps-script/Code.gs`)** yang otomatis membuat 5 worksheet di Google Sheets akun `david.calvin89@gmail.com`:
     - `users`
     - `businesses`
     - `products`
     - `sales_transactions`
     - `operational_expenses`
   - Dilengkapi tombol **Export Excel** 1-klik untuk mengunduh seluruh 5 tabel ke file `.xls`.
3. **Dual-Mode Kalkulator HPP (COGS) & Historical Snapshot**
   - **Mode 1 (Direct)**: Input total HPP langsung.
   - **Mode 2 (Itemized)**: Rincian komponen bahan baku & kemasan yang dijumlahkan otomatis.
   - **Historical Snapshot**: Perubahan HPP dan Harga Jual hanya berlaku untuk transaksi baru ke depan, tidak mengubah `hpp_snapshot` dan `selling_price_snapshot` pada transaksi masa lalu.
4. **Filter Rentang Waktu Berbasis `transaction_date`**
   - Filter `7 Hari`, `15 Hari`, `30 Hari`, `60 Hari`, `90 Hari`, `1 Tahun`, dan `All Time` dihitung berdasarkan tanggal terjadinya transaksi (`transaction_date`), mendukung penuh input transaksi mundur tanggal (**Backdate**).

## 🚀 Cara Menjalankan Aplikasi

```bash
npm install
npm run dev
```
Lalu buka URL yang muncul di terminal (default: `http://localhost:5173`).
