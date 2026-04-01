import api from './api';

function getFacebookLoginUrl() {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
  return `${baseUrl}/auth/facebook`;
}

async function getEmbeddedSignupConfig() {
  const { data } = await api.get('/auth/embedded-signup/config');
  return data;
}

async function completeEmbeddedSignup(payload) {
  const { data } = await api.post('/auth/embedded-signup/complete', payload);
  return data;
}

async function getMe() {
  const { data } = await api.get('/auth/me');
  return data;
}

async function logout() {
  const { data } = await api.post('/auth/logout');
  return data;
}

export default {
  getFacebookLoginUrl,
  getEmbeddedSignupConfig,
  completeEmbeddedSignup,
  getMe,
  logout
};
