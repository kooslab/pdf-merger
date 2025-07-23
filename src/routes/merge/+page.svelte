<script lang="ts">
  import { PDFDocument } from 'pdf-lib';
  import DraggableFile from '$lib/components/DraggableFile.svelte';
  import { fade, fly } from 'svelte/transition';
  import { trackEvent } from '$lib/stores/analytics';
  import { onMount } from 'svelte';
  import { toast } from '$lib/stores/toast';
  import Modal from '$lib/components/Modal.svelte';

  let statusEl: HTMLElement;
  let mergeBtn: HTMLButtonElement;
  let isDragging = false;
  let showTermsModal = false;
  
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

  onMount(() => {
    trackEvent('visit');
  });

  async function handleContactClick(e: Event) {
    e.preventDefault();
    const email = 'johnnykoo@kooslab.net';
    
    try {
      await navigator.clipboard.writeText(email);
      toast.success(`Email copied to clipboard: ${email}`);
    } catch (err) {
      toast.error('Failed to copy email to clipboard');
    }
  }

  function handleTermsClick(e: Event) {
    e.preventDefault();
    showTermsModal = true;
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

      // Track successful merge with total page count
      const totalPagesMerged = mergedPdf.getPageCount();
      trackEvent('merge', totalPagesMerged);

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
  <title>SecurePDF - Merge PDF Files Online Free | No Upload Required</title>
  <meta
    name="description"
    content="Merge multiple PDF files into one for free. No signup required. All processing is done in your browser - your files never leave your device. Fast, secure, and easy to use PDF merger."
  />
  <meta name="keywords" content="PDF merger, merge PDF, combine PDF, PDF combiner, free PDF merger, online PDF merger, secure PDF merger, no upload PDF merger" />
  <meta name="robots" content="index, follow" />
  <meta property="og:title" content="SecurePDF - Merge PDF Files Online Free | No Upload Required" />
  <meta property="og:description" content="Merge multiple PDF files into one for free. No signup required. All processing is done in your browser - your files never leave your device." />
  <meta property="og:type" content="website" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="SecurePDF - Merge PDF Files Online Free" />
  <meta name="twitter:description" content="Merge multiple PDF files into one for free. No signup required. All processing is done in your browser - your files never leave your device." />
  <link rel="canonical" href="https://pdf-merger.kooslab.com/merge" />
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex flex-col">
  <header class="py-12 bg-white shadow-lg">
    <div class="container mx-auto px-4 flex flex-col items-center">
      <div class="flex items-center gap-3 mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h1 class="text-5xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">SecurePDF Merge</h1>
      </div>
      <p class="text-xl text-gray-600 mb-4 text-center max-w-2xl">
        Merge multiple PDF files into one. Free, fast, and secure.
      </p>
      <div class="flex gap-3" role="list" aria-label="Key features">
        <span class="inline-flex items-center gap-1 bg-green-100 text-green-700 text-sm px-3 py-1 rounded-full font-semibold" role="listitem">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          No signup required
        </span>
        <span class="inline-flex items-center gap-1 bg-blue-100 text-blue-700 text-sm px-3 py-1 rounded-full font-semibold" role="listitem">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Secure & Private
        </span>
      </div>
      
      <div class="mt-4 flex gap-2">
        <a href="/" class="text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Home
        </a>
        <a href="/split" class="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors font-semibold">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
          </svg>
          Try PDF Splitter
        </a>
      </div>
    </div>
  </header>

  <main class="flex-1 flex flex-col items-center justify-center py-12">
    <div class="w-full max-w-2xl mx-auto px-4">
      <div class="bg-white rounded-2xl shadow-xl p-8 transform transition-all duration-300 hover:shadow-2xl">
        <div class="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-100" role="alert" aria-label="Privacy notice">
          <div class="flex items-start gap-3">
            <div class="flex-shrink-0 mt-1">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h2 class="text-lg font-semibold text-blue-900 mb-1">100% Private & Secure</h2>
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
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          How does it work?
        </h2>
        <ol class="list-decimal list-inside text-gray-700 space-y-3 mb-4" role="list">
          <li class="flex items-start gap-2" role="listitem">
            <span class="inline-flex items-center justify-center w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full text-sm font-semibold" aria-hidden="true">1</span>
            <span>Click <strong>Add PDF File</strong> and select one or more PDF files.</span>
          </li>
          <li class="flex items-start gap-2" role="listitem">
            <span class="inline-flex items-center justify-center w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full text-sm font-semibold" aria-hidden="true">2</span>
            <span>Drag to reorder, or set page ranges for each file if needed.</span>
          </li>
          <li class="flex items-start gap-2" role="listitem">
            <span class="inline-flex items-center justify-center w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full text-sm font-semibold" aria-hidden="true">3</span>
            <span>Click <strong>Merge PDFs</strong> and download your combined PDF instantly.</span>
          </li>
        </ol>
        <p class="text-sm text-gray-500 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
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
      <nav class="flex gap-4 mt-4 md:mt-0" aria-label="Footer navigation">
        <button on:click={handleContactClick} class="text-indigo-500 hover:text-indigo-600 text-sm transition-colors duration-200">Contact</button>
        <button on:click={handleTermsClick} class="text-indigo-500 hover:text-indigo-600 text-sm transition-colors duration-200">Terms</button>
      </nav>
    </div>
  </footer>

  <!-- Terms Modal -->
  <Modal bind:isOpen={showTermsModal} title="Terms of Service">
    <div class="prose prose-sm max-w-none">
      <h3 class="text-lg font-semibold mb-4">SecurePDF Terms of Service</h3>
      
      <h4 class="font-semibold mt-6 mb-2">1. Acceptance of Terms</h4>
      <p class="text-gray-700 mb-4">
        By using SecurePDF, you agree to these Terms of Service. If you do not agree to these terms, please do not use our service.
      </p>

      <h4 class="font-semibold mt-6 mb-2">2. Service Description</h4>
      <p class="text-gray-700 mb-4">
        SecurePDF provides browser-based PDF manipulation tools including merging and splitting PDF files. All processing occurs locally in your browser without uploading files to our servers.
      </p>

      <h4 class="font-semibold mt-6 mb-2">3. Privacy and Data Security</h4>
      <p class="text-gray-700 mb-4">
        Your files are processed entirely within your browser. We do not collect, store, or have access to any of your PDF files or their contents. We only collect anonymous usage statistics (page visits and operations performed).
      </p>

      <h4 class="font-semibold mt-6 mb-2">4. User Responsibilities</h4>
      <ul class="list-disc pl-6 text-gray-700 mb-4">
        <li>You are responsible for ensuring you have the right to manipulate any PDF files you process</li>
        <li>You must not use the service for any illegal or unauthorized purpose</li>
        <li>You must not attempt to reverse engineer or modify the service</li>
      </ul>

      <h4 class="font-semibold mt-6 mb-2">5. Intellectual Property</h4>
      <p class="text-gray-700 mb-4">
        The service and its original content, features, and functionality are owned by Kooslab and are protected by international copyright, trademark, and other intellectual property laws.
      </p>

      <h4 class="font-semibold mt-6 mb-2">6. Limitation of Liability</h4>
      <p class="text-gray-700 mb-4">
        SecurePDF is provided "as is" without warranties of any kind. We are not liable for any damages arising from the use or inability to use our service, including but not limited to data loss or corruption.
      </p>

      <h4 class="font-semibold mt-6 mb-2">7. Changes to Terms</h4>
      <p class="text-gray-700 mb-4">
        We reserve the right to modify these terms at any time. Continued use of the service after changes constitutes acceptance of the new terms.
      </p>

      <h4 class="font-semibold mt-6 mb-2">8. Contact Information</h4>
      <p class="text-gray-700 mb-4">
        For questions about these Terms of Service, please contact us at: johnnykoo@kooslab.net
      </p>

      <p class="text-sm text-gray-500 mt-8">
        Last updated: {new Date().toLocaleDateString()}
      </p>
    </div>
  </Modal>
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