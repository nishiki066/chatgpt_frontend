import axios from 'axios';

// 使用环境变量获取API地址
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器：自动附加 token
api.interceptors.request.use(config => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;