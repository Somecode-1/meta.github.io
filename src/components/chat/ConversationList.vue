<template>
  <aside class="conversation-list">
    <div class="title-row">
      <h3>Диалоги</h3>
    </div>

    <div v-if="loading" class="state">Загрузка...</div>
    <div v-else-if="conversations.length === 0" class="state">Пока нет диалогов</div>
    <div v-else class="items">
      <ConversationItem
        v-for="conversation in conversations"
        :key="conversation.id"
        :conversation="conversation"
        :active="conversation.id === activeConversationId"
        @select="$emit('select', $event)"
      />
    </div>
  </aside>
</template>

<script setup>
import ConversationItem from './ConversationItem.vue';

defineProps({
  conversations: {
    type: Array,
    default: () => []
  },
  activeConversationId: {
    type: Number,
    default: null
  },
  loading: {
    type: Boolean,
    default: false
  }
});

defineEmits(['select']);
</script>

<style scoped>
.conversation-list {
  width: 340px;
  border-right: 1px solid #e5e7eb;
  background: #fff;
  display: flex;
  flex-direction: column;
}

.title-row {
  padding: 14px 12px;
  border-bottom: 1px solid #e5e7eb;
}

h3 {
  margin: 0;
  font-size: 16px;
}

.items {
  overflow-y: auto;
}

.state {
  color: #6b7280;
  padding: 16px 12px;
}
</style>
