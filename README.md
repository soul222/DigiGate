# DigiGate - Smart Gate Management System

DigiGate adalah sistem manajemen gerbang pintar berbasis IoT dan AI yang mengintegrasikan deteksi plat nomor kendaraan (OCR), manajemen pengunjung, dan kontrol akses real-time.

## 🏗 Arsitektur Sistem

Sistem ini terdiri dari 3 layanan utama:

1.  **Frontend (`fe`)**: Dashboard Web berbasis Vue 3 + TailwindCSS.
2.  **Backend (`backend`)**: REST API berbasis Express.js + Supabase.
3.  **OCR Service (`ocr-service`)**: Microservice Python untuk deteksi plat nomor menggunakan YOLO & PaddleOCR.

## 🛠 Teknologi

*   **Frontend**: Vue 3, Pinia, Vue Router, TailwindCSS, Socket.IO Client.
*   **Backend**: Node.js, Express, Supabase (Database & Auth), Socket.IO (Real-time).
*   **AI/ML**: Python, Flask, YOLO (Object Detection), PaddleOCR (Text Recognition).

---

## 🚀 Panduan Instalasi & Setup

Ikuti langkah-langkah berikut untuk menjalankan sistem di komputer lokal Anda.

### 1. Clone Repository

```bash
git clone https://github.com/username/digigate.git
cd digigate
```

### 2. Setup Backend (Node.js)

Masuk ke folder backend dan install dependencies.

```bash
cd backend
npm install
```

**Konfigurasi Environment Variable:**
Buat file `.env` di dalam folder `backend/` dan isi dengan konfigurasi berikut:

```env
PORT=3001
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
OCR_SERVICE_URL=http://localhost:5000
```

> **Catatan:** Pastikan Anda sudah membuat project di Supabase dan menjalankan skrip migrasi database yang ada di folder `migrations/`.

**Jalankan Backend:**

```bash
npm run dev
```

Backend akan berjalan di `http://localhost:3001`.

### 3. Setup Frontend (Vue.js)

Buka terminal baru, masuk ke folder frontend.

```bash
cd fe
npm install
```

**Konfigurasi Environment Variable:**
Buat file `.env` di dalam folder `fe/` (jika belum ada, biasanya Vite baca dari root tapi praktek terbaik buat `.env`):

```env
VITE_API_URL=http://localhost:3001/api
VITE_SOCKET_URL=http://localhost:3001
```

**Jalankan Frontend:**

```bash
npm run dev
```

Frontend akan berjalan di `http://localhost:5173`.

### 4. Setup OCR Service (Python)

Buka terminal baru, masuk ke folder OCR service.

**Prasyarat:** Python 3.8+ terinstall.

```bash
cd ocr-service/python
```

**Setup Virtual Environment (Opsional tapi Direkomendasikan):**

```bash
python -m venv venv
# Windows
.\venv\Scripts\activate
# Mac/Linux
source venv/bin/activate
```

**Install Dependencies:**

```bash
pip install -r requirements.txt
```

> **Masalah Dependencies Windows:** Jika mengalami error dengan `pyzbar` (DLL not found), fitur QR Scan mungkin dimatikan di `app.py`. Plate detection tetap akan berfungsi menggunakan YOLO.

**Download Model:**
Pastikan file model YOLO (.pt) sudah tersedia di folder `ocr-service/model/` atau sesuai konfigurasi di `app.py`.

**Jalankan OCR Service:**

```bash
python app.py
```

Service akan berjalan di `http://localhost:5000`.

---

## 📚 Fitur Utama

### 1. Plate Detection (Deteksi Plat Nomor)
*   Menggunakan kamera atau upload gambar untuk mendeteksi plat nomor kendaraan.
*   Verifikasi otomatis dengan database penghuni.
*   Membuka gerbang otomatis jika plat terdaftar.

### 2. Vehicle & Resident Management
*   CRUD data penghuni dan kendaraan.
*   Sinkronisasi otomatis antara data User dan Vehicle.
*   Role-based access: Security (View Only), Admin (Full Access).

### 3. Visitor Management
*   Buat undangan tamu dengan QR Code.
*   Scan QR Code untuk akses masuk tamu.

### 4. Real-time Monitoring
*   Status gerbang (Buka/Tutup) diupdate secara real-time via Socket.IO.
*   Log akses tersimpan otomatis.

---

## 🤝 Kontribusi

Jika Anda ingin berkontribusi:

1.  Fork repository ini.
2.  Buat branch fitur baru (`git checkout -b fitur-baru`).
3.  Commit perubahan Anda (`git commit -m 'Menambah fitur X'`).
4.  Push ke branch (`git push origin fitur-baru`).
5.  Buat Pull Request.

---

## 📄 Struktur Folder

```
digigate/
├── backend/            # Express.js REST API
├── fe/                 # Vue.js Frontend
└── ocr-service/        # Python Flask AI Service
    ├── model/          # YOLO & PaddleOCR models
    └── python/         # Flask App Source Code
```
