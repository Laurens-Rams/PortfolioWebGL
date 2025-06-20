// 🔥 SMART CACHING SERVICE WORKER FOR WEBGL PORTFOLIO
// Caches optimized models and critical assets for instant loading

const CACHE_NAME = 'webgl-portfolio-v7'; // 🔥 UPDATED: Fix module script MIME type issues
const STATIC_CACHE_NAME = 'webgl-static-v7';

// Critical assets to cache immediately (smaller assets first)
const CRITICAL_ASSETS = [
  '/',
  '/main.js',
  '/index.html',
  // Removed: '/font-2.json' - not used, saves 251KB from critical cache
];

// Large assets to cache on demand (don't block initial load)
const LARGE_ASSETS_TO_CACHE = [
  '/optimized_models/character_ultra_light_4anims_compressed.glb', // 1MB ultra-light character (4 animations)
  '/optimized_models/character_clean_4anims_compressed.glb', // 6MB clean optimized character (4 animations)
];

// Large assets to cache on demand (removed space.glb and other deleted files)
const LARGE_ASSETS = [
  '/tendor-assets/TENDOR/TENDOR13.png',
  '/tendor-assets/TENDOR/TENDOR9.png',
  '/tendor-assets/TENDOR/TENDOR1.png',
  '/tendor-assets/TENDOR/TENDOR10.png',
  '/tendor-assets/appSCREENS.png',
  '/tendor-assets/Brand_arhcitecture.png',
];

// Assets that should NOT be cached (deleted files)
const BLACKLISTED_ASSETS = [
  '/optimized_models/character_minimal_draco.glb',
  '/optimized_models/character_minimal.glb',
  '/optimized_models/character_draco_compressed.glb',
  // Recently deleted unused files
  '/optimized_models/character_bangkok.glb',
  '/optimized_models/character_bangkok_draco.glb',
  '/optimized_models/character_bangkok_simple.glb',
  '/optimized_models/character_clean.glb',
  '/optimized_models/character_clean_4anims.glb',
  '/optimized_models/character_ultra_light.glb',
  '/optimized_models/character_ultra_light_4anims.glb',
];

// Install event - cache critical assets
self.addEventListener('install', (event) => {
  console.log('🔥 Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('🔥 Service Worker: Caching critical assets...');
        return cache.addAll(CRITICAL_ASSETS);
      })
      .then(() => {
        console.log('✅ Service Worker: Critical assets cached');
        return self.skipWaiting(); // Activate immediately
      })
      .catch((error) => {
        console.error('❌ Service Worker: Failed to cache critical assets:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('🔥 Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        // 🔥 DELETE ALL CACHES to fix MIME type issues
        console.log('🗑️ Service Worker: Clearing ALL caches to fix module loading issues');
        return Promise.all(
          cacheNames.map((cacheName) => {
            console.log('🗑️ Service Worker: Deleting cache:', cacheName);
            return caches.delete(cacheName);
          })
        );
      })
      .then(() => {
        // Also clean blacklisted assets from current caches
        return Promise.all([
          caches.open(CACHE_NAME),
          caches.open(STATIC_CACHE_NAME)
        ]);
      })
      .then(([cache, staticCache]) => {
        // Remove blacklisted assets from current caches
        const cleanupPromises = BLACKLISTED_ASSETS.map(asset => {
          console.log('🗑️ Service Worker: Removing blacklisted asset from cache:', asset);
          return Promise.all([
            cache.delete(asset),
            staticCache.delete(asset)
          ]);
        });
        return Promise.all(cleanupPromises);
      })
      .then(() => {
        console.log('✅ Service Worker: Activated, cleaned up, and claiming clients');
        return self.clients.claim();
      })
  );
});

// Fetch event - smart caching strategy
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Skip external requests
  if (url.origin !== location.origin) {
    return;
  }
  
  // Block blacklisted assets (deleted files) - silent blocking
  if (isBlacklistedAsset(url.pathname)) {
    event.respondWith(new Response('Asset no longer available', { status: 404 }));
    return;
  }
  
  // Smart caching strategy based on file type
  if (isGLBFile(url.pathname)) {
    event.respondWith(handleGLBRequest(event.request));
  } else if (isImageFile(url.pathname)) {
    event.respondWith(handleImageRequest(event.request));
  } else if (isCriticalAsset(url.pathname)) {
    event.respondWith(handleCriticalAsset(event.request));
  } else {
    event.respondWith(handleGenericRequest(event.request));
  }
});

// Handle GLB files with smart caching
async function handleGLBRequest(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  
  if (cached) {
    return cached;
  }
  
  console.log('🔥 Service Worker: Fetching and caching GLB:', request.url);
  
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      // Cache successful responses
      cache.put(request, response.clone());
      console.log('✅ Service Worker: GLB cached:', request.url);
    }
    
    return response;
  } catch (error) {
    console.error('❌ Service Worker: Failed to fetch GLB:', request.url, error);
    throw error;
  }
}

// Handle images with cache-first strategy
async function handleImageRequest(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  
  if (cached) {
    // Update cache in background if it's a large asset
    if (LARGE_ASSETS.some(asset => request.url.includes(asset))) {
      fetch(request).then(response => {
        if (response.ok) {
          cache.put(request, response.clone());
        }
      }).catch(() => {}); // Silent fail for background updates
    }
    
    return cached;
  }
  
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      cache.put(request, response.clone());
      console.log('✅ Service Worker: Image cached:', request.url);
    }
    
    return response;
  } catch (error) {
    console.error('❌ Service Worker: Failed to fetch image:', request.url, error);
    throw error;
  }
}

// Handle critical assets with cache-first strategy
async function handleCriticalAsset(request) {
  const cache = await caches.open(STATIC_CACHE_NAME);
  const cached = await cache.match(request);
  
  if (cached) {
    return cached;
  }
  
  const response = await fetch(request);
  
  if (response.ok) {
    cache.put(request, response.clone());
  }
  
  return response;
}

// Handle generic requests with network-first strategy
async function handleGenericRequest(request) {
  try {
    const response = await fetch(request);
    
    // 🔥 FIX: Don't cache JavaScript modules with wrong MIME types
    if (request.url.includes('.js') && response.ok) {
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('javascript')) {
        console.log('🚨 Service Worker: Skipping JS file with wrong MIME type:', request.url, contentType);
        return response; // Don't cache, just return
      }
    }
    
    return response;
  } catch (error) {
    // Try cache as fallback
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    
    if (cached) {
      console.log('✅ Service Worker: Serving cached fallback:', request.url);
      return cached;
    }
    
    throw error;
  }
}

// Helper functions
function isGLBFile(pathname) {
  return pathname.endsWith('.glb');
}

function isBlacklistedAsset(pathname) {
  return BLACKLISTED_ASSETS.some(asset => pathname.includes(asset));
}

function isImageFile(pathname) {
  return /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(pathname);
}

function isCriticalAsset(pathname) {
  return CRITICAL_ASSETS.some(asset => pathname === asset || pathname.endsWith(asset));
}

// Background sync for preloading and skip waiting
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'PRELOAD_ASSETS') {
    console.log('🔥 Service Worker: Starting background preload...');
    preloadAssets(event.data.assets);
  } else if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('🔄 Service Worker: Skipping waiting...');
    self.skipWaiting();
  }
});

async function preloadAssets(assets) {
  const cache = await caches.open(CACHE_NAME);
  
  for (const asset of assets) {
    try {
      const response = await fetch(asset);
      if (response.ok) {
        await cache.put(asset, response);
        console.log('✅ Service Worker: Preloaded:', asset);
      }
    } catch (error) {
      console.warn('⚠️ Service Worker: Failed to preload:', asset, error);
    }
  }
  
  console.log('✅ Service Worker: Background preload complete');
} 