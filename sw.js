/* ==========================================================================
   SERVICE WORKER — FESTIVAL BUDAYA SEMAU (KELOMPOK 11 ITAF KUPANG)
   Memenuhi Spesifikasi Operasi Luring (S6) & Paket Luring LKM Multimedia
   ========================================================================== */

const CACHE_NAME = 'semau-hypermedia-v1';

// Daftar seluruh berkas lokal yang wajib di-precache saat instalasi PWA
// Catatan: Pastikan semua file yang didaftarkan di bawah ini benar-benar ada di folder proyek
const PRECACHE_ASSETS = [
  './',
  './index3.html',
  './manifest.webmanifest',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png'
  // Tambahkan jalur aset lokal Anda di sini agar tersedia 100% luring, contoh:
  // './assets/video/semau-promo-360p.mp4',
  // './assets/audio/podcast-semau.mp3',
  // './assets/images/pantai-otan.webp'
];

// 1. Tahap Instalasi: Menyimpan aset inti ke dalam Cache Storage
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Melakukan precache aset lokal Festival Budaya Semau...');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// 2. Tahap Aktivasi: Membersihkan cache versi lama jika ada pembaruan
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((oldName) => caches.delete(oldName))
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Tahap Fetch: Melayani permintaan dari Cache terlebih dahulu (Offline-First)
self.addEventListener('fetch', (event) => {
  // Abaikan permintaan non-GET (seperti POST) atau ekstensi peramban
  if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      // Jika belum ada di cache, ambil dari jaringan lalu simpan salinannya
      return fetch(event.request)
        .then((networkResponse) => {
          // Hanya cache respons yang valid dari asal yang sama (same-origin)
          if (
            !networkResponse ||
            networkResponse.status !== 200 ||
            networkResponse.type !== 'basic'
          ) {
            return networkResponse;
          }

          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return networkResponse;
        })
        .catch(() => {
          // Fallback luring apabila pengguna membuka navigasi halaman saat offline
          if (event.request.mode === 'navigate') {
            return caches.match('./index3.html');
          }
        });
    })
  );
});