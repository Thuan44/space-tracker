import type { PrimeVueConfiguration } from 'primevue/config'
import type { PaginatorContext } from 'primevue/paginator'
import type { ProgressBarProps } from 'primevue/progressbar'
import type { ToastMessageOptions } from 'primevue/toast'

const PAGINATOR_NAV_BUTTON =
  'size-8 cursor-pointer rounded-sm border border-line grid place-items-center hover:bg-surface-2 disabled:cursor-not-allowed disabled:border-surface-2 disabled:text-muted/60'

// `license` is read at runtime by @primevue/core but missing from PrimeVueConfiguration's types.
export const primeVueOptions: PrimeVueConfiguration & { license?: string } = {
  license: import.meta.env.VITE_PRIMEUI_LICENCE_KEY || undefined,
  unstyled: true,
  pt: {
    datatable: {
      root: 'rounded-md border border-line bg-surface-1 overflow-hidden',
      table: 'w-full border-collapse',
      thead: 'bg-surface-2',
      headerRow: 'border-b border-line',
      bodyRow: 'h-12 border-b border-line last:border-0 hover:bg-surface-2 transition-colors',
    },
    column: {
      headerCell:
        'h-10 px-4 text-left text-label-lg font-semibold uppercase tracking-label text-muted',
      columnHeaderContent: 'inline-flex items-center gap-1.5',
      sortIcon: 'size-4 text-muted/40 data-[p-sorted=true]:text-accent',
      bodyCell: 'px-4 text-base text-fg',
    },
    paginator: {
      root: 'flex items-center justify-between gap-4 pt-4',
      content: 'flex items-center gap-1.5',
      current: 'text-label font-semibold uppercase tracking-label text-muted',
      pages: 'flex items-center gap-1.5',
      page: ({ context }: { context: PaginatorContext }) => [
        'size-8 cursor-pointer rounded-sm border text-data',
        context.active
          ? 'bg-accent border-accent text-surface-0 font-semibold'
          : 'border-line text-muted hover:text-fg',
      ],
      first: PAGINATOR_NAV_BUTTON,
      prev: PAGINATOR_NAV_BUTTON,
      next: PAGINATOR_NAV_BUTTON,
      last: PAGINATOR_NAV_BUTTON,
    },
    progressbar: {
      root: 'h-2 w-full rounded-full bg-surface-2 overflow-hidden',
      value: ({ props }: { props: ProgressBarProps }) => {
        const pct = props.value ?? 0
        return [
          'h-full rounded-full transition-[width] duration-500',
          pct >= 50 ? 'bg-accent' : pct >= 20 ? 'bg-warn' : 'bg-danger',
        ]
      },
    },
    toast: {
      root: 'z-[1100] flex w-80 max-w-[calc(100vw-2.5rem)] flex-col gap-3',
      message: ({ props }: { props: { message: ToastMessageOptions } }) => [
        'flex items-start gap-3 rounded-md border-l-4 bg-surface-1 px-4 py-3 shadow-lg',
        'translate-x-10 transition-transform duration-300 ease-out',
        'data-[mounted]:translate-x-0',
        'data-[mounted]:data-[removed]:translate-x-100 data-[mounted]:data-[removed]:duration-450',
        props.message.severity === 'error' ? 'border-danger' : 'border-accent',
      ],
      messageContent: 'flex flex-1 items-start gap-3',
      messageIcon: ({ props }: { props: { message: ToastMessageOptions } }) => [
        'mt-0.5 size-4 shrink-0',
        props.message.severity === 'error' ? 'text-danger' : 'text-accent',
      ],
      messageText: 'min-w-0 flex-1',
      summary: 'block text-data font-semibold text-fg',
      detail: 'mt-1 block text-data text-muted',
      buttonContainer: 'shrink-0',
      closeButton:
        'grid size-6 cursor-pointer place-items-center rounded-sm text-muted hover:bg-surface-2 hover:text-fg',
      closeIcon: 'size-3.5',
    },
  },
}
