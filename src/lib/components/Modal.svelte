<script lang="ts">
  import { fade, fly } from 'svelte/transition';
  import { createEventDispatcher, onDestroy } from 'svelte';

  export let isOpen = false;
  export let title = '';

  const dispatch = createEventDispatcher();
  let originalBodyOverflow: string | null = null;

  $: if (typeof window !== 'undefined') {
    if (isOpen) {
      // Save current body overflow style
      originalBodyOverflow = document.body.style.overflow;
      // Prevent body scrolling
      document.body.style.overflow = 'hidden';
    } else if (originalBodyOverflow !== null) {
      // Restore original body overflow style
      document.body.style.overflow = originalBodyOverflow;
      originalBodyOverflow = null;
    }
  }

  // Clean up on component destroy
  onDestroy(() => {
    if (typeof window !== 'undefined' && originalBodyOverflow !== null) {
      document.body.style.overflow = originalBodyOverflow;
    }
  });

  function closeModal() {
    isOpen = false;
    dispatch('close');
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      closeModal();
    }
  }
</script>

{#if isOpen}
  <div
    class="fixed inset-0 z-50 overflow-y-auto"
    on:keydown={handleKeydown}
  >
    <!-- Backdrop -->
    <div
      class="fixed inset-0 bg-black bg-opacity-50"
      transition:fade={{ duration: 200 }}
      on:click={closeModal}
    />

    <!-- Modal -->
    <div class="flex min-h-full items-center justify-center p-4">
      <div
        class="relative bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden"
        transition:fly={{ y: 50, duration: 300 }}
      >
        <!-- Header -->
        <div class="flex items-center justify-between p-6 border-b">
          <h2 class="text-2xl font-bold text-gray-900">{title}</h2>
          <button
            on:click={closeModal}
            class="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close modal"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Content -->
        <div class="p-6 overflow-y-auto max-h-[calc(90vh-8rem)]">
          <slot />
        </div>
      </div>
    </div>
  </div>
{/if}