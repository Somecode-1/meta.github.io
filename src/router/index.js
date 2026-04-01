import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import LoginPage from '../pages/LoginPage.vue';
import AuthCallbackPage from '../pages/AuthCallbackPage.vue';
import ChatPage from '../pages/ChatPage.vue';
import WhatsAppSettingsPage from '../pages/WhatsAppSettingsPage.vue';

const routes = [
  { path: '/', redirect: '/chat' },
  { path: '/login', component: LoginPage, meta: { guestOnly: true } },
  { path: '/auth/callback', component: AuthCallbackPage, meta: { guestOnly: true } },
  { path: '/chat', component: ChatPage, meta: { requiresAuth: true } },
  { path: '/settings/whatsapp', component: WhatsAppSettingsPage, meta: { requiresAuth: true } }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach(async (to) => {
  const authStore = useAuthStore();
  if (!authStore.initialized) {
    await authStore.initAuth();
  }

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return '/login';
  }

  if (to.meta.guestOnly && authStore.isAuthenticated) {
    return '/chat';
  }

  return true;
});

export default router;
