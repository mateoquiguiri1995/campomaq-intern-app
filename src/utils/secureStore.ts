import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export const getItemAsync = async (key: string): Promise<string | null> => {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      return window.localStorage.getItem(key);
    }
    return null;
  }
  try {
    return await SecureStore.getItemAsync(key);
  } catch (error) {
    console.warn('[SecureStore] Failed to get item:', error);
    return null;
  }
};

export const setItemAsync = async (key: string, value: string): Promise<void> => {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(key, value);
      } catch (error) {
        console.warn('[SecureStore] Failed to set item (web):', error);
      }
    }
    return;
  }
  try {
    await SecureStore.setItemAsync(key, value);
  } catch (error) {
    console.warn('[SecureStore] Failed to set item:', error);
  }
};

export const deleteItemAsync = async (key: string): Promise<void> => {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.removeItem(key);
      } catch (error) {
        console.warn('[SecureStore] Failed to delete item (web):', error);
      }
    }
    return;
  }
  try {
    await SecureStore.deleteItemAsync(key);
  } catch (error) {
    console.warn('[SecureStore] Failed to delete item:', error);
  }
};
