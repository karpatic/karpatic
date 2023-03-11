//  https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers
// Change cache name to force update, happens in background so only after 2nd load w/ new content
// While the service worker is being installed, the previous version is still responsible for fetches. 
// The new version is installing in the background. We are calling the new cache v2, 
// so the previous v1 cache isn't disturbed.
// When no pages are using the previous version, the new worker activates and becomes responsible for fetches.

const CACHE_NAME = 'cv-website-cache-v8';

// List of URLs to cache
const urlsToCache = [
  '/'
];

// Enable navigation preload
const enableNavigationPreload = async () => { 
  if (self.registration.navigationPreload) { await self.registration.navigationPreload.enable(); } };
self.addEventListener("activate", (event) => { event.waitUntil(enableNavigationPreload()); });

// Install event
self.addEventListener('install', async event => {
  try{
    console.log('Service worker installing...')
    const cache = await caches.open(CACHE_NAME); 
    console.log('Service worker Adding URLS...')
    await cache.addAll(urlsToCache) 
    console.log('Service worker  - event.waitUntil...')
    event.waitUntil( cache );
    console.log('Service worker done installing...')
  }
  catch(error){} // console.error('Cache operation failed:', error)}
});

const putInCache = async (request, response) => {
  const cache = await caches.open(CACHE_NAME);
  await cache.put(request, response);
};

const deleteCache = async (key) => {
  await caches.delete(key);
};

const deleteOldCaches = async () => {
  const cacheKeepList = [CACHE_NAME];
  const keyList = await caches.keys();
  const cachesToDelete = keyList.filter((key) => !cacheKeepList.includes(key));
  await Promise.all(cachesToDelete.map(deleteCache));
};

self.addEventListener("activate", (event) => {
  event.waitUntil(deleteOldCaches());
});

// Fetch event
const cacheFirst = async ({ request, preloadResponsePromise }) => {
  // First try to get the resource from the cache
  const responseFromCache = await caches.match(request);
  if (responseFromCache) {
    return responseFromCache;
  }

  // Next try to use (and cache) the preloaded response, if it's there
  const preloadResponse = await preloadResponsePromise;
  if (preloadResponse) {
    console.info("using preload response", preloadResponse);
    putInCache(request, preloadResponse.clone());
    return preloadResponse;
  }

  // Next try to get the resource from the network
  try {
    const responseFromNetwork = await fetch(request);
    // response may be used only once
    // we need to save clone to put one copy in cache
    // and serve second one
    putInCache(request, responseFromNetwork.clone());
    return responseFromNetwork;
  } 
  catch (error) {
    // when even the fallback response is not available,
    // there is nothing we can do, but we must always
    // return a Response object
    return new Response("Network error happened", {
      status: 408,
      headers: { "Content-Type": "text/plain" },
    });
  }
};

self.addEventListener("fetch", (event) => {
  event.respondWith(
    cacheFirst({
      request: event.request,
      preloadResponsePromise: event.preloadResponse
    })
  );
});