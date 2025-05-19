<script lang="ts">
  import { PDFDocument } from 'pdf-lib';
  import DraggableFile from '$lib/components/DraggableFile.svelte';
  import { fade, fly } from 'svelte/transition';

  let statusEl: HTMLElement;
  let mergeBtn: HTMLButtonElement;
  let isDragging = false;
  
  // Store selected files
  let selectedFiles: Array<{
    id: string;
    file: File;
    pages: string;
  }> = [];

  function addFileToList(file: File) {
    const fileId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    selectedFiles = [...selectedFiles, {
      id: fileId,
      file: file,
      pages: "all",
    }];
  }

  function removeFile(id: string) {
    selectedFiles = selectedFiles.filter(f => f.id !== id);
  }

  function updatePages(id: string, pages: string) {
    selectedFiles = selectedFiles.map(f => 
      f.id === id ? { ...f, pages } : f
    );
  }

  function handleReorder(event: CustomEvent) {
    const { fromId, toId, position } = event.detail;
    const fromIndex = selectedFiles.findIndex(f => f.id === fromId);
    const toIndex = selectedFiles.findIndex(f => f.id === toId);
    
    if (fromIndex === -1 || toIndex === -1) return;
    
    const [movedFile] = selectedFiles.splice(fromIndex, 1);
    const newIndex = position === 'before' ? toIndex : toIndex + 1;
    selectedFiles.splice(newIndex, 0, movedFile);
    selectedFiles = [...selectedFiles]; // Trigger reactivity
  }

  async function handleMerge() {
    if (selectedFiles.length === 0) {
      statusEl.textContent = "Please add at least one PDF file.";
      return;
    }

    try {
      statusEl.textContent = "Merging PDFs...";
      mergeBtn.disabled = true;

      const mergedPdf = await PDFDocument.create();

      for (const fileData of selectedFiles) {
        const arrayBuffer = await fileData.file.arrayBuffer();
        const srcPdf = await PDFDocument.load(arrayBuffer);
        const totalPages = srcPdf.getPageCount();
        let pageIndices: number[] = [];
        const pages = fileData.pages.trim();

        if (pages === "" || pages.toLowerCase() === "all") {
          pageIndices = Array.from({ length: totalPages }, (_, i) => i);
        } else {
          pages.split(",").forEach((part) => {
            if (part.includes("-")) {
              const [start, end] = part
                .split("-")
                .map((n) => parseInt(n.trim(), 10) - 1);
              for (let i = start; i <= end; i++) pageIndices.push(i);
            } else {
              const idx = parseInt(part.trim(), 10) - 1;
              if (!isNaN(idx)) pageIndices.push(idx);
            }
          });
          pageIndices = pageIndices.filter((i) => i >= 0 && i < totalPages);
        }

        const copiedPages = await mergedPdf.copyPages(srcPdf, pageIndices);
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }

      const mergedPdfBytes = await mergedPdf.save();
      const blob = new Blob([mergedPdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "merged.pdf";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      statusEl.textContent = "PDFs merged successfully!";
    } catch (error: unknown) {
      console.error("Error merging PDFs:", error);
      statusEl.textContent = `Error: ${error instanceof Error ? error.message : String(error)}`;
    } finally {
      mergeBtn.disabled = false;
    }
  }

  function handleFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      Array.from(input.files).forEach(file => addFileToList(file));
    }
  }
</script>

<svelte:head>
  <title>PDF Merger - Merge PDF Files Online Free</title>
  <meta
    name="description"
    content="Merge multiple PDF files into one, for free. No signup. Fast, secure, and easy to use."
  />
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex flex-col">
  <header class="py-12 bg-white shadow-lg">
    <div class="container mx-auto px-4 flex flex-col items-center">
      <div class="flex items-center gap-3 mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h1 class="text-5xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">PDF Merger</h1>
      </div>
      <p class="text-xl text-gray-600 mb-4 text-center max-w-2xl">
        Merge multiple PDF files into one. Free, fast, and secure.
      </p>
      <div class="flex gap-3">
        <span class="inline-flex items-center gap-1 bg-green-100 text-green-700 text-sm px-3 py-1 rounded-full font-semibold">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          No signup required
        </span>
        <span class="inline-flex items-center gap-1 bg-blue-100 text-blue-700 text-sm px-3 py-1 rounded-full font-semibold">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Secure & Private
        </span>
      </div>
    </div>
  </header>

  <main class="flex-1 flex flex-col items-center justify-center py-12">
    <div class="w-full max-w-2xl mx-auto px-4">
      <div class="bg-white rounded-2xl shadow-xl p-8 transform transition-all duration-300 hover:shadow-2xl">
        <div class="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <div class="flex items-start gap-3">
            <div class="flex-shrink-0 mt-1">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h3 class="text-lg font-semibold text-blue-900 mb-1">100% Private & Secure</h3>
              <p class="text-blue-700">
                All processing is done in your browser. Your files never leave your device. No uploads, no server storage, complete privacy.
              </p>
            </div>
          </div>
        </div>
        <div class="mb-8 space-y-3">
          {#each selectedFiles as file (file.id)}
            <div in:fly={{ y: 20, duration: 300 }} out:fade={{ duration: 200 }}>
              <DraggableFile
                id={file.id}
                fileName={file.file.name}
                pages={file.pages}
                onRemove={removeFile}
                onPagesChange={updatePages}
                on:reorder={handleReorder}
              />
            </div>
          {/each}
        </div>

        <div class="flex flex-col items-center gap-6">
          <label class="group relative">
            <div class="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg blur opacity-25 group-hover:opacity-75 transition duration-200"></div>
            <div class="relative bg-white px-6 py-3 rounded-lg flex items-center gap-2 cursor-pointer hover:bg-gray-50 transition-colors duration-200">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              <span class="font-semibold text-gray-700">Add PDF File</span>
              <input
                type="file"
                accept=".pdf"
                multiple
                class="hidden"
                on:change={handleFileSelect}
              />
            </div>
          </label>

          <button
            bind:this={mergeBtn}
            class="group relative"
            on:click={handleMerge}
          >
            <div class="absolute -inset-0.5 bg-gradient-to-r from-green-400 to-blue-500 rounded-lg blur opacity-25 group-hover:opacity-75 transition duration-200"></div>
            <div class="relative bg-gradient-to-r from-green-400 to-blue-500 text-white font-bold py-4 px-8 rounded-lg text-lg flex items-center gap-2 hover:from-green-500 hover:to-blue-600 transition-all duration-200">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Merge PDFs
            </div>
          </button>
        </div>
      </div>
      <div bind:this={statusEl} class="text-center text-gray-600 mt-4 min-h-[24px]"></div>
    </div>

    <section class="w-full max-w-2xl mx-auto mt-12 px-4">
      <div class="bg-white rounded-xl shadow-lg p-8 transform transition-all duration-300 hover:shadow-xl">
        <h2 class="text-2xl font-bold text-indigo-700 mb-4 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          How does it work?
        </h2>
        <ol class="list-decimal list-inside text-gray-700 space-y-3 mb-4">
          <li class="flex items-start gap-2">
            <span class="inline-flex items-center justify-center w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full text-sm font-semibold">1</span>
            <span>Click <b>Add PDF File</b> and select one or more PDF files.</span>
          </li>
          <li class="flex items-start gap-2">
            <span class="inline-flex items-center justify-center w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full text-sm font-semibold">2</span>
            <span>Drag to reorder, or set page ranges for each file if needed.</span>
          </li>
          <li class="flex items-start gap-2">
            <span class="inline-flex items-center justify-center w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full text-sm font-semibold">3</span>
            <span>Click <b>Merge PDFs</b> and download your combined PDF instantly.</span>
          </li>
        </ol>
        <p class="text-sm text-gray-500 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <span class="font-medium">Your privacy is our priority:</span> All processing happens locally in your browser. Your files never leave your device.
        </p>
      </div>
    </section>
  </main>

  <footer class="bg-white border-t py-6 mt-auto">
    <div class="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between">
      <span class="text-gray-500 text-sm">
        &copy; {new Date().getFullYear()} Kooslab. All rights reserved.
      </span>
      <div class="flex gap-4 mt-4 md:mt-0">
        <a href="#" class="text-indigo-500 hover:text-indigo-600 text-sm transition-colors duration-200">Contact</a>
        <a href="#" class="text-indigo-500 hover:text-indigo-600 text-sm transition-colors duration-200">Privacy</a>
        <a href="#" class="text-indigo-500 hover:text-indigo-600 text-sm transition-colors duration-200">Terms</a>
      </div>
    </div>
  </footer>
</div>

<style>
  :global(.dragging) {
    opacity: 0.5;
    background-color: #f3f4f6;
  }
  :global(.drag-over) {
    border-top: 2px solid #3b82f6;
  }
  :global(.drag-over-bottom) {
    border-bottom: 2px solid #3b82f6;
  }
</style>
