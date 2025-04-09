// src/chat/ChatPage.jsx
import { useEffect, useState, useRef } from 'react';
import api, { getIsOffline, setNetworkStatusChangeListener, checkNetworkStatus } from '../api/api';
import { useNavigate } from 'react-router-dom';
import {
  Box, Button, Divider, IconButton, List, ListItem, ListItemText,
  Paper, TextField, Typography, CircularProgress, AppBar, Toolbar,
  Dialog, DialogTitle, DialogContent, DialogActions, DialogContentText,
  Tooltip, Alert, Snackbar
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import RefreshIcon from '@mui/icons-material/Refresh';
import WifiOffIcon from '@mui/icons-material/WifiOff';

// 离线状态组件 - 当应用检测到网络连接问题时显示
const OfflineState = ({ onRetry }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        bgcolor: '#f5f5f5'
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          maxWidth: 500,
          mx: 'auto'
        }}
      >
        <WifiOffIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />

        <Typography variant="h5" gutterBottom align="center">
          无法连接到服务器
        </Typography>

        <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 3 }}>
          看起来网络连接出现了问题，无法连接到服务器。
          可能是以下原因造成：
        </Typography>

        <Box sx={{ width: '100%', mb: 3 }}>
          <Typography component="div" variant="body2">
            • 服务器暂时不可用或正在维护
          </Typography>
          <Typography component="div" variant="body2">
            • 您的网络连接出现问题
          </Typography>
          <Typography component="div" variant="body2">
            • 您的防火墙或代理设置阻止了连接
          </Typography>
        </Box>

        <Button
          variant="contained"
          color="primary"
          onClick={onRetry}
          sx={{ mt: 2 }}
        >
          重试连接
        </Button>
      </Paper>
    </Box>
  );
};

export default function ChatPage() {
  // 状态变量
  const [sessions, setSessions] = useState([]); // 会话列表
  const [messages, setMessages] = useState([]); // 当前会话的消息列表
  const [newMessage, setNewMessage] = useState(''); // 新消息输入
  const [currentSessionId, setCurrentSessionId] = useState(null); // 当前选中的会话ID
  const [loading, setLoading] = useState(false); // 加载状态
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false); // 删除确认对话框状态
  const [sessionToDelete, setSessionToDelete] = useState(null); // 要删除的会话
  const [renameDialogOpen, setRenameDialogOpen] = useState(false); // 重命名对话框状态
  const [newSessionName, setNewSessionName] = useState(''); // 新会话名称
  const [sessionToRename, setSessionToRename] = useState(null); // 要重命名的会话
  const [error, setError] = useState(''); // 错误信息
  const [deleteLoading, setDeleteLoading] = useState(false); // 删除加载状态
  const [successMessage, setSuccessMessage] = useState(''); // 成功消息
  const [lastError, setLastError] = useState(null); // 最后一次错误，用于调试
  const [isOffline, setIsOffline] = useState(getIsOffline()); // 离线状态
  const [retryCount, setRetryCount] = useState(0); // 重试次数
  const [showRetrySnackbar, setShowRetrySnackbar] = useState(false); // 显示重试提示

  const navigate = useNavigate();
  const pollingRef = useRef(null); // 用于存储轮询定时器引用
  const messagesEndRef = useRef(null); // 用于自动滚动到底部
  const user_id = localStorage.getItem('user_id'); // 从本地存储获取用户ID

  // 自动滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 处理API响应错误
  const handleApiError = (error, errorMessage) => {
    console.error(errorMessage, error);
    setLastError(error); // 存储错误对象，便于调试

    // 检查是否是网络错误
    if (error.isNetworkError || error.code === 'ERR_NETWORK' || error.message?.includes('network')) {
      setIsOffline(true);
      return;
    }

    // 检查是否是未授权错误(401)或者token相关错误
    if (error.response?.status === 401 ||
        error.response?.data?.msg?.includes('token') ||
        error.message?.includes('token')) {
      // token过期或无效，清除本地存储并跳转到登录页
      localStorage.clear();
      navigate('/login');
      return;
    }

    // 获取详细错误信息(如果有)
    let errorDetails = '';
    if (error.response?.data?.details) {
      errorDetails = `: ${error.response.data.details}`;
    } else if (error.response?.data?.error) {
      errorDetails = `: ${error.response.data.error}`;
    }

    // 根据HTTP状态码来设置不同的错误消息
    let finalErrorMessage = errorMessage;

    if (error.response) {
      switch (error.response.status) {
        case 400:
          finalErrorMessage = `请求参数错误${errorDetails}`;
          break;
        case 403:
          finalErrorMessage = `没有权限执行此操作${errorDetails}`;
          break;
        case 404:
          finalErrorMessage = `请求的资源不存在${errorDetails}`;
          break;
        case 500:
          finalErrorMessage = `服务器错误，请联系管理员${errorDetails}`;
          break;
        default:
          finalErrorMessage = `${errorMessage}${errorDetails}`;
      }
    }

    // 显示错误信息
    setError(finalErrorMessage);

    // 5秒后自动清除错误信息
    setTimeout(() => {
      setError('');
    }, 5000);
  };

  // 重试连接
  const handleRetryConnection = async () => {
    setRetryCount(prev => prev + 1);
    setShowRetrySnackbar(true);

    try {
      const isOnline = await checkNetworkStatus();
      setIsOffline(!isOnline);

      if (isOnline) {
        // 如果恢复连接，重新加载会话
        await loadSessions();
        setSuccessMessage('连接已恢复');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        // 仍然离线
        setError('无法连接到服务器，请检查网络连接');
      }
    } catch (err) {
      console.error('重试连接失败:', err);
      setError('重试连接失败，请稍后再试');
    } finally {
      setShowRetrySnackbar(false);
    }
  };

  // 加载会话列表
  const loadSessions = async () => {
    try {
      const res = await api.get(`/session/user/${user_id}`);
      setSessions(res.data.sessions);

      // 如果有会话但没有选中的会话，则选中第一个
      if (res.data.sessions.length > 0 && !currentSessionId) {
        setCurrentSessionId(res.data.sessions[0].id);
      }
    } catch (error) {
      handleApiError(error, '加载会话失败');
    }
  };

  // 加载指定会话的消息
  const loadMessages = async (sessionId) => {
    try {
      const res = await api.get(`/message/${sessionId}`);
      setMessages(res.data.messages);
      setTimeout(scrollToBottom, 100); // 加载完消息后滚动到底部
    } catch (error) {
      handleApiError(error, '加载消息失败');
    }
  };

  // 创建新会话
  const createSession = async () => {
    try {
      const res = await api.post('/session/create', { title: '新会话' });
      await loadSessions(); // 重新加载会话列表
      setCurrentSessionId(res.data.session_id); // 选中新创建的会话
    } catch (error) {
      handleApiError(error, '创建会话失败');
    }
  };

  // 打开删除会话确认对话框
  const openDeleteDialog = (session, event) => {
    event.stopPropagation(); // 阻止事件冒泡，避免同时触发选中会话
    setSessionToDelete(session);
    setDeleteDialogOpen(true);
  };

  // 确认删除会话
  const confirmDeleteSession = async () => {
    setDeleteLoading(true); // 设置删除按钮加载状态

    try {
      await api.delete(`/session/${sessionToDelete.id}`);

      // 如果删除的是当前会话，则切换到其他会话
      if (sessionToDelete.id === currentSessionId) {
        const otherSession = sessions.find(s => s.id !== sessionToDelete.id);
        if (otherSession) {
          setCurrentSessionId(otherSession.id);
        } else {
          setCurrentSessionId(null);
          setMessages([]);
        }
      }

      // 显示成功提示
      setSuccessMessage('会话删除成功');
      setTimeout(() => setSuccessMessage(''), 3000);

      await loadSessions(); // 重新加载会话列表
      setDeleteDialogOpen(false);
    } catch (error) {
      // 使用增强的错误处理
      handleApiError(error, '删除会话失败');

      // 对于500错误，提供更具体的反馈
      if (error.response?.status === 500) {
        setError('删除会话失败：服务器处理错误。可能是数据关联问题，请稍后再试。');
      }
    } finally {
      setDeleteLoading(false);
      setDeleteDialogOpen(false); // 无论成功或失败都关闭对话框
    }
  };

  // 打开重命名对话框
  const openRenameDialog = (session, event) => {
    event.stopPropagation(); // 阻止事件冒泡
    setSessionToRename(session);
    setNewSessionName(session.title); // 设置当前标题为初始值
    setRenameDialogOpen(true);
  };

  // 确认重命名会话
  const confirmRenameSession = async () => {
    try {
      // 调用后端API更新会话标题
      await api.patch(`/session/${sessionToRename.id}`, {
        title: newSessionName
      });
      await loadSessions(); // 重新加载会话列表以获取更新后的标题
      setRenameDialogOpen(false);

      // 显示成功消息
      setSuccessMessage('会话重命名成功');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      handleApiError(error, '重命名会话失败');
      setRenameDialogOpen(false); // 关闭对话框，即使发生错误
    }
  };

  // 智能生成会话标题
  const generateSessionName = async (sessionId) => {
    try {
      setLoading(true); // 设置加载状态

      // 调用新的API生成会话标题
      await api.post(`/session/${sessionId}/generate-title`);
      await loadSessions(); // 重新加载会话列表以获取新标题

      // 显示成功消息
      setSuccessMessage('会话标题已智能生成');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      handleApiError(error, '自动生成会话标题失败');
    } finally {
      setLoading(false); // 重置加载状态
    }
  };

  // 发送消息
  const sendMessage = async () => {
    if (!newMessage.trim()) return; // 不发送空消息

    try {
      // 发送消息到后端
      const res = await api.post('/message/send', {
        session_id: currentSessionId,
        content: newMessage,
        model: 'gpt-3.5-turbo', // 指定使用的模型
      });

      // 创建新消息对象并添加到消息列表
      const newMsg = {
        id: res.data.message_id,
        content: newMessage,
        role: 'user',
        created_at: new Date().toISOString(),
      };

      setMessages(prev => [...prev, newMsg]);
      setNewMessage(''); // 清空输入框

      // 判断是否应该生成标题
      const isFirstMessage = messages.length === 0;
      const shouldGenerateTitle = isFirstMessage ||
        (messages.length > 0 && messages.length % 5 === 0); // 每发送5条消息尝试更新一次标题

      if (shouldGenerateTitle) {
        // 延迟一点生成标题，确保先把用户消息发送出去并显示
        setTimeout(() => {
          generateSessionName(currentSessionId);
        }, 500);
      }

      // 开始轮询获取AI响应
      streamMessageUpdates(res.data.message_id);
      setTimeout(scrollToBottom, 100); // 滚动到底部
    } catch (error) {
      handleApiError(error, '发送消息失败');
    }
  };

  // 轮询获取消息更新（用于流式返回AI回复）
  const streamMessageUpdates = (lastUserMessageId) => {
    setLoading(true);
    let lastMessageId = null;

    // 清除之前的轮询
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }

    // 设置轮询间隔为1秒
    pollingRef.current = setInterval(async () => {
      try {
        // 获取新消息
        const res = await api.get(`/message/${currentSessionId}/updates?last_message_id=${lastUserMessageId}`);
        const newMsgs = res.data.messages;

        if (newMsgs.length > 0) {
          newMsgs.forEach((m) => {
            if (!lastMessageId) {
              // 第一条新消息，直接添加到列表中
              lastMessageId = m.id;
              setMessages(prev => [...prev, m]);
            } else {
              // 已有消息，更新内容（用于流式响应）
              setMessages(prev => prev.map(msg =>
                msg.id === m.id ? { ...msg, content: (msg.content || '') + m.content, status: m.status } : msg
              ));
            }
          });

          // 检查最后一条消息的状态，如果已完成则停止轮询
          const lastStatus = newMsgs[newMsgs.length - 1].status;
          if (lastStatus === 'completed') {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
            setLoading(false);
            setTimeout(scrollToBottom, 100);
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

  // 组件卸载时清理轮询定时器
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  // 设置网络状态监听
  useEffect(() => {
    // 设置网络状态变化监听器
    setNetworkStatusChangeListener((offline) => {
      setIsOffline(offline);

      if (!offline) {
        // 网络恢复时自动重新加载数据
        loadSessions();
        setSuccessMessage('网络连接已恢复');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    });

    // 初始检查网络状态
    checkNetworkStatus().then(online => {
      setIsOffline(!online);
    });

    return () => {
      // 清除监听器
      setNetworkStatusChangeListener(null);
    };
  }, []);

  // 首次加载会话列表
  useEffect(() => {
    loadSessions();
  }, []);

  // 当选中的会话ID变化时，加载该会话的消息
  useEffect(() => {
    if (currentSessionId) {
      loadMessages(currentSessionId);
    }
  }, [currentSessionId]);

  // 如果处于离线状态，显示离线页面
  if (isOffline) {
    return <OfflineState onRetry={handleRetryConnection} />;
  }

  return (
    <Box display="flex" height="100vh">
      {/* 侧边栏 - 会话列表 */}
      <Paper elevation={3} sx={{ width: 260, display: 'flex', flexDirection: 'column' }}>
        <Box p={2} display="flex" justifyContent="space-between" alignItems="center" bgcolor="primary.main" color="white">
          <Typography variant="h6">会话列表</Typography>
          <Tooltip title="新建会话">
            <IconButton onClick={createSession} color="inherit">
              <AddIcon />
            </IconButton>
          </Tooltip>
        </Box>
        <Divider />

        {/* 会话列表 */}
        <List sx={{ flexGrow: 1, overflowY: 'auto' }}>
          {sessions.length === 0 ? (
            <Box p={2} textAlign="center">
              <Typography color="text.secondary">暂无会话，点击右上角+创建</Typography>
            </Box>
          ) : (
            sessions.map(s => (
              <ListItem
                key={s.id}
                component="div"
                selected={s.id === currentSessionId}
                onClick={() => setCurrentSessionId(s.id)}
                sx={{
                  borderRadius: 1,
                  m: 0.5,
                  cursor: 'pointer',
                  '&.Mui-selected': {
                    bgcolor: 'primary.light',
                    '&:hover': {
                      bgcolor: 'primary.light',
                    }
                  }
                }}
                secondaryAction={
                  <Box>
                    <Tooltip title="重命名">
                      <IconButton edge="end" size="small" onClick={(e) => openRenameDialog(s, e)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="删除会话">
                      <IconButton edge="end" size="small" onClick={(e) => openDeleteDialog(s, e)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                }
              >
                <ListItemText
                  primary={s.title}
                  primaryTypographyProps={{
                    noWrap: true,
                    style: {
                      maxWidth: '160px',
                      textOverflow: 'ellipsis'
                    }
                  }}
                  secondary={new Date(s.created_at).toLocaleString()}
                />
              </ListItem>
            ))
          )}
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

      {/* 聊天区域 */}
      <Box flex={1} display="flex" flexDirection="column">
        {/* 顶部标题栏 */}
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              {currentSessionId
                ? sessions.find(s => s.id === currentSessionId)?.title || '聊天'
                : '请选择或创建会话'}
            </Typography>
            {/* 添加智能生成标题按钮 */}
            {currentSessionId && messages.length > 0 && (
              <Tooltip title="智能生成标题">
                <IconButton
                  color="inherit"
                  onClick={() => generateSessionName(currentSessionId)}
                  disabled={loading}
                >
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            )}
          </Toolbar>
        </AppBar>

        {/* 错误提示 */}
        {error && (
          <Box sx={{
            position: 'fixed',
            top: 70,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            minWidth: 300
          }}>
            <Alert
              severity="error"
              variant="filled"
              onClose={() => setError('')}
              sx={{ boxShadow: 3 }}
            >
              {error}
            </Alert>
          </Box>
        )}

        {/* 成功提示 */}
        {successMessage && (
          <Box sx={{
            position: 'fixed',
            top: 70,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            minWidth: 300
          }}>
            <Alert
              severity="success"
              variant="filled"
              onClose={() => setSuccessMessage('')}
              sx={{ boxShadow: 3 }}
            >
              {successMessage}
            </Alert>
          </Box>
        )}

        {/* 消息区域 */}
        <Box
          flex={1}
          overflow="auto"
          p={2}
          sx={{ bgcolor: '#f5f5f5' }}
        >
          {currentSessionId ? (
            messages.length === 0 ? (
              // 空会话提示
              <Box
                height="100%"
                display="flex"
                flexDirection="column"
                justifyContent="center"
                alignItems="center"
              >
                <Typography color="text.secondary" variant="h6">
                  开始新的对话
                </Typography>
                <Typography color="text.secondary" variant="body2" mt={1}>
                  在下方输入框中发送消息
                </Typography>
              </Box>
            ) : (
              // 消息列表
              messages.map(m => (
                <Box
                  key={m.id}
                  display="flex"
                  justifyContent={m.role === 'user' ? 'flex-end' : 'flex-start'}
                  mb={2}
                >
                  <Box
                    bgcolor={m.role === 'user' ? 'primary.light' : 'white'}
                    color={m.role === 'user' ? 'white' : 'text.primary'}
                    px={3}
                    py={2}
                    borderRadius={2}
                    maxWidth="70%"
                    boxShadow={1}
                    sx={{
                      wordBreak: 'break-word',
                      whiteSpace: 'pre-wrap'
                    }}
                  >
                    {m.content}
                  </Box>
                </Box>
              ))
            )
          ) : (
            // 未选择会话提示
            <Box
              height="100%"
              display="flex"
              flexDirection="column"
              justifyContent="center"
              alignItems="center"
            >
              <Typography color="text.secondary" variant="h6">
                请选择或创建会话
              </Typography>
            </Box>
          )}

          {/* AI思考中状态显示 */}
          {loading && (
            <Box display="flex" justifyContent="flex-start" mt={2}>
              <Box
                bgcolor="white"
                px={3}
                py={2}
                borderRadius={2}
                display="flex"
                alignItems="center"
                boxShadow={1}
              >
                <CircularProgress size={20} sx={{ mr: 1 }} />
                <Typography>AI思考中...</Typography>
              </Box>
            </Box>
          )}

          {/* 用于自动滚动到底部的参考元素 */}
          <div ref={messagesEndRef} />
        </Box>

        {/* 输入区域 */}
        <Box display="flex" p={2} borderTop="1px solid #ddd" bgcolor="white">
          <TextField
            fullWidth
            variant="outlined"
            size="small"
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder="请输入消息，回车发送，Shift+Enter换行"
            disabled={!currentSessionId || loading}
            multiline
            maxRows={3}
            sx={{ mr: 1 }}
          />
          <Button
            variant="contained"
            onClick={sendMessage}
            disabled={!currentSessionId || loading || !newMessage.trim()}
          >
            发送
          </Button>
        </Box>
      </Box>

      {/* 确认删除对话框 */}
      <Dialog open={deleteDialogOpen} onClose={() => !deleteLoading && setDeleteDialogOpen(false)}>
        <DialogTitle>确认删除</DialogTitle>
        <DialogContent>
          <DialogContentText>
            确定要删除会话 "{sessionToDelete?.title}" 吗？此操作不可撤销。
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            disabled={deleteLoading}
          >
            取消
          </Button>
          <Button
            onClick={confirmDeleteSession}
            color="error"
            disabled={deleteLoading}
            startIcon={deleteLoading ? <CircularProgress size={20} /> : null}
          >
            {deleteLoading ? '处理中...' : '删除'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 重命名对话框 */}
      <Dialog open={renameDialogOpen} onClose={() => setRenameDialogOpen(false)}>
        <DialogTitle>重命名会话</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="会话名称"
            fullWidth
            value={newSessionName}
            onChange={(e) => setNewSessionName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRenameDialogOpen(false)}>取消</Button>
          <Button
            onClick={confirmRenameSession}
            color="primary"
            disabled={!newSessionName.trim()}
          >
            保存
          </Button>
        </DialogActions>
      </Dialog>

      {/* 重试连接提示 */}
      <Snackbar
        open={showRetrySnackbar}
        message={
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <CircularProgress size={20} sx={{ mr: 1 }} color="inherit" />
            <span>正在尝试重新连接服务器...</span>
          </Box>
        }
      />
    </Box>
  );
}