<script setup lang="ts"></script>

<template>
  <div class="flex min-h-screen items-center justify-center p-8">
    <div class="w-full max-w-sm rounded-md border border-line bg-surface-1 p-5 text-center">
      <p class="text-8xl font-bold tracking-[0.04em] text-accent">404</p>

      <h1 class="mt-2 text-2xl font-semibold uppercase tracking-[0.08em] text-fg">Lost in space</h1>

      <p class="mt-3 text-[14px] text-muted">
        These coordinates don't lead anywhere. Even long-range sensors can't
        find this waypoint.
      </p>

      <RouterLink to="/" class="mt-5 inline-block text-[13px] text-info hover:underline">
        &larr; Back to dashboard
      </RouterLink>
    </div>
  </div>
</template>
