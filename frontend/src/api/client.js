import axios from 'axios';

export const API_BASE = (process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000').replace(/\/+$/, '');

export const assetUrl = (path) => {
  if (!path) return '';
  if (/^(https?:|data:|blob:)/i.test(path)) return path;
  return `${API_BASE}/${String(path).replace(/^\/+/, '')}`;
};

export const getToken = () => {
  try {
    return localStorage.getItem('token') || JSON.parse(localStorage.getItem('user'))?.token || null;
  } catch {
    return null;
  }
};

export const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user'));
  } catch {
    return null;
  }
};

export const saveSession = ({ user, token }) => {
  localStorage.setItem('user', JSON.stringify({ ...user, token }));
  localStorage.setItem('token', token);
};

export const clearSession = () => {
  localStorage.removeItem('user');
  localStorage.removeItem('token');
};

export const errorMessage = (error, fallback = 'Something went wrong. Please try again.') =>
  error?.response?.data?.message || fallback;

const MAX_DIMENSION = 1600;
const COMPRESS_THRESHOLD = 600 * 1024;

const compressImage = (file) =>
  new Promise((resolve) => {
    if (!/^image\/(jpeg|jpg|png|webp)$/i.test(file.type) || file.size <= COMPRESS_THRESHOLD) {
      resolve(file);
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          if (!blob || blob.size >= file.size) {
            resolve(file);
            return;
          }
          const name = file.name.replace(/\.[^.]+$/, '') + '.jpg';
          resolve(new File([blob], name, { type: 'image/jpeg' }));
        },
        'image/jpeg',
        0.82
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };
    img.src = url;
  });

const compressFormData = async (formData) => {
  const result = new FormData();
  for (const [key, value] of formData.entries()) {
    result.append(key, value instanceof File ? await compressImage(value) : value);
  }
  return result;
};

const api = axios.create({ baseURL: `${API_BASE}/api`, timeout: 20000 });

api.interceptors.request.use(async (config) => {
  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    config.data = await compressFormData(config.data);
  }
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message;
    const sessionExpired = status === 401 && getToken() && (message === 'Token expired' || message === 'Invalid token');
    if (sessionExpired) {
      clearSession();
      window.location.assign('/login');
    }
    return Promise.reject(error);
  }
);

export default api;
