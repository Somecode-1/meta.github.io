import { defineStore } from 'pinia';
import authService from '../services/authService';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    initialized: false,
    loading: false
  }),
  getters: {
    isAuthenticated: (state) => Boolean(state.user)
  },
  actions: {
    async initAuth() {
      if (this.initialized) {
        return;
      }

      this.loading = true;
      try {
        const response = await authService.getMe();
        this.user = response.user;
      } catch (error) {
        this.user = null;
      } finally {
        this.loading = false;
        this.initialized = true;
      }
    },
    async refreshUser() {
      const response = await authService.getMe();
      this.user = response.user;
      this.initialized = true;
    },
    loginWithFacebook() {
      window.location.href = authService.getFacebookLoginUrl();
    },
    async getEmbeddedSignupConfig() {
      return authService.getEmbeddedSignupConfig();
    },
    async completeEmbeddedSignup(payload) {
      const response = await authService.completeEmbeddedSignup(payload);
      this.user = response.user;
      this.initialized = true;
      return response;
    },
    async logout() {
      try {
        await authService.logout();
      } finally {
        this.clearAuth();
      }
    },
    clearAuth() {
      this.user = null;
      this.initialized = true;
    }
  }
});
