const API_KEY_STORAGE_KEY = 'gemini_api_key';

export const getApiKey = (): string | null => {
  // First check environment variable (for production builds)
  // @ts-ignore - process.env is injected by Vite at build time
  const envKey = typeof process !== 'undefined' && process.env?.API_KEY ? process.env.API_KEY : null;
  if (envKey) {
    return envKey;
  }
  // Then check localStorage (for user input)
  return localStorage.getItem(API_KEY_STORAGE_KEY);
};

export const setApiKey = (key: string): void => {
  localStorage.setItem(API_KEY_STORAGE_KEY, key);
};

export const hasApiKey = (): boolean => {
  return getApiKey() !== null;
};

