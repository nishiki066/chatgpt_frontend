import axios from 'axios';

// 网络状态
let isOffline = false;
let onNetworkStatusChange = null;

// 用于检测网络状态的函数
export const checkNetworkStatus = async () => {
  try {
    // 使用后端接口URL进行测试
    const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';
    await fetch(`${API_BASE}/ping`, {
      method: 'GET',
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' },
      // 设置较短的超时时间
      signal: AbortSignal.timeout(2000)
    });
    setNetworkStatus(true);
    return true;
  } catch (error) {
    setNetworkStatus(false);
    return false;
  }
};

// 设置网络状态并触发回调
const setNetworkStatus = (status) => {
  const previousStatus = isOffline;
  isOffline = !status;

  // 只有当状态发生变化时才触发回调
  if (previousStatus !== isOffline && onNetworkStatusChange) {
    onNetworkStatusChange(isOffline);
  }
};

// 注册网络状态变化监听器
export const setNetworkStatusChangeListener = (callback) => {
  onNetworkStatusChange = callback;
};

// 获取当前网络状态
export const getIsOffline = () => isOffline;

// 使用环境变量获取API地址
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 设置10秒超时
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
    // 收到正常响应，说明网络正常
    setNetworkStatus(true);
    return response;
  },
  error => {
    // 网络错误（无响应）
    if (!error.response) {
      // 设置应用为离线状态
      setNetworkStatus(false);

      // 自定义错误信息
      return Promise.reject({
        ...error,
        message: '网络连接错误，请检查网络或服务器状态',
        isNetworkError: true
      });
    }

    // 处理不同的错误状态码
    const { status, data } = error.response;

    switch (status) {
      case 401: // 未授权
        // 清除本地存储的token
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_id');
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

// 网络状态检测
if (typeof window !== 'undefined') {
  // 监听在线/离线事件
  window.addEventListener('online', () => {
    setNetworkStatus(true);
    checkNetworkStatus(); // 重新检查与后端的连接
  });
  window.addEventListener('offline', () => setNetworkStatus(false));

  // 初始检查
  setNetworkStatus(navigator.onLine);
}

// 导出api实例和网络状态相关函数
export default api;