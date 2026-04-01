<template>
  <div class="callback-page">
    <div class="callback-card">
      <h2>Авторизация...</h2>
      <p>Проверяем сессию и загружаем ваш профиль.</p>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const authStore = useAuthStore();

onMounted(async () => {
  try {
    await authStore.refreshUser();
    router.replace('/chat');
  } catch (error) {
    router.replace('/login');
  }
});
</script>

<style scoped>
.callback-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 20px;
}

.callback-card {
  width: 100%;
  max-width: 420px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 35px rgba(15, 23, 42, 0.1);
  padding: 26px;
  text-align: center;
}

h2 {
  margin: 0 0 8px;
}

p {
  margin: 0;
  color: #4b5563;
}
</style>
