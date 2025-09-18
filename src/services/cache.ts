
type CacheEntry<T> = { value: T; ts: number; ttlMs: number };
const DB_NAME = 'picnic-cache-v1';
const STORE = 'kv';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function setCache<T>(key: string, value: T, ttlMs: number) {
  const db = await openDB();
  const tx = db.transaction(STORE, 'readwrite');
  const store = tx.objectStore(STORE);
  const entry: CacheEntry<T> = { value, ts: Date.now(), ttlMs };
  store.put(entry, key);
  return tx.complete;
}

export async function getCache<T>(key: string): Promise<T | undefined> {
  const db = await openDB();
  const tx = db.transaction(STORE, 'readonly');
  const store = tx.objectStore(STORE);
  return new Promise((resolve) => {
    const req = store.get(key);
    req.onsuccess = () => {
      const entry = req.result as CacheEntry<T> | undefined;
      if (!entry) return resolve(undefined);
      if (Date.now() - entry.ts > entry.ttlMs) {
        // expired, delete
        const delTx = db.transaction(STORE, 'readwrite');
        delTx.objectStore(STORE).delete(key);
        return resolve(undefined);
      }
      resolve(entry.value);
    };
    req.onerror = () => resolve(undefined);
  });
}

export function key(parts: (string | number)[]) {
  return parts.join('::');
}
