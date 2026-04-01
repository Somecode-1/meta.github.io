<template>
  <header class="chat-header">
    <div>
      <h3>{{ conversation?.contactName || 'Выберите диалог' }}</h3>
      <p v-if="conversation">{{ conversation.phoneNumber }}</p>
    </div>
  </header>
</template>

<script setup>
defineProps({
  conversation: {
    type: Object,
    default: null
  }
});
</script>

<style scoped>
.chat-header {
  height: 72px;
  border-bottom: 1px solid #e5e7eb;
  padding: 12px 16px;
  background: #fff;
  display: flex;
  align-items: center;
}

h3 {
  margin: 0 0 2px;
}

p {
  margin: 0;
  color: #6b7280;
  font-size: 13px;
}
</style>
