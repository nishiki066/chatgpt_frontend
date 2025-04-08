import axios from 'axios';

// 使用环境变量获取API地址
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // 设置15秒超时
});

// 请求拦截器：自动附加 token
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// 响应拦截器：处理常见错误
api.interceptors.response.use(
  response => {
    // 正常响应直接返回
    return response;
  },
  error => {
    // 网络错误处理
    if (!error.response) {
      console.error('网络错误，请检查您的网络连接');
      return Promise.reject({
        ...error,
        message: '网络错误，请检查您的网络连接'
      });
    }

    // 处理不同的错误状态码
    const { status, data } = error.response;

    switch (status) {
      case 401: // 未授权
        // 清除本地存储的token
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_id');

        // 如果不是在登录页面，则重定向到登录页面
        if (!window.location.pathname.includes('/login')) {
          console.error('会话已过期，请重新登录');
          // 使用setTimeout避免在拦截器中直接导航
          setTimeout(() => {
            window.location.href = '/login';
          }, 100);
        }
        break;

      case 403: // 权限不足
        console.error('无权限执行此操作');
        break;

      case 404: // 资源不存在
        console.error('请求的资源不存在');
        break;

      case 500: // 服务器错误
        console.error('服务器错误，请稍后重试');
        break;

      default:
        console.error(`请求错误: ${status}`);
    }

    // 返回经过处理的错误
    return Promise.reject({
      ...error,
      message: data?.error || error.message
    });
  }
);

export default api;