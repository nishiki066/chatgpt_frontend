// src/auth/RegisterPage.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';
import {
  Container, TextField, Button, Typography, Paper, Box, Link
} from '@mui/material';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async () => {
    try {
      const res = await api.post('/auth/register', form);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.error || '注册失败');
    }
  };

  return (
    <Container maxWidth="xs" sx={{ mt: 10 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 4 }}>
        <Typography variant="h5" align="center" gutterBottom>
          注册账号
        </Typography>

        {error && (
          <Typography color="error" variant="body2" align="center" gutterBottom>
            {error}
          </Typography>
        )}

        <TextField
          label="账号"
          name="username"
          fullWidth
          margin="normal"
          value={form.username}
          onChange={handleChange}
        />
        <TextField
          label="密码"
          name="password"
          type="password"
          fullWidth
          margin="normal"
          value={form.password}
          onChange={handleChange}
        />

        <Button
          variant="contained"
          fullWidth
          sx={{ mt: 2 }}
          onClick={handleSubmit}
        >
          注 册
        </Button>

        <Box mt={2} textAlign="center">
          <Link href="/login" underline="hover">
            已有账号？去登录
          </Link>
        </Box>
      </Paper>
    </Container>
  );
}
