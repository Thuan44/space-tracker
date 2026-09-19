<script setup lang="ts" generic="T">
import { computed } from 'vue'
import PrimeDataTable from 'primevue/datatable'
import Paginator, { type PageState } from 'primevue/paginator'
import { getTotalPages } from '@/shared/lib/pagination'
import QueryErrorBanner from './QueryErrorBanner.vue'
import SkeletonBlock from './SkeletonBlock.vue'
import FilterInput from './FilterInput.vue'

const props = withDefaults(
  defineProps<{
    rows: T[]
    dataKey: string
    isPending: boolean
    isFetching?: boolean
    isError: boolean
    error: unknown
    errorMessage: string
    total?: number
    limit?: number
    page?: number
    itemLabel?: string
    filterText: string
    filterPlaceholder: string
  }>(),
  { isFetching: false },
)

const emit = defineEmits<{
  'update:page': [page: number]
  'update:filterText': [filterText: string]
  retry: []
}>()

function onPage(event: PageState) {
  emit('update:page', event.page + 1)
}

const paginationCaption = computed(() => {
  if (props.total === undefined || props.limit === undefined || props.page === undefined) {
    return ''
  }
  const base = `Page ${props.page} of ${getTotalPages(props.total, props.limit)}`
  return props.itemLabel ? `${base} · ${props.total} ${props.itemLabel}` : base
})
</script>

<template>
  <div>
    <div class="mt-4 flex flex-wrap items-start gap-4">
      <FilterInput
        :model-value="filterText"
        :placeholder="filterPlaceholder"
        @update:model-value="(value: string) => emit('update:filterText', value)"
      />
      <slot name="toolbar-end" />
    </div>

    <SkeletonBlock v-if="isPending" class="mt-4" height-class="h-96" />

    <QueryErrorBanner
      v-else-if="isError"
      class="mt-4"
      :error="error"
      :fallback-message="errorMessage"
      @retry="emit('retry')"
    />

    <template v-else>
      <PrimeDataTable
        :value="rows"
        :data-key="dataKey"
        class="mt-4 transition-opacity"
        :class="{ 'opacity-60': isFetching }"
      >
        <slot />
      </PrimeDataTable>

      <Paginator
        v-if="total !== undefined && limit !== undefined && page !== undefined"
        :rows="limit!"
        :total-records="total!"
        :first="(page! - 1) * limit!"
        template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink"
        class="mt-4"
        @page="onPage"
      >
        <template #start>
          <span class="text-label font-semibold uppercase tracking-label text-muted">
            {{ paginationCaption }}
          </span>
        </template>
      </Paginator>
    </template>
  </div>
</template>
