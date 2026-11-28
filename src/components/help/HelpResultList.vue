<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { getCategoryName } from '../../domain/help/help-catalog'
import type { HelpCategoryGroup, HelpLocale } from '../../domain/help/help-models'
import HelpEntryCard from './HelpEntryCard.vue'
import HelpEntryDetail from './HelpEntryDetail.vue'

defineProps<{
  groups: HelpCategoryGroup[]
  query: string
  expandedId: string | null
}>()

const emit = defineEmits<{ select: [id: string] }>()

const { locale } = useI18n()

function groupTitle(categoryId: string): string {
  return getCategoryName(categoryId, locale.value as HelpLocale)
}
</script>

<template>
  <div data-testid="help-results" class="space-y-2">
    <section v-for="group in groups" :key="group.categoryId" class="space-y-2">
      <h3
        data-testid="help-group-title"
        class="pt-2 font-display text-lg font-bold uppercase tracking-wide text-bb-muted"
      >
        {{ groupTitle(group.categoryId) }}
      </h3>

      <template v-for="match in group.matches" :key="match.entry.id">
        <HelpEntryCard :entry="match.entry" :query="query" @select="emit('select', $event)" />

        <div v-if="expandedId === match.entry.id" data-testid="help-detail" class="ml-2">
          <HelpEntryDetail :entry="match.entry" />
        </div>
      </template>
    </section>
  </div>
</template>
