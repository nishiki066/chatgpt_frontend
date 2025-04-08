import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/api';
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';

export default function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    // 当用户开始输入时，清除错误信息
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e?.preventDefault(); // 防止表单默认提交行为

    // 表单验证
    if (!form.username.trim()) {
      setError('请输入账号');
      return;
    }
    if (!form.password.trim()) {
      setError('请输入密码');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/login', form);
      localStorage.setItem('access_token', res.data.access_token);
      localStorage.setItem('user_id', res.data.user_id);
      navigate('/chat');
    } catch (err) {
      const errorMsg = err.response?.data?.error || '登录失败，请检查网络连接';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Container maxWidth="xs">
      <Box
        sx={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        <Paper
          elevation={4}
          sx={{
            p: 4,
            borderRadius: 2,
            background: 'linear-gradient(to bottom, #f9f9f9, #ffffff)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.1)'
          }}
        >
          <Typography
            variant="h4"
            align="center"
            gutterBottom
            sx={{ fontWeight: 'bold', color: '#1976d2', mb: 3 }}
          >
            智能助手登录
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              label="账号"
              name="username"
              value={form.username}
              onChange={handleChange}
              fullWidth
              margin="normal"
              variant="outlined"
              autoFocus
              disabled={loading}
              InputProps={{
                sx: { borderRadius: 1.5 }
              }}
            />

            <TextField
              label="密码"
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={form.password}
              onChange={handleChange}
              fullWidth
              margin="normal"
              variant="outlined"
              disabled={loading}
              InputProps={{
                sx: { borderRadius: 1.5 },
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={toggleShowPassword}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />

            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              size="large"
              disabled={loading}
              sx={{
                mt: 3,
                mb: 2,
                borderRadius: 1.5,
                py: 1.2,
                fontSize: '1rem',
                textTransform: 'none'
              }}
            >
              {loading ? <CircularProgress size={24} /> : '登 录'}
            </Button>
          </form>

          <Box mt={2} textAlign="center">
            <Typography variant="body2" color="text.secondary">
              还没有账号？{' '}
              <Link
                to="/register"
                style={{
                  color: '#1976d2',
                  textDecoration: 'none',
                  fontWeight: 'bold'
                }}
              >
                立即注册
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}