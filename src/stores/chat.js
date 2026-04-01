import { defineStore } from 'pinia';
import chatService from '../services/chatService';

export const useChatStore = defineStore('chat', {
  state: () => ({
    conversations: [],
    activeConversationId: null,
    messages: [],
    loadingConversations: false,
    loadingMessages: false,
    sendingMessage: false,
    pollIntervalId: null
  }),
  getters: {
    activeConversation(state) {
      return state.conversations.find((item) => item.id === state.activeConversationId) || null;
    }
  },
  actions: {
    async loadConversations() {
      this.loadingConversations = true;
      try {
        const conversations = await chatService.getConversations();
        this.conversations = conversations;

        if (!this.activeConversationId && conversations.length > 0) {
          this.activeConversationId = conversations[0].id;
        }
      } finally {
        this.loadingConversations = false;
      }
    },
    async selectConversation(conversationId) {
      this.activeConversationId = conversationId;
      await this.loadMessages(conversationId);

      const conversation = this.conversations.find((item) => item.id === conversationId);
      if (conversation) {
        conversation.unreadCount = 0;
      }
    },
    async loadMessages(conversationId = this.activeConversationId) {
      if (!conversationId) {
        this.messages = [];
        return;
      }

      this.loadingMessages = true;
      try {
        const messages = await chatService.getConversationMessages(conversationId);
        this.messages = messages;
      } finally {
        this.loadingMessages = false;
      }
    },
    async sendMessage(text) {
      const normalizedText = text.trim();
      if (!normalizedText || !this.activeConversationId) {
        return;
      }

      this.sendingMessage = true;
      try {
        const response = await chatService.sendMessage({
          conversationId: this.activeConversationId,
          text: normalizedText
        });

        this.messages.push(response.message);

        const conversation = this.conversations.find((item) => item.id === this.activeConversationId);
        if (conversation) {
          conversation.lastMessageText = response.message.text;
          conversation.lastMessageAt = response.message.sentAt;
        }
      } finally {
        this.sendingMessage = false;
      }
    },
    startPolling() {
      if (this.pollIntervalId) {
        return;
      }

      this.pollIntervalId = setInterval(async () => {
        await this.loadConversations();

        if (this.activeConversationId) {
          await this.loadMessages(this.activeConversationId);
        }
      }, 4000);
    },
    stopPolling() {
      if (!this.pollIntervalId) {
        return;
      }

      clearInterval(this.pollIntervalId);
      this.pollIntervalId = null;
    },
    clearState() {
      this.stopPolling();
      this.conversations = [];
      this.activeConversationId = null;
      this.messages = [];
    }
  }
});
