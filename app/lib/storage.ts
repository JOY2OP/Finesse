import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Fallback storage for web or when AsyncStorage is not available
const webStorage = {
  getItem: async (key: string): Promise<string | null> => {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
    return null;
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(key);
    }
  },
  clear: async (): Promise<void> => {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.clear();
    }
  },
  getAllKeys: async (): Promise<string[]> => {
    if (typeof window !== 'undefined' && window.localStorage) {
      return Object.keys(window.localStorage);
    }
    return [];
  },
  multiGet: async (keys: string[]): Promise<[string, string | null][]> => {
    if (typeof window !== 'undefined' && window.localStorage) {
      return keys.map(key => [key, window.localStorage.getItem(key)]);
    }
    return keys.map(key => [key, null]);
  },
  multiSet: async (keyValuePairs: [string, string][]): Promise<void> => {
    if (typeof window !== 'undefined' && window.localStorage) {
      keyValuePairs.forEach(([key, value]) => {
        window.localStorage.setItem(key, value);
      });
    }
  },
  multiRemove: async (keys: string[]): Promise<void> => {
    if (typeof window !== 'undefined' && window.localStorage) {
      keys.forEach(key => {
        window.localStorage.removeItem(key);
      });
    }
  },
};

// Choose storage based on platform and availability
const getStorage = () => {
  try {
    // Check if AsyncStorage is available and working
    if (Platform.OS !== 'web' && AsyncStorage) {
      // Test AsyncStorage
      AsyncStorage.getItem('test').then(() => {
        // AsyncStorage is working
      }).catch(() => {
        // AsyncStorage failed, will fall back to webStorage
      });
      return AsyncStorage;
    }
  } catch (error) {
    console.warn('AsyncStorage not available, falling back to web storage');
  }
  
  return webStorage;
};

const storage = getStorage();

export class Storage {
  static async setItem(key: string, value: string): Promise<void> {
    try {
      await storage.setItem(key, value);
    } catch (error) {
      console.error('Error storing data:', error);
    }
  }

  static async getItem(key: string): Promise<string | null> {
    try {
      return await storage.getItem(key);
    } catch (error) {
      console.error('Error retrieving data:', error);
      return null;
    }
  }

  static async removeItem(key: string): Promise<void> {
    try {
      await storage.removeItem(key);
    } catch (error) {
      console.error('Error removing data:', error);
    }
  }

  static async clear(): Promise<void> {
    try {
      await storage.clear();
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  }

  static async getAllKeys(): Promise<string[]> {
    try {
      return await storage.getAllKeys();
    } catch (error) {
      console.error('Error getting all keys:', error);
      return [];
    }
  }

  static async multiGet(keys: string[]): Promise<[string, string | null][]> {
    try {
      return await storage.multiGet(keys);
    } catch (error) {
      console.error('Error getting multiple items:', error);
      return keys.map(key => [key, null]);
    }
  }

  static async multiSet(keyValuePairs: [string, string][]): Promise<void> {
    try {
      await storage.multiSet(keyValuePairs);
    } catch (error) {
      console.error('Error setting multiple items:', error);
    }
  }

  static async multiRemove(keys: string[]): Promise<void> {
    try {
      await storage.multiRemove(keys);
    } catch (error) {
      console.error('Error removing multiple items:', error);
    }
  }
}

// Convenience methods for common data types
export class TypedStorage {
  static async setObject<T>(key: string, value: T): Promise<void> {
    try {
      const jsonValue = JSON.stringify(value);
      await Storage.setItem(key, jsonValue);
    } catch (error) {
      console.error('Error storing object:', error);
    }
  }

  static async getObject<T>(key: string): Promise<T | null> {
    try {
      const jsonValue = await Storage.getItem(key);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (error) {
      console.error('Error retrieving object:', error);
      return null;
    }
  }

  static async setBoolean(key: string, value: boolean): Promise<void> {
    await Storage.setItem(key, value.toString());
  }

  static async getBoolean(key: string): Promise<boolean | null> {
    const value = await Storage.getItem(key);
    return value !== null ? value === 'true' : null;
  }

  static async setNumber(key: string, value: number): Promise<void> {
    await Storage.setItem(key, value.toString());
  }

  static async getNumber(key: string): Promise<number | null> {
    const value = await Storage.getItem(key);
    return value !== null ? parseFloat(value) : null;
  }
}