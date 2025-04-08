import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './auth/LoginPage';
import RegisterPage from './auth/RegisterPage';
import ChatPage from './chat/ChatPage';

export default function App() {
  const isAuthed = !!localStorage.getItem('token'); // 判断是否已登录

  return (
    <BrowserRouter>
      <Routes>
        {/* 根路径重定向 */}
        <Route path="/" element={<Navigate to={isAuthed ? '/chat' : '/login'} />} />

        {/* 登录与注册页面 */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* 聊天主页面 */}
        <Route path="/chat" element={<ChatPage />} />
      </Routes>
    </BrowserRouter>
  );
}
