const CACHE_NAME = 'habits365-v1';

// רשימת כל הנכסים מה-GitHub שלך שצריך לשמור בזיכרון
const ASSETS = [
  '/',
  '/index.html',
  '/dashboard.html',
  '/manage.html',
  '/login.html',
  '/style.css',
  '/app.js',
  '/auth.js',
  '/dashboard.js',
  '/firebase.js',
  '/login.js',
  '/manage.js',
  '/script.js',
  '/manifest.json',
  // כאן אפשר להוסיף נתיב לאייקון אם יש לך קובץ מקומי
  // '/icons/icon-512.png' 
];

// שלב ההתקנה: שומר את כל הקבצים ב-Cache
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Service Worker: Caching Assets');
      return cache.addAll(ASSETS);
    })
  );
});

// שלב ההפעלה: מנקה גרסאות ישנות של Cache אם היו
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Service Worker: Clearing Old Cache');
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

// אסטרטגיית טעינה: נסה להביא מה-Cache, אם לא נמצא - תביא מהרשת
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
