<template>
  <form class="message-input" @submit.prevent="submit">
    <input
      v-model="value"
      type="text"
      placeholder="Введите сообщение..."
      :disabled="disabled || sending"
    />
    <button type="submit" :disabled="disabled || sending || !value.trim()">
      {{ sending ? 'Отправка...' : 'Отправить' }}
    </button>
  </form>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
  disabled: {
    type: Boolean,
    default: false
  },
  sending: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['send']);
const value = ref('');

function submit() {
  const text = value.value.trim();
  if (!text || props.disabled || props.sending) {
    return;
  }

  emit('send', text);
  value.value = '';
}
</script>

<style scoped>
.message-input {
  height: 74px;
  border-top: 1px solid #e5e7eb;
  background: #fff;
  display: flex;
  gap: 10px;
  padding: 14px;
}

input {
  flex: 1;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  padding: 0 12px;
  outline: none;
}

button {
  border: none;
  border-radius: 10px;
  padding: 0 18px;
  background: #0ea5e9;
  color: #fff;
  cursor: pointer;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
