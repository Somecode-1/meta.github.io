<template>
  <section ref="containerRef" class="message-list">
    <div v-if="loading" class="state">Загрузка сообщений...</div>
    <div v-else-if="messages.length === 0" class="state">Сообщений пока нет</div>
    <MessageItem v-else v-for="message in messages" :key="message.id" :message="message" />
  </section>
</template>

<script setup>
import { nextTick, ref, watch } from 'vue';
import MessageItem from './MessageItem.vue';

const props = defineProps({
  messages: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  }
});

const containerRef = ref(null);

watch(
  () => props.messages.length,
  async () => {
    await nextTick();
    if (containerRef.value) {
      containerRef.value.scrollTop = containerRef.value.scrollHeight;
    }
  },
  { immediate: true }
);
</script>

<style scoped>
.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 14px;
  background: linear-gradient(180deg, #f8fafc, #f1f5f9);
}

.state {
  color: #6b7280;
}
</style>
