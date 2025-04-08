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
} from '@mui/material';

export default function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async () => {
    try {
      const res = await api.post('/auth/login', form);
      localStorage.setItem('access_token', res.data.access_token);
      localStorage.setItem('user_id', res.data.user_id);
      navigate('/chat');
    } catch (err) {
      setError(err.response?.data?.error || '登录失败');
    }
  };

  return (
    <Container maxWidth="xs">
      <Paper elevation={4} sx={{ p: 4, mt: 8 }}>
        <Typography variant="h5" align="center" gutterBottom>
          账号登录
        </Typography>

        {error && (
          <Typography color="error" align="center" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}

        <TextField
          label="账号"
          name="username"
          value={form.username}
          onChange={handleChange}
          fullWidth
          margin="normal"
        />
        <TextField
          label="密码"
          type="password"
          name="password"
          value={form.password}
          onChange={handleChange}
          fullWidth
          margin="normal"
        />

        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          fullWidth
          sx={{ mt: 2 }}
        >
          登录
        </Button>

        <Box mt={2} textAlign="center">
          <Link to="/register" style={{ color: '#1976d2' }}>
            没有账号？注册
          </Link>
        </Box>
      </Paper>
    </Container>
  );
}
