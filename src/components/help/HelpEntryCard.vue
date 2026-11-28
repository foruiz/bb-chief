<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { HelpEntry, HelpLocale } from '../../domain/help/help-models'
import CategoryBadge from './CategoryBadge.vue'
import HighlightedText from './HighlightedText.vue'

const props = defineProps<{ entry: HelpEntry; query: string }>()

const emit = defineEmits<{ select: [id: string] }>()

const { locale } = useI18n()

const currentLocale = computed(() => locale.value as HelpLocale)

const name = computed(() => props.entry.name[currentLocale.value])

const description = computed(() => props.entry.description[currentLocale.value])

// En español se muestra el término inglés entre corchetes, salvo que sea igual al español.
const englishTerm = computed(() =>
  currentLocale.value === 'es' && props.entry.name.en !== props.entry.name.es
    ? props.entry.name.en
    : null,
)
</script>

<template>
  <button
    type="button"
    class="flex w-full gap-3 rounded-xl border border-bb-border bg-bb-surface p-3 text-left shadow-sm transition hover:border-bb-blue focus-visible:outline-2 focus-visible:outline-bb-blue"
    @click="emit('select', entry.id)"
  >
    <CategoryBadge :category-id="entry.category" />

    <span class="min-w-0">
      <span class="block text-sm font-semibold text-bb-text">
        <HighlightedText :text="name" :query="query" />
        <em v-if="englishTerm" class="ml-1 font-medium text-bb-muted">[{{ englishTerm }}]</em>
      </span>

      <span class="mt-1 block text-sm leading-relaxed text-bb-muted">
        <HighlightedText :text="description" :query="query" />
      </span>
    </span>
  </button>
</template>
