// Service Worker - MembrosFit PWA
// Versão Básica para cache de arquivos estáticos

const CACHE_NAME = 'membrosfit-v1';
const urlsToCache = [
  '/',
  '/dashboard',
  '/gerar',
  '/dashboard/planos',
  '/dashboard/progresso',
  '/dashboard/protocolos',
  '/images/Logo.png',
  '/images/icon-192x192.png',
  '/images/icon-512x512.png',
  '/manifest.json'
];

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker: Instalando...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('✅ Service Worker: Cache aberto');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('✅ Service Worker: Arquivos cacheados com sucesso');
        return self.skipWaiting(); // Ativa imediatamente
      })
      .catch((error) => {
        console.error('❌ Service Worker: Erro ao cachear:', error);
      })
  );
});

// Ativação do Service Worker
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker: Ativando...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Remove caches antigos
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Service Worker: Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('✅ Service Worker: Ativado e pronto!');
      return self.clients.claim(); // Assume controle imediatamente
    })
  );
});

// Intercepta requisições
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Retorna do cache se existir
        if (response) {
          console.log('📦 Service Worker: Servindo do cache:', event.request.url);
          return response;
        }
        
        // Caso contrário, busca da rede
        console.log('🌐 Service Worker: Buscando da rede:', event.request.url);
        return fetch(event.request).then((response) => {
          // Não cachear se não for uma resposta válida
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clona a resposta para cachear
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });

          return response;
        }).catch((error) => {
          console.error('❌ Service Worker: Erro na requisição:', error);
          // Aqui você pode retornar uma página offline customizada
          // return caches.match('/offline.html');
        });
      })
  );
});