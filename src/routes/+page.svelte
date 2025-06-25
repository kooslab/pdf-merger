<script lang="ts">
  import { PDFDocument } from 'pdf-lib';
  import DraggableFile from '$lib/components/DraggableFile.svelte';
  import { fade, fly } from 'svelte/transition';
  import { trackEvent, analyticsOptOut } from '$lib/stores/analytics';
  import { onMount } from 'svelte';
  import { Avatar } from 'bits-ui';
  
  let statusEl: HTMLElement;
  let mergeBtn: HTMLButtonElement;
  let isDragging = false;
  
  // Store selected files
  let selectedFiles: Array<{
    id: string;
    file: File;
    pages: string;
  }> = [];

  let stats = {
    totalVisits: 0,
    totalMerges: 0
  };

  let displayStats = {
    totalVisits: 0,
    totalMerges: 0
  };

  let activeIndex = 0;

  function animateValue(start: number, end: number, duration: number, callback: (value: number) => void) {
    const startTime = performance.now();
    const change = end - start;
    
    function update(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentValue = Math.floor(start + change * easeOutQuart);
      
      callback(currentValue);
      
      if (progress < 1) {
        requestAnimationFrame(update);
      }
    }
    
    requestAnimationFrame(update);
  }

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Marketing Manager",
      content: "This PDF merger is a game-changer! I can combine multiple reports in seconds, and the best part is that my files never leave my computer. The interface is so intuitive and the drag-and-drop feature is brilliant.",
      rating: 5
    },
    {
      name: "Michael Chen",
      role: "Software Developer",
      content: "As a developer, I appreciate the attention to privacy and security. The fact that everything happens in the browser is impressive. I use this tool daily for merging documentation and it's been flawless.",
      rating: 5
    },
    {
      name: "Emma Rodriguez",
      role: "HR Specialist",
      content: "I love how easy it is to select specific pages from different PDFs. It's saved me so much time when preparing employee documentation. The page range feature is exactly what I needed.",
      rating: 5
    },
    {
      name: "David Kim",
      role: "Student",
      content: "Perfect for combining lecture notes and research papers. The interface is clean and straightforward, and I don't have to worry about my academic work being uploaded anywhere.",
      rating: 5
    }
  ];

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

  onMount(async () => {
    trackEvent('visit');
    try {
      const response = await fetch('/api/analytics');
      stats = await response.json();
      
      // Animate the stats when they load
      animateValue(0, stats.totalVisits, 2000, (value) => {
        displayStats.totalVisits = value;
      });
      
      animateValue(0, stats.totalMerges, 2000, (value) => {
        displayStats.totalMerges = value;
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  });

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

      // Track successful merge
      trackEvent('merge');

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
  <title>PDF Merger - Merge PDF Files Online Free | No Upload Required</title>
  <meta
    name="description"
    content="Merge multiple PDF files into one, for free. No signup required. All processing is done in your browser - your files never leave your device. Fast, secure, and easy to use PDF merger."
  />
  <meta name="keywords" content="PDF merger, merge PDF, combine PDF, PDF combiner, free PDF merger, online PDF merger, secure PDF merger, no upload PDF merger" />
  <meta name="robots" content="index, follow" />
  <meta property="og:title" content="PDF Merger - Merge PDF Files Online Free | No Upload Required" />
  <meta property="og:description" content="Merge multiple PDF files into one, for free. No signup required. All processing is done in your browser - your files never leave your device." />
  <meta property="og:type" content="website" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="PDF Merger - Merge PDF Files Online Free" />
  <meta name="twitter:description" content="Merge multiple PDF files into one, for free. No signup required. All processing is done in your browser - your files never leave your device." />
  <link rel="canonical" href="https://pdf-merger.kooslab.com" />
  <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "PDF Merger",
      "description": "Merge multiple PDF files into one, for free. No signup required. All processing is done in your browser - your files never leave your device.",
      "url": "https://pdf-merger.kooslab.com",
      "applicationCategory": "UtilityApplication",
      "operatingSystem": "Any",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD"
      },
      "featureList": [
        "Merge multiple PDF files",
        "No file upload required",
        "Process files in your browser",
        "100% private and secure",
        "Free to use"
      ]
    }
  </script>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex flex-col">
  <header class="py-12 bg-white shadow-lg">
    <div class="container mx-auto px-4 flex flex-col items-center">
      <div class="flex items-center gap-3 mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h1 class="text-5xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">PDF Merger</h1>
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

      <!-- Enhanced Stats Section -->
      <div class="mt-8 grid grid-cols-2 gap-6 max-w-2xl mx-auto">
        <div class="bg-white/50 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-100 transform transition-all duration-300 hover:scale-105">
          <div class="flex items-center justify-center gap-2 mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span class="text-base font-semibold text-gray-700">Total Visitors</span>
          </div>
          <div class="text-5xl font-extrabold text-indigo-700 text-center tracking-tight">
            {displayStats.totalVisits.toLocaleString()}
          </div>
          <div class="text-sm text-gray-500 text-center mt-2 flex items-center justify-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <span>and counting</span>
          </div>
        </div>

        <div class="bg-white/50 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-100 transform transition-all duration-300 hover:scale-105">
          <div class="flex items-center justify-center gap-2 mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span class="text-base font-semibold text-gray-700">PDFs Merged</span>
          </div>
          <div class="text-5xl font-extrabold text-green-700 text-center tracking-tight">
            {displayStats.totalMerges.toLocaleString()}
          </div>
          <div class="text-sm text-gray-500 text-center mt-2 flex items-center justify-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>successfully</span>
          </div>
        </div>
      </div>

      <div class="mt-6 text-center">
        <div class="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-50 rounded-full">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span class="text-base text-indigo-700 font-semibold">Trusted by thousands of users worldwide</span>
        </div>
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

    <!-- Testimonials Section (moved here) -->
    <div class="mt-16 max-w-4xl mx-auto px-4">
      <h2 class="text-2xl font-bold text-center text-gray-900 mb-8">What Our Users Say</h2>
      <div class="relative">
        <div class="overflow-hidden">
          <div 
            class="flex transition-transform duration-500 ease-in-out"
            style="transform: translateX(-{activeIndex * 100}%)"
          >
            {#each testimonials as testimonial}
              <div class="flex-[0_0_100%] min-w-0">
                <div class="bg-white/50 backdrop-blur-sm rounded-xl p-8 shadow-lg border border-gray-100 mx-4">
                  <div class="flex items-center gap-4 mb-4">
                    <Avatar.Root class="h-12 w-12">
                      <Avatar.Image
                        src={`https://api.dicebear.com/7.x/initials/svg?seed=${testimonial.name}&backgroundColor=6366f1,8b5cf6&textColor=ffffff`}
                        alt={testimonial.name}
                        class="h-full w-full rounded-full object-cover border-2 border-indigo-100"
                      />
                      <Avatar.Fallback class="h-full w-full rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-lg font-semibold text-white">
                        {testimonial.name[0]}
                      </Avatar.Fallback>
                    </Avatar.Root>
                    <div>
                      <div class="font-semibold text-gray-900">{testimonial.name}</div>
                      <div class="text-sm text-gray-500">{testimonial.role}</div>
                    </div>
                  </div>
                  <p class="text-gray-700 leading-relaxed">"{testimonial.content}"</p>
                  <div class="mt-4 flex gap-1">
                    {#each Array(5) as _, i}
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-5 w-5 {i < testimonial.rating ? 'text-yellow-400' : 'text-gray-300'}"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    {/each}
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>
        <div class="absolute inset-y-0 left-0 flex items-center">
          <button
            class="bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full shadow-lg transition-colors"
            on:click={() => activeIndex = Math.max(0, activeIndex - 1)}
            disabled={activeIndex === 0}
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>
        <div class="absolute inset-y-0 right-0 flex items-center">
          <button
            class="bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full shadow-lg transition-colors"
            on:click={() => activeIndex = Math.min(testimonials.length - 1, activeIndex + 1)}
            disabled={activeIndex === testimonials.length - 1}
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        <div class="flex justify-center gap-2 mt-6">
          {#each testimonials as _, i}
            <button
              class="w-2.5 h-2.5 rounded-full bg-gray-300 transition-colors"
              class:bg-indigo-600={i === activeIndex}
              on:click={() => (activeIndex = i)}
            />
          {/each}
        </div>
      </div>
    </div>
  </main>

  <footer class="bg-white border-t py-6 mt-auto">
    <div class="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between">
      <span class="text-gray-500 text-sm">
        &copy; {new Date().getFullYear()} Kooslab. All rights reserved.
      </span>
      <nav class="flex gap-4 mt-4 md:mt-0" aria-label="Footer navigation">
        <a href="#" class="text-indigo-500 hover:text-indigo-600 text-sm transition-colors duration-200">Contact</a>
        <a href="#" class="text-indigo-500 hover:text-indigo-600 text-sm transition-colors duration-200">Privacy</a>
        <a href="#" class="text-indigo-500 hover:text-indigo-600 text-sm transition-colors duration-200">Terms</a>
      </nav>
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
  :global(.carousel-viewport) {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  
  :global(.carousel-viewport::-webkit-scrollbar) {
    display: none;
  }
</style>
