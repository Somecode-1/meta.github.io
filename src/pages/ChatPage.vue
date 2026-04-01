<template>
  <AppLayout :user="authStore.user" @logout="handleLogout">
    <div class="chat-page">
      <ConversationList
        :conversations="chatStore.conversations"
        :active-conversation-id="chatStore.activeConversationId"
        :loading="chatStore.loadingConversations"
        @select="chatStore.selectConversation"
      />

      <section class="chat-panel">
        <ChatHeader :conversation="chatStore.activeConversation" />
        <MessageList :messages="chatStore.messages" :loading="chatStore.loadingMessages" />
        <MessageInput
          :disabled="!chatStore.activeConversationId"
          :sending="chatStore.sendingMessage"
          @send="chatStore.sendMessage"
        />
      </section>
    </div>
  </AppLayout>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useChatStore } from '../stores/chat';
import AppLayout from '../components/layout/AppLayout.vue';
import ConversationList from '../components/chat/ConversationList.vue';
import ChatHeader from '../components/chat/ChatHeader.vue';
import MessageList from '../components/chat/MessageList.vue';
import MessageInput from '../components/chat/MessageInput.vue';

const router = useRouter();
const authStore = useAuthStore();
const chatStore = useChatStore();

onMounted(async () => {
  await chatStore.loadConversations();
  if (chatStore.activeConversationId) {
    await chatStore.loadMessages(chatStore.activeConversationId);
  }
  chatStore.startPolling();
});

onUnmounted(() => {
  chatStore.stopPolling();
});

async function handleLogout() {
  await authStore.logout();
  chatStore.clearState();
  router.push('/login');
}
</script>

<style scoped>
.chat-page {
  height: calc(100vh - 64px);
  display: flex;
}

.chat-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

@media (max-width: 900px) {
  .conversation-list {
    width: 44%;
  }
}

@media (max-width: 700px) {
  .chat-page {
    flex-direction: column;
    height: auto;
    min-height: calc(100vh - 64px);
  }
}
</style>
