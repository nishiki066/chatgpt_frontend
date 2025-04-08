// src/chat/ChatPage.jsx
import { useEffect, useState, useRef } from 'react';
import api from '../api/api';
import { useNavigate } from 'react-router-dom';
import {
  Box, Button, Divider, IconButton, List, ListItem, ListItemText,
  Paper, TextField, Typography, CircularProgress, AppBar, Toolbar
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import AddIcon from '@mui/icons-material/Add';

export default function ChatPage() {
  const [sessions, setSessions] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const pollingRef = useRef(null);
  const user_id = localStorage.getItem('user_id');

  const loadSessions = async () => {
    const res = await api.get(`/session/${user_id}`);
    setSessions(res.data.sessions);
    if (res.data.sessions.length > 0) {
      setCurrentSessionId(res.data.sessions[0].id);
    }
  };

  const loadMessages = async (sessionId) => {
    const res = await api.get(`/message/${sessionId}`);
    setMessages(res.data.messages);
  };

  const createSession = async () => {
    const res = await api.post('/session/create', { title: '新会话' });
    await loadSessions();
    setCurrentSessionId(res.data.session_id);
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    const res = await api.post('/message/send', {
      session_id: currentSessionId,
      content: newMessage,
      model: 'gpt-3.5-turbo',
    });
    const newMsg = {
      id: res.data.message_id,
      content: newMessage,
      role: 'user',
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, newMsg]);
    setNewMessage('');
    streamMessageUpdates(res.data.message_id);
  };

  const streamMessageUpdates = (lastUserMessageId) => {
    setLoading(true);
    let buffer = '';
    let lastMessageId = null;
    pollingRef.current = setInterval(async () => {
      try {
        const res = await api.get(`/message/${currentSessionId}/updates?last_message_id=${lastUserMessageId}`);
        const newMsgs = res.data.messages;
        if (newMsgs.length > 0) {
          newMsgs.forEach((m) => {
            if (!lastMessageId) {
              lastMessageId = m.id;
              setMessages(prev => [...prev, m]);
            } else {
              setMessages(prev => prev.map(msg =>
                msg.id === m.id ? { ...msg, content: (msg.content || '') + m.content, status: m.status } : msg
              ));
            }
          });

          const lastStatus = newMsgs[newMsgs.length - 1].status;
          if (lastStatus === 'completed') {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
            setLoading(false);
          }
        }
      } catch (e) {
        console.error('轮询出错:', e);
        clearInterval(pollingRef.current);
        pollingRef.current = null;
        setLoading(false);
      }
    }, 1000);
  };

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    if (currentSessionId) loadMessages(currentSessionId);
  }, [currentSessionId]);

  return (
    <Box display="flex" height="100vh">
      <Paper elevation={3} sx={{ width: 260, display: 'flex', flexDirection: 'column' }}>
        <Box p={2} display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">会话</Typography>
          <IconButton onClick={createSession}><AddIcon /></IconButton>
        </Box>
        <Divider />
        <List sx={{ flexGrow: 1, overflowY: 'auto' }}>
          {sessions.map(s => (
            <ListItem
              key={s.id}
              button
              selected={s.id === currentSessionId}
              onClick={() => setCurrentSessionId(s.id)}
            >
              <ListItemText primary={s.title} />
            </ListItem>
          ))}
        </List>
        <Divider />
        <Box p={2}>
          <Button
            startIcon={<LogoutIcon />}
            variant="outlined"
            fullWidth
            onClick={() => {
              localStorage.clear();
              navigate('/login');
            }}
          >
            退出登录
          </Button>
        </Box>
      </Paper>

      <Box flex={1} display="flex" flexDirection="column">
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>聊天</Typography>
          </Toolbar>
        </AppBar>

        <Box flex={1} overflow="auto" p={2}>
          {messages.map(m => (
            <Box
              key={m.id}
              display="flex"
              justifyContent={m.role === 'user' ? 'flex-end' : 'flex-start'}
              mb={1}
            >
              <Box
                bgcolor={m.role === 'user' ? 'primary.light' : 'grey.300'}
                color="black"
                px={2} py={1}
                borderRadius={2}
                maxWidth="70%"
              >
                {m.content}
              </Box>
            </Box>
          ))}
          {loading && (
            <Box display="flex" justifyContent="center" mt={2}>
              <CircularProgress size={24} />
            </Box>
          )}
        </Box>

        <Box display="flex" p={2} borderTop="1px solid #ddd">
          <TextField
            fullWidth
            size="small"
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder="请输入消息，回车发送"
          />
          <Button variant="contained" sx={{ ml: 1 }} onClick={sendMessage}>发送</Button>
        </Box>
      </Box>
    </Box>
  );
}
