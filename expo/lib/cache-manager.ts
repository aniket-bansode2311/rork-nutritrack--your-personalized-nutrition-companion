import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';


export interface CacheItem<T = any> {
  data: T;
  timestamp: number;
  expiresAt: number;
  version: string;
}

export interface CacheConfig {
  ttl: number; // Time to live in milliseconds
  maxSize?: number; // Maximum number of items
  version?: string; // Cache version for invalidation
}

export interface SyncQueueItem {
  id: string;
  type: 'create' | 'update' | 'delete';
  table: string;
  data: any;
  timestamp: number;
  retryCount: number;
}

class CacheManager {
  private static instance: CacheManager;
  private isOnline: boolean = true;
  private syncQueue: SyncQueueItem[] = [];
  private syncInProgress: boolean = false;
  private readonly CACHE_PREFIX = '@nutrition_cache:';
  private readonly SYNC_QUEUE_KEY = '@sync_queue';
  private readonly MAX_RETRY_COUNT = 3;
  private readonly SYNC_INTERVAL = 30000; // 30 seconds
  
  private constructor() {
    this.initializeNetworkListener();
    this.loadSyncQueue();
    this.startSyncInterval();
  }

  public static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  private async initializeNetworkListener() {
    try {
      const netInfo = await NetInfo.fetch();
      this.isOnline = netInfo.isConnected ?? false;
      
      NetInfo.addEventListener(state => {
        const wasOffline = !this.isOnline;
        this.isOnline = state.isConnected ?? false;
        
        console.log('Network status changed:', this.isOnline ? 'online' : 'offline');
        
        // If we just came back online, trigger sync
        if (wasOffline && this.isOnline) {
          this.processSyncQueue();
        }
      });
    } catch (error) {
      console.error('Failed to initialize network listener:', error);
      // Assume online if we can't detect network status
      this.isOnline = true;
    }
  }

  private async loadSyncQueue() {
    try {
      const queueData = await AsyncStorage.getItem(this.SYNC_QUEUE_KEY);
      if (queueData) {
        this.syncQueue = JSON.parse(queueData);
        console.log(`Loaded ${this.syncQueue.length} items from sync queue`);
      }
    } catch (error) {
      console.error('Failed to load sync queue:', error);
      this.syncQueue = [];
    }
  }

  private async saveSyncQueue() {
    try {
      await AsyncStorage.setItem(this.SYNC_QUEUE_KEY, JSON.stringify(this.syncQueue));
    } catch (error) {
      console.error('Failed to save sync queue:', error);
    }
  }

  private startSyncInterval() {
    setInterval(() => {
      if (this.isOnline && this.syncQueue.length > 0 && !this.syncInProgress) {
        this.processSyncQueue();
      }
    }, this.SYNC_INTERVAL);
  }

  // Cache operations
  async set<T>(key: string, data: T, config: CacheConfig): Promise<void> {
    try {
      const cacheKey = this.CACHE_PREFIX + key;
      const cacheItem: CacheItem<T> = {
        data,
        timestamp: Date.now(),
        expiresAt: Date.now() + config.ttl,
        version: config.version || '1.0.0',
      };
      
      await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheItem));
      console.log(`Cached item: ${key}`);
    } catch (error) {
      console.error(`Failed to cache item ${key}:`, error);
    }
  }

  async get<T>(key: string, version?: string): Promise<T | null> {
    try {
      const cacheKey = this.CACHE_PREFIX + key;
      const cachedData = await AsyncStorage.getItem(cacheKey);
      
      if (!cachedData) {
        return null;
      }
      
      const cacheItem: CacheItem<T> = JSON.parse(cachedData);
      
      // Check if cache is expired
      if (Date.now() > cacheItem.expiresAt) {
        await this.remove(key);
        return null;
      }
      
      // Check version compatibility
      if (version && cacheItem.version !== version) {
        await this.remove(key);
        return null;
      }
      
      console.log(`Cache hit: ${key}`);
      return cacheItem.data;
    } catch (error) {
      console.error(`Failed to get cached item ${key}:`, error);
      return null;
    }
  }

  async remove(key: string): Promise<void> {
    try {
      const cacheKey = this.CACHE_PREFIX + key;
      await AsyncStorage.removeItem(cacheKey);
      console.log(`Removed cached item: ${key}`);
    } catch (error) {
      console.error(`Failed to remove cached item ${key}:`, error);
    }
  }

  async clear(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(this.CACHE_PREFIX));
      await AsyncStorage.multiRemove(cacheKeys);
      console.log(`Cleared ${cacheKeys.length} cached items`);
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }

  async getCacheSize(): Promise<number> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      return keys.filter(key => key.startsWith(this.CACHE_PREFIX)).length;
    } catch (error) {
      console.error('Failed to get cache size:', error);
      return 0;
    }
  }

  // Offline sync operations
  async addToSyncQueue(item: Omit<SyncQueueItem, 'id' | 'timestamp' | 'retryCount'>): Promise<void> {
    const syncItem: SyncQueueItem = {
      ...item,
      id: `${item.type}_${item.table}_${Date.now()}_${Math.random()}`,
      timestamp: Date.now(),
      retryCount: 0,
    };
    
    this.syncQueue.push(syncItem);
    await this.saveSyncQueue();
    
    console.log(`Added to sync queue: ${syncItem.type} ${syncItem.table}`);
    
    // Try to sync immediately if online
    if (this.isOnline && !this.syncInProgress) {
      this.processSyncQueue();
    }
  }

  private async processSyncQueue(): Promise<void> {
    if (this.syncInProgress || !this.isOnline || this.syncQueue.length === 0) {
      return;
    }
    
    this.syncInProgress = true;
    console.log(`Processing sync queue with ${this.syncQueue.length} items`);
    
    const itemsToRemove: string[] = [];
    
    for (const item of this.syncQueue) {
      try {
        await this.syncItem(item);
        itemsToRemove.push(item.id);
        console.log(`Successfully synced: ${item.type} ${item.table}`);
      } catch (error) {
        console.error(`Failed to sync item ${item.id}:`, error);
        
        // Increment retry count
        item.retryCount++;
        
        // Remove item if max retries exceeded
        if (item.retryCount >= this.MAX_RETRY_COUNT) {
          itemsToRemove.push(item.id);
          console.warn(`Removing item ${item.id} after ${this.MAX_RETRY_COUNT} failed attempts`);
        }
      }
    }
    
    // Remove successfully synced and failed items
    this.syncQueue = this.syncQueue.filter(item => !itemsToRemove.includes(item.id));
    await this.saveSyncQueue();
    
    this.syncInProgress = false;
    console.log(`Sync completed. ${this.syncQueue.length} items remaining in queue`);
  }

  private async syncItem(item: SyncQueueItem): Promise<void> {
    // This would integrate with your tRPC client to sync data
    // For now, we'll simulate the sync operation
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simulate network request
        if (Math.random() > 0.1) { // 90% success rate
          resolve();
        } else {
          reject(new Error('Simulated network error'));
        }
      }, 1000);
    });
  }

  // Utility methods
  isNetworkAvailable(): boolean {
    return this.isOnline;
  }

  getSyncQueueLength(): number {
    return this.syncQueue.length;
  }

  async forceSyncNow(): Promise<void> {
    if (this.isOnline) {
      await this.processSyncQueue();
    } else {
      throw new Error('Cannot sync while offline');
    }
  }

  // Cache strategies
  async getWithFallback<T>(
    key: string,
    fetchFunction: () => Promise<T>,
    config: CacheConfig
  ): Promise<T> {
    // Try to get from cache first
    const cachedData = await this.get<T>(key, config.version);
    
    if (cachedData) {
      // Return cached data and optionally refresh in background
      if (this.isOnline) {
        // Background refresh
        fetchFunction()
          .then(freshData => this.set(key, freshData, config))
          .catch(error => console.warn('Background refresh failed:', error));
      }
      return cachedData;
    }
    
    // If no cache and online, fetch fresh data
    if (this.isOnline) {
      try {
        const freshData = await fetchFunction();
        await this.set(key, freshData, config);
        return freshData;
      } catch (error) {
        console.error('Failed to fetch fresh data:', error);
        throw error;
      }
    }
    
    // If offline and no cache, throw error
    throw new Error('No cached data available and device is offline');
  }

  async invalidatePattern(pattern: string): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => 
        key.startsWith(this.CACHE_PREFIX) && key.includes(pattern)
      );
      
      await AsyncStorage.multiRemove(cacheKeys);
      console.log(`Invalidated ${cacheKeys.length} cache entries matching pattern: ${pattern}`);
    } catch (error) {
      console.error('Failed to invalidate cache pattern:', error);
    }
  }
}

export const cacheManager = CacheManager.getInstance();

// Cache configuration presets
export const CacheConfigs = {
  USER_PROFILE: { ttl: 30 * 60 * 1000, version: '1.0.0' }, // 30 minutes
  FOOD_ITEMS: { ttl: 24 * 60 * 60 * 1000, version: '1.0.0' }, // 24 hours
  RECIPES: { ttl: 60 * 60 * 1000, version: '1.0.0' }, // 1 hour
  FOOD_ENTRIES: { ttl: 5 * 60 * 1000, version: '1.0.0' }, // 5 minutes
  SEARCH_RESULTS: { ttl: 15 * 60 * 1000, version: '1.0.0' }, // 15 minutes
  FREQUENT_FOODS: { ttl: 60 * 60 * 1000, version: '1.0.0' }, // 1 hour
};

// Utility functions for common cache operations
export const CacheUtils = {
  generateUserKey: (userId: string, suffix: string) => `user_${userId}_${suffix}`,
  generateDateKey: (date: string, suffix: string) => `date_${date}_${suffix}`,
  generateSearchKey: (query: string) => `search_${query.toLowerCase().replace(/\s+/g, '_')}`,
};