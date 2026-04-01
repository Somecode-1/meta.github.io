import api from './api';

async function getConversations() {
  const { data } = await api.get('/conversations');
  return data;
}

async function getConversationMessages(conversationId) {
  const { data } = await api.get(`/conversations/${conversationId}/messages`);
  return data;
}

async function sendMessage(payload) {
  const { data } = await api.post('/messages/send', payload);
  return data;
}

export default {
  getConversations,
  getConversationMessages,
  sendMessage
};
