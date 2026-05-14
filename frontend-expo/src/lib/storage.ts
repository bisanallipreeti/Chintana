import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const ACCESS_TOKEN_KEY = "chintana_access_token";
const REFRESH_TOKEN_KEY = "chintana_refresh_token";
const ONBOARDING_KEY = "chintana_onboarding_complete";
const OFFLINE_QUEUE_KEY = "chintana_offline_queue";

const isWeb = Platform.OS === "web";

async function getSensitiveValue(key: string) {
  if (!isWeb) {
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      // Fall back to AsyncStorage if SecureStore is unavailable on this runtime.
    }
  }

  return AsyncStorage.getItem(key);
}

async function setSensitiveValue(key: string, value: string) {
  if (!isWeb) {
    try {
      await SecureStore.setItemAsync(key, value);
      return;
    } catch {
      // Fall back to AsyncStorage if SecureStore is unavailable on this runtime.
    }
  }

  await AsyncStorage.setItem(key, value);
}

async function deleteSensitiveValue(key: string) {
  if (!isWeb) {
    try {
      await SecureStore.deleteItemAsync(key);
      return;
    } catch {
      // Fall back to AsyncStorage if SecureStore is unavailable on this runtime.
    }
  }

  await AsyncStorage.removeItem(key);
}

export async function getAccessToken() {
  return getSensitiveValue(ACCESS_TOKEN_KEY);
}

export async function setAccessToken(token: string) {
  await setSensitiveValue(ACCESS_TOKEN_KEY, token);
}

export async function getRefreshToken() {
  return getSensitiveValue(REFRESH_TOKEN_KEY);
}

export async function setRefreshToken(token: string) {
  await setSensitiveValue(REFRESH_TOKEN_KEY, token);
}

export async function clearSessionTokens() {
  await Promise.all([
    deleteSensitiveValue(ACCESS_TOKEN_KEY),
    deleteSensitiveValue(REFRESH_TOKEN_KEY),
  ]);
}

export async function isOnboardingComplete() {
  return (await AsyncStorage.getItem(ONBOARDING_KEY)) === "1";
}

export async function setOnboardingComplete() {
  await AsyncStorage.setItem(ONBOARDING_KEY, "1");
}

export interface OfflineQueueItem {
  id: string;
  type: "CREATE_THOUGHT";
  payload: Record<string, unknown>;
  createdAt: string;
}

export async function getOfflineQueue(): Promise<OfflineQueueItem[]> {
  const raw = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
  if (!raw) return [];

  try {
    return JSON.parse(raw) as OfflineQueueItem[];
  } catch {
    return [];
  }
}

export async function setOfflineQueue(items: OfflineQueueItem[]) {
  await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(items));
}

export async function pushOfflineQueueItem(item: OfflineQueueItem) {
  const current = await getOfflineQueue();
  current.push(item);
  await setOfflineQueue(current);
}
