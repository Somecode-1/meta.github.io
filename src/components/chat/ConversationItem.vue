<template>
  <button class="conversation-item" :class="{ active }" @click="$emit('select', conversation.id)">
    <div class="top-row">
      <strong class="name">{{ conversation.contactName || 'Клиент' }}</strong>
      <span class="time">{{ formattedTime }}</span>
    </div>
    <div class="middle-row">
      <span class="phone">{{ conversation.phoneNumber }}</span>
      <span v-if="conversation.unreadCount > 0" class="badge">{{ conversation.unreadCount }}</span>
    </div>
    <p class="last-message">{{ conversation.lastMessageText || 'Нет сообщений' }}</p>
  </button>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  conversation: {
    type: Object,
    required: true
  },
  active: {
    type: Boolean,
    default: false
  }
});

defineEmits(['select']);

const formattedTime = computed(() => {
  if (!props.conversation.lastMessageAt) {
    return '';
  }
  return new Date(props.conversation.lastMessageAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });
});
</script>

<style scoped>
.conversation-item {
  width: 100%;
  border: none;
  border-bottom: 1px solid #e5e7eb;
  background: #fff;
  text-align: left;
  padding: 12px;
  cursor: pointer;
}

.conversation-item.active {
  background: #eff6ff;
}

.top-row,
.middle-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.name {
  font-size: 14px;
}

.time,
.phone {
  color: #6b7280;
  font-size: 12px;
}

.badge {
  background: #0ea5e9;
  color: #fff;
  border-radius: 999px;
  min-width: 20px;
  text-align: center;
  font-size: 12px;
  padding: 2px 7px;
}

.last-message {
  margin: 8px 0 0;
  color: #4b5563;
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
