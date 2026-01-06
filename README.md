# Seniku E-Portfolio

Aplikasi E-Portfolio untuk pembelajaran seni digital.

## Teknologi yang Digunakan

Proyek ini dibangun dengan:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- React Router
- Axios

## Cara Menjalankan Proyek

### Prasyarat

- Node.js & npm terpasang - [install dengan nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

### Langkah-langkah

```sh
# Step 1: Clone repository
git clone <YOUR_GIT_URL>

# Step 2: Masuk ke direktori proyek
cd seniku-app-Eportfolio

# Step 3: Install dependencies
npm install

# Step 4: Jalankan development server
npm run dev
```

Aplikasi akan berjalan di `http://localhost:8009`

## Scripts yang Tersedia

- `npm run dev` - Menjalankan development server
- `npm run build` - Build untuk production
- `npm run build:dev` - Build untuk development
- `npm run lint` - Menjalankan ESLint
- `npm run preview` - Preview build production

## Struktur Proyek

```
seniku-app-Eportfolio/
├── src/
│   ├── components/     # Komponen UI
│   ├── pages/          # Halaman aplikasi
│   ├── services/       # API services
│   ├── types/          # TypeScript types
│   ├── config/         # Konfigurasi
│   └── layouts/        # Layout components
├── public/             # File statis
└── package.json
```

## Deployment

Untuk deploy aplikasi, build terlebih dahulu:

```sh
npm run build
```

File hasil build akan berada di folder `dist/` yang dapat di-deploy ke hosting service seperti Vercel, Netlify, atau server lainnya.
