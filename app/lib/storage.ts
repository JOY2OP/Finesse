import AsyncStorage from '@react-native-async-storage/async-storage';

export class Storage {
  static async setItem(key: string, value: string): Promise<void> {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.error('Error storing data:', error);
    }
  }

  static async getItem(key: string): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.error('Error retrieving data:', error);
      return null;
    }
  }

  static async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing data:', error);
    }
  }

  static async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  }

  static async getAllKeys(): Promise<string[]> {
    try {
      return await AsyncStorage.getAllKeys();
    } catch (error) {
      console.error('Error getting all keys:', error);
      return [];
    }
  }

  static async multiGet(keys: string[]): Promise<[string, string | null][]> {
    try {
      return await AsyncStorage.multiGet(keys);
    } catch (error) {
      console.error('Error getting multiple items:', error);
      return [];
    }
  }

  static async multiSet(keyValuePairs: [string, string][]): Promise<void> {
    try {
      await AsyncStorage.multiSet(keyValuePairs);
    } catch (error) {
      console.error('Error setting multiple items:', error);
    }
  }

  static async multiRemove(keys: string[]): Promise<void> {
    try {
      await AsyncStorage.multiRemove(keys);
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