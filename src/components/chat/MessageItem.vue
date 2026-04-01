<template>
  <div class="message-row" :class="directionClass">
    <div class="bubble">
      <p>{{ message.text }}</p>
      <div class="meta">
        <span>{{ formattedTime }}</span>
        <span v-if="message.direction === 'outbound'">{{ message.status }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  message: {
    type: Object,
    required: true
  }
});

const directionClass = computed(() =>
  props.message.direction === 'outbound' ? 'outbound' : 'inbound'
);

const formattedTime = computed(() => {
  if (!props.message.sentAt) {
    return '';
  }
  return new Date(props.message.sentAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });
});
</script>

<style scoped>
.message-row {
  display: flex;
  margin-bottom: 10px;
}

.message-row.inbound {
  justify-content: flex-start;
}

.message-row.outbound {
  justify-content: flex-end;
}

.bubble {
  max-width: 68%;
  border-radius: 12px;
  padding: 10px;
  background: #fff;
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.08);
}

.outbound .bubble {
  background: #dbeafe;
}

p {
  margin: 0 0 6px;
  line-height: 1.4;
  white-space: pre-wrap;
}

.meta {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  color: #6b7280;
  font-size: 11px;
}
</style>
