<script lang="ts">
  import { PDFDocument } from 'pdf-lib';
  import { fade, fly } from 'svelte/transition';
  import { trackEvent } from '$lib/stores/analytics';
  import { onMount } from 'svelte';
  import { toast } from '$lib/stores/toast';
  import Modal from '$lib/components/Modal.svelte';
  import { Scissors } from 'lucide-svelte';
  import { browser } from '$app/environment';
  import JSZip from 'jszip';
  
  let pdfjsLib: any;
  
  // Dynamically import pdfjs only on client side
  if (browser) {
    import('pdfjs-dist').then(module => {
      pdfjsLib = module;
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
    });
  }

  let statusEl: HTMLElement;
  let splitBtn: HTMLButtonElement;
  let fileInput: HTMLInputElement;
  
  let selectedFile: File | null = null;
  let pdfDoc: PDFDocument | null = null;
  let pdfPageCount: number = 0;
  let pageRanges: string = '';
  let pagePreviews: Array<{ pageNumber: number; aspectRatio: number; canvas?: HTMLCanvasElement }> = [];
  let splitPoints: Set<number> = new Set();
  let isLoadingPreviews = false;
  let showTermsModal = false;
  let pdfJsDoc: any = null;

  onMount(() => {
    trackEvent('visit_split');
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

  async function handleFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      selectedFile = input.files[0];
      await loadPdfInfo();
    }
  }

  async function loadPdfInfo() {
    if (!selectedFile) return;
    
    try {
      isLoadingPreviews = true;
      statusEl.textContent = "Loading PDF...";
      
      const arrayBuffer = await selectedFile.arrayBuffer();
      
      // Load with pdf-lib for manipulation
      pdfDoc = await PDFDocument.load(arrayBuffer);
      pdfPageCount = pdfDoc.getPageCount();
      
      // Wait for pdfjs to load if in browser
      if (browser) {
        // Wait a bit for pdfjs to load if it hasn't yet
        let attempts = 0;
        while (!pdfjsLib && attempts < 10) {
          await new Promise(resolve => setTimeout(resolve, 100));
          attempts++;
        }
        
        if (pdfjsLib) {
          const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
          pdfJsDoc = await loadingTask.promise;
        }
      }
      
      // Generate page previews
      await generatePagePreviews();
      
      statusEl.textContent = "";
    } catch (error) {
      console.error('Error loading PDF:', error);
      statusEl.textContent = 'Error loading PDF file';
    } finally {
      isLoadingPreviews = false;
    }
  }

  async function generatePagePreviews() {
    if (!pdfDoc || !pdfJsDoc) return;
    
    pagePreviews = [];
    const scale = 0.5; // Scale for preview rendering
    
    for (let i = 0; i < pdfPageCount; i++) {
      try {
        // Get page from pdfjs
        const page = await pdfJsDoc.getPage(i + 1);
        const viewport = page.getViewport({ scale });
        
        // Create canvas for rendering
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        
        // Render page to canvas
        const renderContext = {
          canvasContext: context,
          viewport: viewport
        };
        await page.render(renderContext).promise;
        
        // Get aspect ratio from pdf-lib
        const pdfLibPage = pdfDoc.getPage(i);
        const { width, height } = pdfLibPage.getSize();
        const aspectRatio = width / height;
        
        // Store page info including canvas
        pagePreviews.push({
          pageNumber: i + 1,
          aspectRatio: aspectRatio,
          canvas: canvas
        });
        
        // Trigger reactivity
        pagePreviews = pagePreviews;
      } catch (error) {
        console.error(`Error rendering preview for page ${i}:`, error);
        pagePreviews.push({
          pageNumber: i + 1,
          aspectRatio: 1.294 // Default A4 aspect ratio
        });
      }
    }
  }

  function toggleSplitPoint(gapIndex: number) {
    if (splitPoints.has(gapIndex)) {
      splitPoints.delete(gapIndex);
    } else {
      splitPoints.add(gapIndex);
    }
    splitPoints = splitPoints; // Trigger reactivity
    updatePageRanges();
  }

  function updatePageRanges() {
    if (splitPoints.size === 0) {
      pageRanges = `1-${pdfPageCount}`;
      return;
    }
    
    const sortedSplitPoints = Array.from(splitPoints).sort((a, b) => a - b);
    const ranges: string[] = [];
    let start = 1;
    
    for (const splitAfterPage of sortedSplitPoints) {
      ranges.push(`${start}-${splitAfterPage}`);
      start = splitAfterPage + 1;
    }
    
    // Add the last range
    if (start <= pdfPageCount) {
      ranges.push(`${start}-${pdfPageCount}`);
    }
    
    pageRanges = ranges.join(', ');
  }

  async function handleSplit() {
    if (!selectedFile || !pdfDoc) {
      statusEl.textContent = "Please select a PDF file to split.";
      return;
    }

    try {
      statusEl.textContent = "Splitting PDF...";
      splitBtn.disabled = true;

      let splitConfigs: Array<{ name: string; pages: number[] }> = [];

      // Parse page ranges from split points
      const ranges = pageRanges.split(',').map(r => r.trim()).filter(r => r);
      
      for (let i = 0; i < ranges.length; i++) {
        const range = ranges[i];
        let pageIndices: number[] = [];
        
        if (range.includes('-')) {
          const [start, end] = range.split('-').map(n => parseInt(n.trim(), 10) - 1);
          for (let j = start; j <= end; j++) {
            if (j >= 0 && j < pdfPageCount) pageIndices.push(j);
          }
        } else {
          const idx = parseInt(range.trim(), 10) - 1;
          if (!isNaN(idx) && idx >= 0 && idx < pdfPageCount) {
            pageIndices.push(idx);
          }
        }
        
        if (pageIndices.length > 0) {
          const baseName = selectedFile.name.replace('.pdf', '');
          // Sanitize filename to remove special characters that might cause issues
          const sanitizedBaseName = baseName.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_');
          
          // Create descriptive filename with page range
          const startPage = pageIndices[0] + 1;
          const endPage = pageIndices[pageIndices.length - 1] + 1;
          const pageRangeStr = startPage === endPage ? `page_${startPage}` : `pages_${startPage}-${endPage}`;
          
          splitConfigs.push({
            name: `${sanitizedBaseName}_${String(i + 1).padStart(2, '0')}_${pageRangeStr}.pdf`,
            pages: pageIndices
          });
        }
      }

      // Create a ZIP file containing all split PDFs
      const zip = new JSZip();
      
      for (let i = 0; i < splitConfigs.length; i++) {
        const config = splitConfigs[i];
        statusEl.textContent = `Creating part ${i + 1} of ${splitConfigs.length}...`;
        
        try {
          const newPdf = await PDFDocument.create();
          const copiedPages = await newPdf.copyPages(pdfDoc, config.pages);
          copiedPages.forEach((page) => newPdf.addPage(page));
          
          const pdfBytes = await newPdf.save();
          console.log(`Created PDF ${config.name} with ${pdfBytes.length} bytes`);
          
          // Add PDF to ZIP
          zip.file(config.name, pdfBytes);
        } catch (err) {
          console.error(`Error creating PDF part ${i + 1}:`, err);
          throw err;
        }
      }
      
      // Generate ZIP file
      statusEl.textContent = "Creating ZIP file...";
      const zipBlob = await zip.generateAsync({
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: { level: 6 }
      });
      
      // Create download link for ZIP
      const zipUrl = URL.createObjectURL(zipBlob);
      const baseName = selectedFile.name.replace('.pdf', '');
      const sanitizedBaseName = baseName.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_');
      const zipFileName = `${sanitizedBaseName}_split.zip`;
      
      console.log(`Created ZIP file: ${zipFileName} (${zipBlob.size} bytes)`);
      
      // Automatically download the ZIP file
      const a = document.createElement('a');
      a.href = zipUrl;
      a.download = zipFileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // Clean up blob URL after download
      setTimeout(() => {
        URL.revokeObjectURL(zipUrl);
      }, 1000);

      // Track successful split with total pages processed
      trackEvent('split', pdfPageCount);

      statusEl.textContent = `Split complete! Downloading ${zipFileName} with ${splitConfigs.length} PDF files.`;
      toast.success(`ZIP file created with ${splitConfigs.length} PDFs inside!`);
    } catch (error: unknown) {
      console.error("Error splitting PDF:", error);
      statusEl.textContent = `Error: ${error instanceof Error ? error.message : String(error)}`;
    } finally {
      splitBtn.disabled = false;
    }
  }

  function removeFile() {
    selectedFile = null;
    pdfDoc = null;
    pdfJsDoc = null;
    pdfPageCount = 0;
    pageRanges = '';
    pagePreviews = [];
    splitPoints.clear();
    if (fileInput) fileInput.value = '';
    
  }

  function clearSplitPoints() {
    splitPoints.clear();
    splitPoints = splitPoints;
    updatePageRanges();
  }
  
</script>

<svelte:head>
  <title>SecurePDF - Split PDF Files Online Free | No Upload Required</title>
  <meta
    name="description"
    content="SecurePDF - Split PDF files into multiple parts for free. No signup required. All processing is done in your browser - your files never leave your device. Fast, secure, and private PDF splitter."
  />
  <meta name="keywords" content="PDF splitter, split PDF, divide PDF, PDF divider, free PDF splitter, online PDF splitter, secure PDF splitter, no upload PDF splitter" />
  <meta name="robots" content="index, follow" />
  <meta property="og:title" content="SecurePDF - Split PDF Files Online Free | No Upload Required" />
  <meta property="og:description" content="SecurePDF - Split PDF files into multiple parts for free. No signup required. All processing is done in your browser - your files never leave your device." />
  <meta property="og:type" content="website" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="SecurePDF - Split PDF Files Online Free" />
  <meta name="twitter:description" content="SecurePDF - Split PDF files into multiple parts for free. No signup required. All processing is done in your browser - your files never leave your device." />
  <link rel="canonical" href="https://pdf-merger.kooslab.com/split" />
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-red-50 flex flex-col">
  <header class="py-12 bg-white shadow-lg">
    <div class="container mx-auto px-4 flex flex-col items-center">
      <div class="flex items-center gap-3 mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
        </svg>
        <h1 class="text-5xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">SecurePDF Split</h1>
      </div>
      <p class="text-xl text-gray-600 mb-4 text-center max-w-2xl">
        Split PDF files into multiple parts. Free, fast, and secure.
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
        <a href="/" class="text-purple-600 hover:text-purple-700 flex items-center gap-1 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Home
        </a>
        <a href="/merge" class="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors font-semibold">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Try PDF Merger
        </a>
      </div>
    </div>
  </header>

  <main class="flex-1 flex flex-col items-center justify-center py-12">
    <div class="w-full max-w-6xl mx-auto px-4">
      <div class="bg-white rounded-2xl shadow-xl p-8 transform transition-all duration-300 hover:shadow-2xl">
        <div class="mb-6 p-4 bg-purple-50 rounded-lg border border-purple-100" role="alert" aria-label="Privacy notice">
          <div class="flex items-start gap-3">
            <div class="flex-shrink-0 mt-1">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h2 class="text-lg font-semibold text-purple-900 mb-1">100% Private & Secure</h2>
              <p class="text-purple-700">
                All processing is done in your browser. Your files never leave your device. No uploads, no server storage, complete privacy.
              </p>
            </div>
          </div>
        </div>

        {#if !selectedFile}
          <div class="flex flex-col items-center gap-6">
            <label class="group relative">
              <div class="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg blur opacity-25 group-hover:opacity-75 transition duration-200"></div>
              <div class="relative bg-white px-6 py-3 rounded-lg flex items-center gap-2 cursor-pointer hover:bg-gray-50 transition-colors duration-200">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
                <span class="font-semibold text-gray-700">Select PDF File</span>
                <input
                  bind:this={fileInput}
                  type="file"
                  accept=".pdf"
                  class="hidden"
                  on:change={handleFileSelect}
                />
              </div>
            </label>
          </div>
        {:else}
          <div class="space-y-6">
            <!-- File info -->
            <div class="p-4 bg-gray-50 rounded-lg flex justify-between items-center">
              <div class="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <div>
                  <div class="font-medium text-gray-800">{selectedFile.name}</div>
                  <div class="text-sm text-gray-600">Total pages: {pdfPageCount}</div>
                </div>
              </div>
              <button
                class="text-gray-400 hover:text-red-500 transition-colors duration-200"
                on:click={removeFile}
                aria-label="Remove file"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                </svg>
              </button>
            </div>

            <!-- Instructions -->
            <div class="bg-purple-50 p-4 rounded-lg">
              <h3 class="font-semibold text-purple-900 mb-2">How to split:</h3>
              <p class="text-purple-700 text-sm">Click on the gaps between pages to add split points. Each section will become a separate PDF file.</p>
              {#if splitPoints.size > 0}
                <p class="text-purple-600 text-sm mt-2 font-medium">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  You'll receive a ZIP file containing {splitPoints.size + 1} separate PDF files.
                </p>
              {/if}
            </div>

            <!-- Page previews -->
            {#if isLoadingPreviews}
              <div class="text-center py-8">
                <div class="inline-flex items-center gap-2">
                  <svg class="animate-spin h-5 w-5 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span class="text-purple-600">Loading page previews...</span>
                </div>
              </div>
            {:else if pagePreviews.length > 0}
              <div class="border-2 border-gray-200 rounded-lg p-6 bg-gray-50">
                <div class="flex justify-between items-center mb-4">
                  <div>
                    <h3 class="font-semibold text-gray-800">Page Preview</h3>
                    {#if pdfPageCount > 4}
                      <p class="text-xs text-gray-500 mt-1">Scroll horizontally to see all {pdfPageCount} pages →</p>
                    {/if}
                  </div>
                  {#if splitPoints.size > 0}
                    <button
                      on:click={clearSplitPoints}
                      class="text-sm text-purple-600 hover:text-purple-700 transition-colors"
                    >
                      Clear all split points
                    </button>
                  {/if}
                </div>
                
                <div class="overflow-x-auto -mx-2 px-2">
                <div class="flex items-center justify-start gap-3 pb-2 min-w-full" style="width: max-content;">
                  {#each pagePreviews as preview, index}
                    <!-- Page -->
                    <div class="relative group">
                      <div 
                        class="bg-white border-2 border-gray-300 rounded-lg shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden"
                        style="width: {preview.aspectRatio > 1 ? '240px' : '180px'}; height: {preview.aspectRatio > 1 ? 240 / preview.aspectRatio + 'px' : '240px'};"
                      >
                        {#if preview.canvas}
                          <!-- Actual PDF page preview -->
                          <div class="relative w-full h-full">
                            <img 
                              src={preview.canvas.toDataURL()} 
                              alt="Page {preview.pageNumber}"
                              class="w-full h-full object-contain"
                            />
                            <!-- Page number overlay -->
                            <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                              <div class="text-white text-sm font-semibold text-center">
                                Page {preview.pageNumber}
                              </div>
                            </div>
                          </div>
                        {:else}
                          <!-- Fallback preview -->
                          <div class="w-full h-full bg-gradient-to-b from-gray-50 to-gray-100 relative">
                            <!-- Simulated page content lines -->
                            <div class="absolute inset-0 p-4">
                              <div class="space-y-2">
                                <div class="h-2 bg-gray-300 rounded w-3/4"></div>
                                <div class="h-2 bg-gray-300 rounded w-full"></div>
                                <div class="h-2 bg-gray-300 rounded w-5/6"></div>
                                <div class="h-2 bg-gray-300 rounded w-2/3"></div>
                              </div>
                            </div>
                            <!-- Page number overlay -->
                            <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-900/70 to-transparent p-3">
                              <div class="text-white text-sm font-semibold text-center">
                                Page {preview.pageNumber}
                              </div>
                            </div>
                          </div>
                        {/if}
                      </div>
                    </div>
                    
                    <!-- Gap between pages (clickable split point) -->
                    {#if index < pdfPageCount - 1}
                      <button
                        class="relative h-48 w-16 flex items-center justify-center hover:bg-gray-100 rounded transition-colors"
                        class:bg-purple-100={splitPoints.has(index + 1)}
                        on:click={() => toggleSplitPoint(index + 1)}
                        aria-label="Split after page {index + 1}"
                      >
                        {#if splitPoints.has(index + 1)}
                          <div class="bg-purple-600 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform">
                            <Scissors class="h-5 w-5" />
                          </div>
                        {:else}
                          <div class="text-gray-400 hover:text-purple-600 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" stroke-dasharray="2 4" d="M12 5v14" />
                            </svg>
                          </div>
                        {/if}
                      </button>
                    {/if}
                  {/each}
                </div>
                </div>
              </div>
            {/if}

            <!-- Split ranges display -->
            {#if pageRanges}
              <div class="bg-gray-50 p-4 rounded-lg">
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Split ranges (auto-generated):
                </label>
                <div class="bg-white border border-gray-300 rounded px-3 py-2 text-sm font-mono">
                  {pageRanges}
                </div>
                <p class="text-xs text-gray-500 mt-2">
                  This will create {pageRanges.split(',').length} separate PDF files
                </p>
              </div>
            {/if}

            <!-- Split button -->
            <div class="flex justify-center">
              <button
                bind:this={splitBtn}
                class="group relative"
                on:click={handleSplit}
                disabled={!pageRanges}
              >
                <div class="absolute -inset-0.5 bg-gradient-to-r from-purple-400 to-pink-500 rounded-lg blur opacity-25 group-hover:opacity-75 transition duration-200"></div>
                <div class="relative bg-gradient-to-r from-purple-400 to-pink-500 text-white font-bold py-4 px-8 rounded-lg text-lg flex items-center gap-2 hover:from-purple-500 hover:to-pink-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Split PDF
                </div>
              </button>
            </div>
          </div>
        {/if}
      </div>
      <div bind:this={statusEl} class="text-center text-gray-600 mt-4 min-h-[24px]"></div>
    </div>
    

    <section class="w-full max-w-2xl mx-auto mt-12 px-4">
      <div class="bg-white rounded-xl shadow-lg p-8 transform transition-all duration-300 hover:shadow-xl">
        <h2 class="text-2xl font-bold text-purple-700 mb-4 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          How does it work?
        </h2>
        <ol class="list-decimal list-inside text-gray-700 space-y-3 mb-4" role="list">
          <li class="flex items-start gap-2" role="listitem">
            <span class="inline-flex items-center justify-center w-6 h-6 bg-purple-100 text-purple-600 rounded-full text-sm font-semibold" aria-hidden="true">1</span>
            <span>Click <strong>Select PDF File</strong> and choose the PDF you want to split.</span>
          </li>
          <li class="flex items-start gap-2" role="listitem">
            <span class="inline-flex items-center justify-center w-6 h-6 bg-purple-100 text-purple-600 rounded-full text-sm font-semibold" aria-hidden="true">2</span>
            <span>Click on the gaps between pages to set split points. A purple indicator will appear.</span>
          </li>
          <li class="flex items-start gap-2" role="listitem">
            <span class="inline-flex items-center justify-center w-6 h-6 bg-purple-100 text-purple-600 rounded-full text-sm font-semibold" aria-hidden="true">3</span>
            <span>Click <strong>Split PDF</strong> and download a ZIP file containing all your split PDFs.</span>
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
        <button on:click={handleContactClick} class="text-purple-500 hover:text-purple-600 text-sm transition-colors duration-200">Contact</button>
        <button on:click={handleTermsClick} class="text-purple-500 hover:text-purple-600 text-sm transition-colors duration-200">Terms</button>
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
  /* Custom scrollbar for page preview */
  .overflow-x-auto {
    scrollbar-width: thin;
    scrollbar-color: #9ca3af #f3f4f6;
  }
  
  .overflow-x-auto::-webkit-scrollbar {
    height: 8px;
  }
  
  .overflow-x-auto::-webkit-scrollbar-track {
    background: #f3f4f6;
    border-radius: 4px;
  }
  
  .overflow-x-auto::-webkit-scrollbar-thumb {
    background: #9ca3af;
    border-radius: 4px;
  }
  
  .overflow-x-auto::-webkit-scrollbar-thumb:hover {
    background: #6b7280;
  }
</style>