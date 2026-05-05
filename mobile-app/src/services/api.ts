import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import axios from 'axios';

const configuredApiUrl = process.env.EXPO_PUBLIC_API_URL || Constants.expoConfig?.extra?.apiUrl || 'http://127.0.0.1:5000/api';
const apiUrl = configuredApiUrl.endsWith('/api') ? configuredApiUrl : `${configuredApiUrl.replace(/\/$/, '')}/api`;

const api = axios.create({
  baseURL: apiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('token');
    }

    return Promise.reject(error);
  }
);

export default api;
