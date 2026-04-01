<template>
  <div class="app-layout">
    <header class="app-header">
      <div class="brand">{{ appName }}</div>
      <nav class="nav-links">
        <RouterLink to="/chat" class="nav-link">Чаты</RouterLink>
        <RouterLink to="/settings/whatsapp" class="nav-link">WhatsApp settings</RouterLink>
      </nav>
      <div class="user-block">
        <span class="user-name">{{ userName }}</span>
        <button class="logout-btn" @click="$emit('logout')">Выйти</button>
      </div>
    </header>

    <main class="app-content">
      <slot />
    </main>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { RouterLink } from 'vue-router';

const props = defineProps({
  user: {
    type: Object,
    default: null
  }
});

defineEmits(['logout']);

const appName = computed(() => import.meta.env.VITE_APP_NAME || 'WhatsApp Meta Chat');
const userName = computed(() => props.user?.name || 'Пользователь');
</script>

<style scoped>
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  height: 64px;
  background: #0f172a;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 0 18px;
}

.brand {
  font-weight: 600;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 8px;
}

.nav-link {
  color: #cbd5e1;
  text-decoration: none;
  padding: 8px 10px;
  border-radius: 8px;
}

.nav-link.router-link-active {
  color: #fff;
  background: #1e293b;
}

.user-block {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: auto;
}

.user-name {
  color: #cbd5e1;
}

.logout-btn {
  border: 1px solid #334155;
  border-radius: 8px;
  background: transparent;
  color: #fff;
  padding: 8px 12px;
  cursor: pointer;
}

.app-content {
  flex: 1;
  overflow: hidden;
}
</style>
