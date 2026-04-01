<template>
  <div class="login-page">
    <div class="login-card">
      <h1>{{ appName }}</h1>
      <p>Подключите WhatsApp Business через Meta Embedded Signup.</p>
      <button class="login-btn" :disabled="loading" @click="handleEmbeddedSignup">
        {{ loading ? 'Подключение...' : 'Подключить WhatsApp Business' }}
      </button>
      <p v-if="errorText" class="error-text">{{ errorText }}</p>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const authStore = useAuthStore();
const router = useRouter();
const appName = computed(() => import.meta.env.VITE_APP_NAME || 'WhatsApp Meta Chat');
const loading = ref(false);
const errorText = ref('');
const embeddedConfig = ref(null);
const pendingCode = ref('');
const pendingSetupInfo = ref(null);

let sdkReadyPromise = null;

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

function maybeCompleteSignup() {
  if (!pendingCode.value || !pendingSetupInfo.value) {
    return;
  }

  const code = pendingCode.value;
  const setupInfo = pendingSetupInfo.value;
  pendingCode.value = '';
  pendingSetupInfo.value = null;
  loading.value = true;
  errorText.value = '';

  authStore
    .completeEmbeddedSignup({
      code,
      setupInfo
    })
    .then(() => {
      router.push('/chat');
    })
    .catch((error) => {
      errorText.value = error?.response?.data?.message || 'Не удалось завершить Embedded Signup';
    })
    .finally(() => {
      loading.value = false;
    });
}

function handleWindowMessage(event) {
  const isFacebookOrigin = /^https:\/\/([a-z0-9-]+\.)*facebook\.com$/i.test(event.origin || '');
  if (!isFacebookOrigin) {
    return;
  }

  try {
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
      errorText.value = 'Подключение отменено пользователем';
    }
  } catch (error) {
    // Ignore unrelated messages from Meta SDK/iframe.
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

    const scriptId = 'facebook-jssdk';
    const existing = document.getElementById(scriptId);
    if (existing) {
      existing.addEventListener('load', () => {
        window.FB?.init({
          appId,
          cookie: true,
          xfbml: false,
          version: graphVersion || 'v23.0'
        });
        resolve(window.FB);
      });
      existing.addEventListener('error', () => reject(new Error('Failed to load Facebook SDK')));
      return;
    }

    const script = document.createElement('script');
    script.id = scriptId;
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

async function handleEmbeddedSignup() {
  if (!embeddedConfig.value?.enabled) {
    errorText.value = 'Embedded Signup не настроен на backend';
    return;
  }

  pendingCode.value = '';
  pendingSetupInfo.value = null;
  errorText.value = '';
  loading.value = true;

  try {
    const fb = await ensureFacebookSdkReady({
      appId: embeddedConfig.value.appId,
      graphVersion: embeddedConfig.value.graphVersion
    });

    fb.login(
      (response) => {
        if (!response?.authResponse?.code) {
          loading.value = false;
          errorText.value =
            'Не удалось получить auth code. Проверьте в Meta App: Login with JavaScript SDK = ON, Allowed Domains, Valid OAuth Redirect URIs.';
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
    errorText.value = error?.message || 'Не удалось запустить Embedded Signup';
    loading.value = false;
  }
}

onMounted(async () => {
  window.addEventListener('message', handleWindowMessage);
  try {
    embeddedConfig.value = await authStore.getEmbeddedSignupConfig();
    if (!embeddedConfig.value?.enabled) {
      errorText.value = 'Заполните META_APP_ID, META_APP_SECRET и META_CONFIGURATION_ID в backend/.env';
    }
  } catch (error) {
    errorText.value = error?.response?.data?.message || 'Не удалось загрузить конфигурацию Embedded Signup';
  }
});

onBeforeUnmount(() => {
  window.removeEventListener('message', handleWindowMessage);
});
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 20px;
  background: linear-gradient(120deg, #eff6ff, #f3f4f6);
}

.login-card {
  width: 100%;
  max-width: 460px;
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 10px 35px rgba(15, 23, 42, 0.12);
  padding: 32px;
}

h1 {
  margin: 0 0 10px;
}

p {
  margin: 0 0 22px;
  color: #4b5563;
  line-height: 1.5;
}

.login-btn {
  width: 100%;
  border: none;
  border-radius: 10px;
  padding: 12px 16px;
  background: #0a7c51;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
}

.login-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-text {
  margin: 14px 0 0;
  color: #b91c1c;
  font-size: 14px;
}
</style>
