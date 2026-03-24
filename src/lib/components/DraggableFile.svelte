<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let id: string;
  export let fileName: string;
  export let pages: string;
  export let pageCount: number = 0;
  export let pagePreviews: Array<{ pageNumber: number; aspectRatio: number; canvas?: HTMLCanvasElement }> = [];
  export let isLoadingPreviews: boolean = false;
  export let error: string | undefined = undefined;
  export let isEncrypted: boolean | undefined = undefined;
  export let onRemove: (id: string) => void;
  export let onPagesChange: (id: string, pages: string) => void;

  const dispatch = createEventDispatcher();

  let draggedElement: HTMLElement | null = null;

  function handleDragStart(e: DragEvent) {
    if (!e.target) return;
    draggedElement = e.target as HTMLElement;
    draggedElement.classList.add('dragging');
    e.dataTransfer!.effectAllowed = 'move';
    e.dataTransfer!.setData('text/plain', id);
  }

  function handleDragEnd(e: DragEvent) {
    if (!e.target) return;
    (e.target as HTMLElement).classList.remove('dragging');
    document.querySelectorAll('.drag-over, .drag-over-bottom').forEach((el) => {
      el.classList.remove('drag-over', 'drag-over-bottom');
    });
  }

  function handleDragOver(e: DragEvent) {
    if (!e.target) return;
    e.preventDefault();
    const element = e.target as HTMLElement;
    if (draggedElement !== element) {
      const rect = element.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;

      element.classList.remove('drag-over', 'drag-over-bottom');
      if (e.clientY < midY) {
        element.classList.add('drag-over');
      } else {
        element.classList.add('drag-over-bottom');
      }
    }
  }

  function handleDragLeave(e: DragEvent) {
    if (!e.target) return;
    (e.target as HTMLElement).classList.remove('drag-over', 'drag-over-bottom');
  }

  function handleDrop(e: DragEvent) {
    if (!e.target) return;
    e.preventDefault();
    const element = e.target as HTMLElement;
    element.classList.remove('drag-over', 'drag-over-bottom');

    const draggedId = e.dataTransfer!.getData('text/plain');
    const rect = element.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;

    dispatch('reorder', {
      fromId: draggedId,
      toId: id,
      position: e.clientY < midY ? 'before' : 'after'
    });
  }
</script>

<div
  class="group bg-white p-4 rounded-lg border border-gray-200 hover:border-indigo-200 hover:shadow-md transition-all duration-200"
  draggable="true"
  data-id={id}
  on:dragstart={handleDragStart}
  on:dragend={handleDragEnd}
  on:dragover={handleDragOver}
  on:dragleave={handleDragLeave}
  on:drop={handleDrop}
>
  <div class="flex items-center gap-3">
    <div class="text-gray-400 hover:text-indigo-600 cursor-move transition-colors duration-200">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16" />
      </svg>
    </div>
    <div class="flex-grow">
      <div class="flex justify-between items-center mb-2">
        <div class="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <div class="font-medium text-gray-800">{fileName}</div>
          {#if pageCount > 0}
            <span class="text-sm text-gray-500">({pageCount} pages)</span>
          {/if}
          {#if isEncrypted}
            <span class="inline-flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Encrypted
            </span>
          {/if}
        </div>
        <button
          class="text-gray-400 hover:text-red-500 transition-colors duration-200"
          on:click={() => onRemove(id)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>
      <div class="flex items-center">
        <label class="mr-2 text-sm text-gray-600">Pages:</label>
        <input
          type="text"
          class="page-input border border-gray-300 rounded px-2 py-1 text-sm w-32 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-colors duration-200"
          placeholder="all, 1-3, 1,3,5"
          value={pages}
          on:input={(e) => onPagesChange(id, e.currentTarget.value)}
        />
      </div>
      {#if isEncrypted}
        <div class="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
          <strong>Note:</strong> This PDF is encrypted. Pages will be converted to images when merged (text won't be selectable).
        </div>
      {/if}
    </div>
  </div>

  <!-- Page Previews -->
  {#if error}
    <div class="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
      <div class="flex items-center gap-2 text-red-600">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <span class="text-sm font-medium">Preview unavailable</span>
      </div>
      <p class="text-xs text-red-500 mt-1 ml-7">This PDF may be encrypted or in an unsupported format. It can still be merged.</p>
    </div>
  {:else if isLoadingPreviews}
    <div class="mt-4 flex items-center justify-center py-4">
      <div class="inline-flex items-center gap-2">
        <svg class="animate-spin h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span class="text-sm text-indigo-600">Loading previews...</span>
      </div>
    </div>
  {:else if pagePreviews.length > 0}
    <div class="mt-4 border-t border-gray-100 pt-4">
      <div class="overflow-x-auto">
        <div class="flex gap-2 pb-2" style="width: max-content;">
          {#each pagePreviews as preview}
            <div
              class="relative bg-white border border-gray-200 rounded shadow-sm overflow-hidden flex-shrink-0"
              style="width: {preview.aspectRatio > 1 ? '120px' : '90px'}; height: {preview.aspectRatio > 1 ? 120 / preview.aspectRatio + 'px' : '120px'};"
            >
              {#if preview.canvas}
                <img
                  src={preview.canvas.toDataURL()}
                  alt="Page {preview.pageNumber}"
                  class="w-full h-full object-contain"
                />
              {:else}
                <div class="w-full h-full bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center">
                  <span class="text-xs text-gray-400">Page {preview.pageNumber}</span>
                </div>
              {/if}
              <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-1 py-0.5">
                <div class="text-white text-xs text-center font-medium">
                  {preview.pageNumber}
                </div>
              </div>
            </div>
          {/each}
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .overflow-x-auto {
    scrollbar-width: thin;
    scrollbar-color: #d1d5db #f3f4f6;
  }

  .overflow-x-auto::-webkit-scrollbar {
    height: 6px;
  }

  .overflow-x-auto::-webkit-scrollbar-track {
    background: #f3f4f6;
    border-radius: 3px;
  }

  .overflow-x-auto::-webkit-scrollbar-thumb {
    background: #d1d5db;
    border-radius: 3px;
  }

  .overflow-x-auto::-webkit-scrollbar-thumb:hover {
    background: #9ca3af;
  }
</style>