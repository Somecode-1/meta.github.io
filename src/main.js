import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import { setupApiInterceptors } from './services/api';
import { useAuthStore } from './stores/auth';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);

const authStore = useAuthStore();
setupApiInterceptors(() => {
  authStore.clearAuth();
  if (router.currentRoute.value.path !== '/login') {
    router.push('/login');
  }
});

app.mount('#app');
