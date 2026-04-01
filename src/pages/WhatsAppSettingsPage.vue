<template>
  <AppLayout :user="authStore.user" @logout="handleLogout">
    <section class="settings-page">
      <header class="settings-header">
        <div>
          <h1>Настройки WhatsApp</h1>
          <p>Подключайте существующие номера из WhatsApp Business app через Meta Embedded Signup.</p>
        </div>
        <button class="primary-btn" :disabled="loadingAction" @click="startEmbeddedSignup()">
          {{ loadingAction ? 'Подключение...' : 'Подключить WhatsApp Business' }}
        </button>
      </header>

      <p v-if="successText" class="success-text">{{ successText }}</p>
      <p v-if="errorText" class="error-text">{{ errorText }}</p>

      <div class="table-wrap">
        <table class="accounts-table">
          <thead>
            <tr>
              <th>Статус</th>
              <th>Номер</th>
              <th>Business name</th>
              <th>WABA ID</th>
              <th>Подключён</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loadingList">
              <td colspan="6">Загрузка...</td>
            </tr>
            <tr v-else-if="!accounts.length">
              <td colspan="6">Подключённых номеров пока нет</td>
            </tr>
            <tr v-for="account in accounts" :key="account.id">
              <td>
                <span class="status-chip" :class="`status-${account.status}`">{{ account.status }}</span>
              </td>
              <td>{{ account.displayPhoneNumber || account.phoneNumberId }}</td>
              <td>{{ account.businessName || account.verifiedName || '—' }}</td>
              <td class="mono">{{ account.wabaId || '—' }}</td>
              <td>{{ formatDate(account.createdAt) }}</td>
              <td class="actions">
                <button class="secondary-btn" :disabled="loadingAction" @click="startEmbeddedSignup(account.id)">
                  Переподключить
                </button>
                <button
                  class="danger-btn"
                  :disabled="loadingAction || account.status === 'disconnected'"
                  @click="disconnectAccount(account.id)"
                >
                  Отключить
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </AppLayout>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useChatStore } from '../stores/chat';
import AppLayout from '../components/layout/AppLayout.vue';
import whatsappService from '../services/whatsappService';

const router = useRouter();
const authStore = useAuthStore();
const chatStore = useChatStore();

const accounts = ref([]);
const loadingList = ref(false);
const loadingAction = ref(false);
const errorText = ref('');
const successText = ref('');

const embeddedConfig = ref(null);
const reconnectAccountId = ref(null);
const pendingCode = ref('');
const pendingSetupInfo = ref(null);

let sdkReadyPromise = null;

function resetFeedback() {
  errorText.value = '';
  successText.value = '';
}

function formatDate(value) {
  if (!value) {
    return '—';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return date.toLocaleString();
}

function parseEmbeddedSignupMessage(rawData) {
  let data = rawData;
  if (typeof rawData === 'string') {
    try {
      data = JSON.parse(rawData);
    } catch (error) {
      return null;
    }
  }

  if (!data || data.type !== 'WA_EMBEDDED_SIGNUP' || !data.event) {
    return null;
  }

  return {
    event: data.event,
    payload: data.data || {}
  };
}

function tryExtractCodeFromMessageData(rawData) {
  if (typeof rawData !== 'string') {
    return '';
  }

  const normalized = rawData.startsWith('?') ? rawData.slice(1) : rawData;
  const params = new URLSearchParams(normalized);
  return (params.get('code') || '').trim();
}

async function loadAccounts() {
  loadingList.value = true;
  try {
    accounts.value = await whatsappService.getAccounts();
  } catch (error) {
    errorText.value = error?.response?.data?.message || 'Не удалось загрузить список номеров';
  } finally {
    loadingList.value = false;
  }
}

function maybeCompleteSignup() {
  if (!pendingCode.value || !pendingSetupInfo.value) {
    return;
  }

  const code = pendingCode.value;
  const setupInfo = pendingSetupInfo.value;
  const targetAccountId = reconnectAccountId.value;

  pendingCode.value = '';
  pendingSetupInfo.value = null;
  reconnectAccountId.value = null;
  loadingAction.value = true;
  resetFeedback();

  whatsappService
    .completeEmbeddedSignup({
      code,
      setupInfo,
      reconnectAccountId: targetAccountId
    })
    .then(async () => {
      successText.value = 'WhatsApp Business успешно подключён';
      await loadAccounts();
    })
    .catch((error) => {
      errorText.value = error?.response?.data?.message || 'Не удалось завершить подключение';
    })
    .finally(() => {
      loadingAction.value = false;
    });
}

function handleWindowMessage(event) {
  const isFacebookOrigin = /^https:\/\/([a-z0-9-]+\.)*facebook\.com$/i.test(event.origin || '');
  if (!isFacebookOrigin) {
    return;
  }

  const codeFromMessage = tryExtractCodeFromMessageData(event.data);
  if (codeFromMessage) {
    pendingCode.value = codeFromMessage;
    maybeCompleteSignup();
    return;
  }

  const parsed = parseEmbeddedSignupMessage(event.data);
  if (!parsed) {
    return;
  }

  if (parsed.event === 'FINISH') {
    pendingSetupInfo.value = parsed.payload;
    maybeCompleteSignup();
    return;
  }

  if (parsed.event === 'CANCEL') {
    loadingAction.value = false;
    errorText.value = 'Подключение отменено пользователем';
  }
}

function ensureFacebookSdkReady({ appId, graphVersion }) {
  if (sdkReadyPromise) {
    return sdkReadyPromise;
  }

  sdkReadyPromise = new Promise((resolve, reject) => {
    if (!appId) {
      reject(new Error('META_APP_ID is missing'));
      return;
    }

    if (window.FB) {
      window.FB.init({
        appId,
        cookie: true,
        xfbml: false,
        version: graphVersion || 'v23.0'
      });
      resolve(window.FB);
      return;
    }

    const script = document.createElement('script');
    script.id = 'facebook-jssdk';
    script.async = true;
    script.defer = true;
    script.src = 'https://connect.facebook.net/en_US/sdk.js';
    script.onload = () => {
      if (!window.FB) {
        reject(new Error('Facebook SDK is not available'));
        return;
      }

      window.FB.init({
        appId,
        cookie: true,
        xfbml: false,
        version: graphVersion || 'v23.0'
      });
      resolve(window.FB);
    };
    script.onerror = () => reject(new Error('Failed to load Facebook SDK'));
    document.head.appendChild(script);
  });

  return sdkReadyPromise;
}

async function startEmbeddedSignup(targetAccountId = null) {
  if (!embeddedConfig.value?.enabled) {
    errorText.value = 'Embedded Signup не настроен на backend';
    return;
  }

  reconnectAccountId.value = targetAccountId;
  pendingCode.value = '';
  pendingSetupInfo.value = null;
  resetFeedback();
  loadingAction.value = true;

  try {
    const fb = await ensureFacebookSdkReady({
      appId: embeddedConfig.value.appId,
      graphVersion: embeddedConfig.value.graphVersion
    });

    fb.login(
      (response) => {
        if (!response?.authResponse?.code) {
          loadingAction.value = false;
          errorText.value =
            'Не удалось получить auth code. Проверьте Login with JavaScript SDK, Allowed Domains и Redirect URI в Meta.';
          return;
        }

        pendingCode.value = response.authResponse.code;
        maybeCompleteSignup();
      },
      {
        config_id: embeddedConfig.value.configId,
        response_type: 'code',
        override_default_response_type: true,
        extras: {
          feature: 'whatsapp_embedded_signup',
          sessionInfoVersion: 3
        }
      }
    );
  } catch (error) {
    loadingAction.value = false;
    errorText.value = error?.message || 'Не удалось запустить Embedded Signup';
  }
}

async function disconnectAccount(accountId) {
  resetFeedback();
  loadingAction.value = true;
  try {
    await whatsappService.disconnectAccount(accountId);
    successText.value = 'Номер отключён';
    await loadAccounts();
  } catch (error) {
    errorText.value = error?.response?.data?.message || 'Не удалось отключить номер';
  } finally {
    loadingAction.value = false;
  }
}

async function handleLogout() {
  await authStore.logout();
  chatStore.clearState();
  router.push('/login');
}

onMounted(async () => {
  window.addEventListener('message', handleWindowMessage);

  await Promise.all([
    (async () => {
      try {
        embeddedConfig.value = await whatsappService.getEmbeddedSignupConfig();
      } catch (error) {
        errorText.value = error?.response?.data?.message || 'Не удалось получить конфигурацию Embedded Signup';
      }
    })(),
    loadAccounts()
  ]);
});

onBeforeUnmount(() => {
  window.removeEventListener('message', handleWindowMessage);
});
</script>

<style scoped>
.settings-page {
  padding: 24px;
  overflow: auto;
  height: calc(100vh - 64px);
}

.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 16px;
}

.settings-header h1 {
  margin: 0 0 6px;
}

.settings-header p {
  margin: 0;
  color: #4b5563;
}

.primary-btn,
.secondary-btn,
.danger-btn {
  border: none;
  border-radius: 8px;
  padding: 10px 14px;
  cursor: pointer;
  font-weight: 600;
}

.primary-btn {
  background: #0a7c51;
  color: #fff;
}

.secondary-btn {
  background: #e2e8f0;
  color: #111827;
}

.danger-btn {
  background: #fee2e2;
  color: #b91c1c;
}

.primary-btn:disabled,
.secondary-btn:disabled,
.danger-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.success-text {
  color: #15803d;
  margin: 0 0 12px;
}

.error-text {
  color: #b91c1c;
  margin: 0 0 12px;
}

.table-wrap {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: auto;
}

.accounts-table {
  width: 100%;
  border-collapse: collapse;
}

.accounts-table th,
.accounts-table td {
  text-align: left;
  padding: 12px;
  border-bottom: 1px solid #f1f5f9;
  font-size: 14px;
}

.accounts-table th {
  color: #64748b;
  font-weight: 600;
}

.status-chip {
  display: inline-block;
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
}

.status-connected {
  background: #dcfce7;
  color: #166534;
}

.status-disconnected {
  background: #fee2e2;
  color: #991b1b;
}

.status-pending {
  background: #fef9c3;
  color: #854d0e;
}

.status-error {
  background: #ffe4e6;
  color: #be123c;
}

.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}

.actions {
  display: flex;
  gap: 8px;
}

@media (max-width: 860px) {
  .settings-page {
    padding: 16px;
  }

  .settings-header {
    flex-direction: column;
  }
}
</style>
