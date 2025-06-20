// Clear all caches utility script
// Run this in the browser console to completely clear all caches

async function clearAllCaches() {
  console.log('🔥 Starting complete cache clear...');
  
  // Clear all service worker caches
  if ('caches' in window) {
    const cacheNames = await caches.keys();
    console.log('📦 Found caches:', cacheNames);
    
    const deletePromises = cacheNames.map(cacheName => {
      console.log('🗑️ Deleting cache:', cacheName);
      return caches.delete(cacheName);
    });
    
    await Promise.all(deletePromises);
    console.log('✅ All caches deleted');
  }
  
  // Unregister service worker
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    console.log('🔧 Found service workers:', registrations.length);
    
    const unregisterPromises = registrations.map(registration => {
      console.log('🗑️ Unregistering service worker:', registration.scope);
      return registration.unregister();
    });
    
    await Promise.all(unregisterPromises);
    console.log('✅ All service workers unregistered');
  }
  
  // Clear localStorage and sessionStorage
  localStorage.clear();
  sessionStorage.clear();
  console.log('✅ Storage cleared');
  
  console.log('🎉 Complete cache clear finished! Refresh the page.');
}

// Auto-run if this script is executed
clearAllCaches().catch(console.error); 