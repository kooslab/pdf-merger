<script lang="ts">
  import { fly, fade } from 'svelte/transition';
  import { onMount } from 'svelte';

  export let message: string = '';
  export let duration: number = 3000;
  export let type: 'success' | 'error' | 'info' = 'success';

  let visible = true;

  onMount(() => {
    const timeout = setTimeout(() => {
      visible = false;
    }, duration);

    return () => clearTimeout(timeout);
  });

  const icons = {
    success: `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>`,
    error: `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>`,
    info: `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>`
  };

  const colors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500'
  };
</script>

{#if visible}
  <div
    class="fixed bottom-4 right-4 z-50"
    in:fly={{ y: 50, duration: 300 }}
    out:fade={{ duration: 200 }}
  >
    <div class="{colors[type]} text-white px-6 py-4 rounded-lg shadow-xl flex items-center gap-3">
      <div class="flex-shrink-0">
        {@html icons[type]}
      </div>
      <p class="font-medium">{message}</p>
    </div>
  </div>
{/if}