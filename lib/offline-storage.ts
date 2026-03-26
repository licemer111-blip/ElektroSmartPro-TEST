import { logger } from "@/lib/logger";
// Offline storage utilities using IndexedDB

interface StorageConfig {
  dbName: string;
  version: number;
  stores: Record<string, { keyPath?: string; autoIncrement?: boolean }>;
}

const CONFIG: StorageConfig = {
  dbName: "ElektroSmartDB",
  version: 1,
  stores: {
    projects: { keyPath: "id", autoIncrement: true },
    projectItems: { keyPath: "id", autoIncrement: true },
    catalogItems: { keyPath: "id", autoIncrement: true },
    pendingActions: { keyPath: "id", autoIncrement: true },
    userPreferences: { keyPath: "id", autoIncrement: true },
  },
};

class OfflineStorage {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    if (typeof window === "undefined") return;

    return new Promise((resolve, reject) => {
      const idb = window.indexedDB;
      if (!idb) {
        logger.error("[OfflineStorage] IndexedDB is not supported in this environment", {});
        return resolve();
      }

      const request = idb.open(CONFIG.dbName, CONFIG.version);

      request.onerror = () => {
        logger.error("Failed to open database", {});
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores
        Object.entries(CONFIG.stores).forEach(([name, config]) => {
          if (!db.objectStoreNames.contains(name)) {
            const store = db.createObjectStore(name, config);
            
            // Create indexes for common queries
            if (name === "projects") {
              store.createIndex("userId", "userId", { unique: false });
              store.createIndex("updatedAt", "updatedAt", { unique: false });
            }
            if (name === "projectItems") {
              store.createIndex("projectId", "projectId", { unique: false });
            }
          }
        });
      };
    });
  }

  // Generic CRUD operations
  async add(storeName: string, data: Record<string, unknown>): Promise<IDBValidKey | null> {
    if (typeof window === "undefined") return null;
    if (!this.db) await this.init();
    if (!this.db) return null;
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], "readwrite");
      const store = transaction.objectStore(storeName);
      const request = store.add(data);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async get<T = Record<string, unknown>>(storeName: string, id: string | number): Promise<T | null> {
    if (typeof window === "undefined") return null;
    if (!this.db) await this.init();
    if (!this.db) return null;
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], "readonly");
      const store = transaction.objectStore(storeName);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result as T);
      request.onerror = () => reject(request.error);
    });
  }

  async getAll<T = Record<string, unknown>>(storeName: string, indexName?: string, indexValue?: IDBValidKey): Promise<T[]> {
    if (typeof window === "undefined") return [];
    if (!this.db) await this.init();
    if (!this.db) return [];
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], "readonly");
      const store = transaction.objectStore(storeName);
      
      let request: IDBRequest;
      if (indexName && indexValue !== undefined) {
        const index = store.index(indexName);
        request = index.getAll(indexValue);
      } else {
        request = store.getAll();
      }

      request.onsuccess = () => resolve(request.result as T[]);
      request.onerror = () => reject(request.error);
    });
  }

  async update(storeName: string, data: Record<string, unknown>): Promise<IDBValidKey | null> {
    if (typeof window === "undefined") return null;
    if (!this.db) await this.init();
    if (!this.db) return null;
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], "readwrite");
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async delete(storeName: string, id: string | number): Promise<void> {
    if (typeof window === "undefined") return;
    if (!this.db) await this.init();
    if (!this.db) return;
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], "readwrite");
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clear(storeName: string): Promise<void> {
    if (typeof window === "undefined") return;
    if (!this.db) await this.init();
    if (!this.db) return;
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], "readwrite");
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Specific methods for app data
  async saveProject(project: Record<string, unknown>): Promise<void> {
    const projectWithTimestamp = {
      ...project,
      updatedAt: new Date().toISOString(),
      _offline: true,
    };
    await this.update("projects", projectWithTimestamp);
  }

  async getProject(id: string): Promise<OfflineProject | null> {
    return await this.get<OfflineProject>("projects", id);
  }

  async getUserProjects(userId: string): Promise<OfflineProject[]> {
    return await this.getAll<OfflineProject>("projects", "userId", userId);
  }

  async saveProjectItems(items: Record<string, unknown>[]): Promise<void> {
    const itemsWithTimestamp = items.map(item => ({
      ...item,
      updatedAt: new Date().toISOString(),
      _offline: true,
    }));
    
    for (const item of itemsWithTimestamp) {
      await this.update("projectItems", item);
    }
  }

  async getProjectItems(projectId: string): Promise<OfflineProjectItem[]> {
    return await this.getAll<OfflineProjectItem>("projectItems", "projectId", projectId);
  }

  // Pending actions for background sync
  async addPendingAction(action: {
    endpoint: string;
    method: string;
    body?: Record<string, unknown>;
    headers?: Record<string, string>;
  }): Promise<void> {
    const pendingAction: Record<string, unknown> = {
      ...action,
      timestamp: new Date().toISOString(),
    };
    await this.add("pendingActions", pendingAction);
  }

  async getPendingActions(): Promise<PendingAction[]> {
    return await this.getAll<PendingAction>("pendingActions");
  }

  async removePendingAction(id: string): Promise<void> {
    await this.delete("pendingActions", id);
  }

  // User preferences
  async setPreference(key: string, value: unknown, userId?: string): Promise<void> {
    const preference: Record<string, unknown> = {
      key,
      value,
      userId: userId || "anonymous",
      updatedAt: new Date().toISOString(),
    };
    await this.update("userPreferences", preference);
  }

  async getPreference(key: string, userId?: string): Promise<unknown> {
    const allPrefs = await this.getAll<{ key: string; value: unknown }>("userPreferences", "userId", userId || "anonymous");
    const pref = allPrefs.find((p) => p.key === key);
    return pref?.value;
  }

  // Storage quota management
  async getStorageUsage(): Promise<{ used: number; quota: number; percentage: number }> {
    if (typeof window === "undefined" || !("storage" in navigator)) {
      return { used: 0, quota: 0, percentage: 0 };
    }
    
    if ("estimate" in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      const used = estimate.usage || 0;
      const quota = estimate.quota || 0;
      return {
        used,
        quota,
        percentage: (used / quota) * 100,
      };
    }
    return { used: 0, quota: 0, percentage: 0 };
  }

  // Cleanup old data
  async cleanup(daysOld: number = 30): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    const projects = await this.getAll<OfflineProject>("projects");
    const itemsToDelete = projects.filter((p) => 
      new Date(p.updatedAt) < cutoffDate && !p._pinned
    );
    
    for (const project of itemsToDelete) {
      await this.delete("projects", project.id);
      // Also delete associated items
      const projectItems = await this.getProjectItems(project.id);
      for (const item of projectItems) {
        await this.delete("projectItems", item.id);
      }
    }
  }
}

// Singleton instance
export const offlineStorage = new OfflineStorage();

// Initialize on import if in browser
if (typeof window !== "undefined") {
  offlineStorage.init().catch(() => { /* init error ignored */ });
}

// Export types
export interface PendingAction {
  id: string;
  endpoint: string;
  method: string;
  body?: Record<string, unknown>;
  headers?: Record<string, string>;
  timestamp: string;
}

export interface OfflineProject {
  id: string;
  userId: string;
  name: string;
  updatedAt: string;
  _offline: boolean;
  _pinned?: boolean;
}

export interface OfflineProjectItem {
  id: string;
  projectId: string;
  name: string;
  quantity: number;
  price: number;
  updatedAt: string;
  _offline: boolean;
}
