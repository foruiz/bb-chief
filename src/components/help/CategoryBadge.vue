<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { getCategoryName } from '../../domain/help/help-catalog'
import type { HelpLocale } from '../../domain/help/help-models'
import { CATEGORY_STYLE } from './category-style'

const props = defineProps<{ categoryId: string }>()

const { locale } = useI18n()

const style = computed(() => CATEGORY_STYLE[props.categoryId] ?? { letter: '?', color: '#5b6573' })

const label = computed(() => getCategoryName(props.categoryId, locale.value as HelpLocale))
</script>

<template>
  <span
    data-testid="help-category-badge"
    role="img"
    :aria-label="label"
    class="inline-flex size-7 shrink-0 items-center justify-center rounded-full font-display text-sm font-bold text-white"
    :style="{ backgroundColor: style.color }"
  >
    {{ style.letter }}
  </span>
</template>
