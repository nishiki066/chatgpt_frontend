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

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
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
    if (form.password.length < 6) {
      setError('密码长度至少为6位');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    setLoading(true);
    try {
      const registerData = {
        username: form.username,
        password: form.password
      };

      await api.post('/auth/register', registerData);
      setSuccess(true);

      // 3秒后跳转到登录页
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      const errorMsg = err.response?.data?.error || '注册失败，请稍后再试';
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
            注册账号
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              注册成功！3秒后自动跳转到登录页...
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
              disabled={loading || success}
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
              disabled={loading || success}
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
              helperText="密码长度至少6位"
            />

            <TextField
              label="确认密码"
              type={showPassword ? 'text' : 'password'}
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              fullWidth
              margin="normal"
              variant="outlined"
              disabled={loading || success}
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
              error={form.password !== form.confirmPassword && form.confirmPassword !== ''}
              helperText={form.password !== form.confirmPassword && form.confirmPassword !== '' ? '两次输入的密码不一致' : ''}
            />

            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              size="large"
              disabled={loading || success}
              sx={{
                mt: 3,
                mb: 2,
                borderRadius: 1.5,
                py: 1.2,
                fontSize: '1rem',
                textTransform: 'none'
              }}
            >
              {loading ? <CircularProgress size={24} /> : '注 册'}
            </Button>
          </form>

          <Box mt={2} textAlign="center">
            <Typography variant="body2" color="text.secondary">
              已有账号？{' '}
              <Link
                to="/login"
                style={{
                  color: '#1976d2',
                  textDecoration: 'none',
                  fontWeight: 'bold'
                }}
              >
                返回登录
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}