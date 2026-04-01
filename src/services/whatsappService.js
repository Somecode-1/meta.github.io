import api from './api';

async function getEmbeddedSignupConfig() {
  const { data } = await api.get('/whatsapp/embedded-signup/config');
  return data;
}

async function completeEmbeddedSignup(payload) {
  const { data } = await api.post('/whatsapp/embedded-signup/complete', payload);
  return data;
}

async function getAccounts() {
  const { data } = await api.get('/whatsapp/accounts');
  return data.accounts || [];
}

async function disconnectAccount(accountId) {
  const { data } = await api.post(`/whatsapp/accounts/${accountId}/disconnect`);
  return data;
}

export default {
  getEmbeddedSignupConfig,
  completeEmbeddedSignup,
  getAccounts,
  disconnectAccount
};
