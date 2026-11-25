<script setup lang="ts">
import { useI18n } from 'vue-i18n'

import SearchIcon from '../icons/SearchIcon.vue'

defineProps<{ modelValue: string }>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const { t } = useI18n()

function onInput(event: Event) {
  emit('update:modelValue', (event.target as HTMLInputElement).value)
}

// Vacía el campo. La vista vuelve a mostrar todo el catálogo.
function clear() {
  emit('update:modelValue', '')
}
</script>

<template>
  <div>
    <label for="help-search" class="sr-only">{{ t('help.searchLabel') }}</label>

    <div
      class="flex items-center gap-2 rounded-xl border border-bb-blue bg-bb-surface px-3 py-2 focus-within:ring-2 focus-within:ring-bb-blue/30"
    >
      <SearchIcon class="size-5 shrink-0 text-bb-muted" />

      <input
        id="help-search"
        type="text"
        autocomplete="off"
        :value="modelValue"
        :aria-label="t('help.searchLabel')"
        :placeholder="t('help.searchPlaceholder')"
        class="min-w-0 flex-1 bg-transparent text-base text-bb-text outline-none placeholder:text-bb-muted"
        @input="onInput"
      />

      <button
        v-if="modelValue !== ''"
        type="button"
        :aria-label="t('help.clearSearch')"
        :title="t('help.clearSearch')"
        class="flex size-8 shrink-0 items-center justify-center rounded-full text-bb-muted transition hover:bg-bb-background hover:text-bb-text focus-visible:outline-2 focus-visible:outline-bb-blue"
        @click="clear"
      >
        <span aria-hidden="true" class="text-lg leading-none">✕</span>
      </button>
    </div>
  </div>
</template>
