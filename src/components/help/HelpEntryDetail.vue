<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { getCategoryName } from '../../domain/help/help-catalog'
import type { HelpEntry, HelpLocale } from '../../domain/help/help-models'
import CategoryBadge from './CategoryBadge.vue'

const props = defineProps<{ entry: HelpEntry }>()

const { locale } = useI18n()

const currentLocale = computed(() => locale.value as HelpLocale)

const name = computed(() => props.entry.name[currentLocale.value])

const description = computed(() => props.entry.description[currentLocale.value])

const categoryName = computed(() => getCategoryName(props.entry.category, currentLocale.value))

const englishTerm = computed(() =>
  currentLocale.value === 'es' && props.entry.name.en !== props.entry.name.es
    ? props.entry.name.en
    : null,
)
</script>

<template>
  <article class="rounded-xl border border-bb-blue/30 bg-bb-blue-soft/40 p-4">
    <div class="flex items-start justify-between gap-3">
      <h4 data-section="name" class="min-w-0 font-display text-xl font-bold text-bb-text">
        {{ name }}
        <em v-if="englishTerm" class="ml-1 text-sm font-medium text-bb-muted"
          >[{{ englishTerm }}]</em
        >
      </h4>

      <div
        data-section="category"
        class="flex shrink-0 items-center gap-2 text-sm font-semibold text-bb-muted"
      >
        <span>{{ categoryName }}</span>
        <CategoryBadge :category-id="entry.category" />
      </div>
    </div>

    <p data-section="description" class="mt-3 text-sm leading-relaxed text-bb-text">
      {{ description }}
    </p>
  </article>
</template>
