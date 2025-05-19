<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let id: string;
  export let fileName: string;
  export let pages: string;
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
  class="group bg-white p-4 rounded-lg border border-gray-200 flex items-center gap-3 hover:border-indigo-200 hover:shadow-md transition-all duration-200"
  draggable="true"
  data-id={id}
  on:dragstart={handleDragStart}
  on:dragend={handleDragEnd}
  on:dragover={handleDragOver}
  on:dragleave={handleDragLeave}
  on:drop={handleDrop}
>
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
  </div>
</div> 