<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import HelpResultList from '../components/help/HelpResultList.vue'
import HelpSearchField from '../components/help/HelpSearchField.vue'
import { HELP_CATEGORIES, HELP_ENTRIES } from '../domain/help/help-catalog'
import type { HelpLocale, HelpMatch } from '../domain/help/help-models'
import {
  groupMatchesByCategory,
  listAllEntries,
  searchHelpEntries,
} from '../domain/help/help-search'

const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()

// La búsqueda se dispara al escribir. Sin texto, se muestra todo el catálogo.
const query = ref('')
const expandedId = ref<string | null>(null)

const currentLocale = computed(() => locale.value as HelpLocale)

const result = computed(() => searchHelpEntries(HELP_ENTRIES, query.value, currentLocale.value))

const visibleMatches = computed<HelpMatch[]>(() => {
  if (result.value.status === 'idle') return listAllEntries(HELP_ENTRIES)
  if (result.value.status === 'results') return result.value.matches

  return []
})

const groups = computed(() => groupMatchesByCategory(visibleMatches.value, HELP_CATEGORIES))

const message = computed(() => {
  if (result.value.status === 'too-short') return t('help.tooShort')
  if (result.value.status === 'no-results') return t('help.noResults')

  return ''
})

// Volver regresa al origen. Sin origen válido, vuelve al menú.
const backRoute = computed(() => (route.query.from === 'match' ? '/match' : '/menu'))

function toggle(id: string) {
  expandedId.value = expandedId.value === id ? null : id
}

async function goBack() {
  await router.push(backRoute.value)
}
</script>

<template>
  <main class="mx-auto flex h-full w-full max-w-2xl flex-col gap-4 px-4 py-4 sm:px-6">
    <h2 class="font-display text-2xl font-bold text-bb-text sm:text-3xl">
      {{ t('help.title') }}
    </h2>

    <HelpSearchField v-model="query" />

    <p
      v-if="message"
      data-testid="help-message"
      role="status"
      class="rounded-lg border border-bb-border bg-bb-surface p-3 text-sm text-bb-muted"
    >
      {{ message }}
    </p>

    <div class="min-h-0 flex-1 overflow-y-auto">
      <HelpResultList
        v-if="groups.length > 0"
        :groups="groups"
        :query="query"
        :expanded-id="expandedId"
        @select="toggle"
      />
    </div>

    <footer class="border-t border-bb-border pt-3">
      <button
        data-testid="help-back"
        type="button"
        class="min-h-12 w-full rounded-xl bg-amber-400 px-4 py-3 font-display text-xl font-bold uppercase tracking-wide text-amber-950 transition hover:bg-amber-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bb-amber-400"
        @click="goBack"
      >
        {{ t('help.back') }}
      </button>
    </footer>
  </main>
</template>
