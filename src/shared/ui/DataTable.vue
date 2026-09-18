<script setup lang="ts" generic="T">
import PrimeDataTable from 'primevue/datatable'
import Paginator, { type PageState } from 'primevue/paginator'
import { getTotalPages } from '@/shared/lib/pagination'

defineProps<{
  rows: T[]
  dataKey: string
  isPending: boolean
  isError: boolean
  errorMessage: string
  total: number
  limit: number
  page: number
  filterText: string
  filterPlaceholder: string
}>()

const emit = defineEmits<{
  'update:page': [page: number]
  'update:filterText': [filterText: string]
  retry: []
}>()

function onPage(event: PageState) {
  emit('update:page', event.page + 1)
}
</script>

<template>
  <div>
    <div class="mt-4 flex flex-wrap items-start gap-4">
      <input :value="filterText"
        @input="emit('update:filterText', ($event.target as HTMLInputElement).value)" type="text"
        :placeholder="filterPlaceholder" :aria-label="filterPlaceholder"
        class="block w-full max-w-sm rounded-sm border border-line bg-surface-0 px-3 py-2 text-[13px] text-fg placeholder-muted focus:border-accent focus:outline-none" />
      <slot name="toolbar-end" />
    </div>

    <div v-if="isPending" class="mt-4 h-96 animate-pulse rounded-md border border-line bg-surface-1" />

    <div v-else-if="isError"
      class="mt-4 flex h-16 items-center justify-between rounded-md border border-danger/30 bg-danger/10 px-5">
      <p class="text-[13px] text-danger">{{ errorMessage }}</p>
      <button type="button"
        class="h-8 cursor-pointer rounded-sm border border-line px-3 text-[13px] text-fg hover:bg-surface-2"
        @click="emit('retry')">
        Retry
      </button>
    </div>

    <template v-else>
      <PrimeDataTable :value="rows" :data-key="dataKey" class="mt-4">
        <slot />
      </PrimeDataTable>

      <Paginator :rows="limit" :total-records="total" :first="(page - 1) * limit"
        template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink" class="mt-4" @page="onPage">
        <template #start>
          <span class="text-[11px] font-semibold uppercase tracking-[0.09em] text-muted">
            Page {{ page }} of {{ getTotalPages(total, limit) }}
          </span>
        </template>
      </Paginator>
    </template>
  </div>
</template>
