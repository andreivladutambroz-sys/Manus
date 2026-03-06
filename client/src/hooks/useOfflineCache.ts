import { useEffect, useState } from 'react';

interface CachedData {
  diagnostics: any[];
  repairs: any[];
  favorites: any[];
  lastSync: Date;
}

export function useOfflineCache() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [cachedData, setCachedData] = useState<CachedData | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Register service worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((error) => {
        console.error('Service Worker registration failed:', error);
      });
    }
  }, []);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncOfflineData();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load cached data from IndexedDB
  const loadCachedData = async () => {
    try {
      const db = await openIndexedDB();
      const data = await getAllCachedData(db);
      setCachedData(data);
    } catch (error) {
      console.error('Failed to load cached data:', error);
    }
  };

  // Save data to IndexedDB
  const saveCachedData = async (key: string, value: any) => {
    try {
      const db = await openIndexedDB();
      await saveToIndexedDB(db, key, value);
    } catch (error) {
      console.error('Failed to save cached data:', error);
    }
  };

  // Sync offline data when back online
  const syncOfflineData = async () => {
    if (!isOnline) return;

    setIsSyncing(true);
    try {
      // Trigger background sync
      if ('serviceWorker' in navigator && 'SyncManager' in window) {
        const registration = await navigator.serviceWorker.ready;
        await (registration as any).sync.register('sync-repairs');
      }
    } catch (error) {
      console.error('Failed to sync offline data:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  return {
    isOnline,
    cachedData,
    isSyncing,
    loadCachedData,
    saveCachedData,
    syncOfflineData
  };
}

function openIndexedDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('MechanicHelper', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      if (!db.objectStoreNames.contains('diagnostics')) {
        db.createObjectStore('diagnostics', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('repairs')) {
        db.createObjectStore('repairs', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('favorites')) {
        db.createObjectStore('favorites', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('metadata')) {
        db.createObjectStore('metadata', { keyPath: 'key' });
      }
    };
  });
}

function getAllCachedData(db: IDBDatabase): Promise<CachedData> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(
      ['diagnostics', 'repairs', 'favorites', 'metadata'],
      'readonly'
    );

    const diagnosticsStore = transaction.objectStore('diagnostics');
    const repairsStore = transaction.objectStore('repairs');
    const favoritesStore = transaction.objectStore('favorites');
    const metadataStore = transaction.objectStore('metadata');

    const diagnosticsRequest = diagnosticsStore.getAll();
    const repairsRequest = repairsStore.getAll();
    const favoritesRequest = favoritesStore.getAll();
    const metadataRequest = metadataStore.get('lastSync');

    let completed = 0;
    let results: any = {};

    const checkCompletion = () => {
      completed++;
      if (completed === 4) {
        resolve({
          diagnostics: results.diagnostics || [],
          repairs: results.repairs || [],
          favorites: results.favorites || [],
          lastSync: results.lastSync || new Date()
        });
      }
    };

    diagnosticsRequest.onsuccess = () => {
      results.diagnostics = diagnosticsRequest.result;
      checkCompletion();
    };

    repairsRequest.onsuccess = () => {
      results.repairs = repairsRequest.result;
      checkCompletion();
    };

    favoritesRequest.onsuccess = () => {
      results.favorites = favoritesRequest.result;
      checkCompletion();
    };

    metadataRequest.onsuccess = () => {
      results.lastSync = metadataRequest.result?.value || new Date();
      checkCompletion();
    };

    transaction.onerror = () => reject(transaction.error);
  });
}

function saveToIndexedDB(db: IDBDatabase, key: string, value: any): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([key], 'readwrite');
    const store = transaction.objectStore(key);
    const request = store.put(value);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}
