<script setup lang="ts">
import { computed } from 'vue'
import { highlightSegments } from '../../domain/help/help-search'

const props = defineProps<{ text: string; query: string }>()

const segments = computed(() => highlightSegments(props.text, props.query))
</script>

<template>
  <span>
    <template v-for="(segment, index) in segments" :key="index">
      <mark v-if="segment.highlighted" class="rounded-sm bg-amber-200 px-0.5 text-bb-text">{{
        segment.text
      }}</mark>
      <template v-else>{{ segment.text }}</template>
    </template>
  </span>
</template>
