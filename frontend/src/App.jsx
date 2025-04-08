import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ThemeProvider, createTheme, CssBaseline, CircularProgress, Box } from '@mui/material';
import LoginPage from './auth/LoginPage';
import RegisterPage from './auth/RegisterPage';
import ChatPage from './chat/ChatPage';

// 创建自定义主题
const theme = createTheme({
  palette: {
    primary: {
      main: '#2196f3',
      light: '#64b5f6',
      dark: '#1976d2',
    },
    secondary: {
      main: '#f50057',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
      },
    },
  },
});

// 受保护的路由组件
const ProtectedRoute = ({ element }) => {
  const token = localStorage.getItem('access_token');
  // 检查token是否存在和是否过期
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return element;
};

// 公共路由组件（已登录用户不能访问）
const PublicRoute = ({ element }) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    return <Navigate to="/chat" replace />;
  }
  return element;
};

export default function App() {
  const [loading, setLoading] = useState(true);

  // 模拟检查token有效性或加载必要资源
  useEffect(() => {
    // 这里可以添加验证token的逻辑，例如发送请求到后端验证
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          {/* 根路径重定向 */}
          <Route path="/" element={<Navigate to="/chat" />} />

          {/* 公共路由（未登录用户） */}
          <Route path="/login" element={<PublicRoute element={<LoginPage />} />} />
          <Route path="/register" element={<PublicRoute element={<RegisterPage />} />} />

          {/* 受保护路由（需要登录） */}
          <Route path="/chat" element={<ProtectedRoute element={<ChatPage />} />} />

          {/* 404路由 */}
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}