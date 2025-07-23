<script lang="ts">
  import { fade, fly } from 'svelte/transition';
  import { trackEvent } from '$lib/stores/analytics';
  import { onMount } from 'svelte';
  import { toast } from '$lib/stores/toast';
  import Modal from '$lib/components/Modal.svelte';

  let stats = {
    totalVisits: 0,
    totalPagesMerged: 0,
    totalPagesSplit: 0
  };

  let displayStats = {
    totalVisits: 0,
    totalPagesMerged: 0,
    totalPagesSplit: 0
  };

  let showTermsModal = false;

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

  onMount(async () => {
    trackEvent('visit');
    try {
      const response = await fetch('/api/analytics');
      stats = await response.json();
      
      // Animate the stats when they load
      animateValue(0, stats.totalVisits, 2000, (value) => {
        displayStats.totalVisits = value;
      });
      
      animateValue(0, stats.totalPagesMerged || 0, 2000, (value) => {
        displayStats.totalPagesMerged = value;
      });
      
      animateValue(0, stats.totalPagesSplit || 0, 2000, (value) => {
        displayStats.totalPagesSplit = value;
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  });
</script>

<svelte:head>
  <title>SecurePDF - Merge & Split PDF Files Online Free | No Upload Required</title>
  <meta
    name="description"
    content="SecurePDF - Merge and split PDF files online for free. No signup required. All processing is done in your browser - your files never leave your device. Fast, secure, and private PDF tools."
  />
  <meta name="keywords" content="PDF merger, merge PDF, combine PDF, PDF combiner, free PDF merger, online PDF merger, secure PDF merger, no upload PDF merger" />
  <meta name="robots" content="index, follow" />
  <meta property="og:title" content="SecurePDF - Merge & Split PDF Files Online Free | No Upload Required" />
  <meta property="og:description" content="SecurePDF - Merge and split PDF files for free. No signup required. All processing is done in your browser - your files never leave your device." />
  <meta property="og:type" content="website" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="SecurePDF - Merge & Split PDF Files Online Free" />
  <meta name="twitter:description" content="SecurePDF - Merge and split PDF files for free. No signup required. All processing is done in your browser - your files never leave your device." />
  <link rel="canonical" href="https://pdf-merger.kooslab.com" />
  <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "SecurePDF",
      "description": "SecurePDF - Merge and split PDF files online for free. No signup required. All processing is done in your browser - your files never leave your device.",
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
        <h1 class="text-5xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">SecurePDF</h1>
      </div>
      <p class="text-xl text-gray-600 mb-4 text-center max-w-2xl">
        Merge and split PDF files securely. Free, fast, and private.
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
      <div class="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
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
            <span class="text-base font-semibold text-gray-700">Pages Merged</span>
          </div>
          <div class="text-5xl font-extrabold text-green-700 text-center tracking-tight">
            {displayStats.totalPagesMerged.toLocaleString()}
          </div>
          <div class="text-sm text-gray-500 text-center mt-2 flex items-center justify-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>pages processed</span>
          </div>
        </div>

        <div class="bg-white/50 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-100 transform transition-all duration-300 hover:scale-105">
          <div class="flex items-center justify-center gap-2 mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
            </svg>
            <span class="text-base font-semibold text-gray-700">Pages Split</span>
          </div>
          <div class="text-5xl font-extrabold text-purple-700 text-center tracking-tight">
            {displayStats.totalPagesSplit.toLocaleString()}
          </div>
          <div class="text-sm text-gray-500 text-center mt-2 flex items-center justify-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>pages divided</span>
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
    <div class="w-full max-w-6xl mx-auto px-4">
      <!-- Service Selection -->
      <div class="grid md:grid-cols-2 gap-8 mb-12">
        <!-- Merge PDF Service -->
        <div class="bg-white rounded-2xl shadow-xl p-8 transform transition-all duration-300 hover:shadow-2xl hover:scale-105">
          <div class="flex items-center justify-center mb-6">
            <div class="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full p-6">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
          <h2 class="text-3xl font-bold text-center mb-4 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Merge PDFs
          </h2>
          <p class="text-gray-600 text-center mb-6">
            Combine multiple PDF files into a single document. Drag and drop to reorder, select specific pages, and merge instantly.
          </p>
          <ul class="space-y-3 mb-8">
            <li class="flex items-start gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              <span class="text-gray-700">Drag & drop file reordering</span>
            </li>
            <li class="flex items-start gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              <span class="text-gray-700">Select specific page ranges</span>
            </li>
            <li class="flex items-start gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              <span class="text-gray-700">No file size limits</span>
            </li>
          </ul>
          <a href="/merge" class="block w-full">
            <button class="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold py-4 px-6 rounded-lg text-lg hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl">
              Start Merging
              <svg xmlns="http://www.w3.org/2000/svg" class="inline-block h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </a>
        </div>

        <!-- Split PDF Service -->
        <div class="bg-white rounded-2xl shadow-xl p-8 transform transition-all duration-300 hover:shadow-2xl hover:scale-105">
          <div class="flex items-center justify-center mb-6">
            <div class="bg-gradient-to-br from-purple-500 to-pink-600 rounded-full p-6">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
              </svg>
            </div>
          </div>
          <h2 class="text-3xl font-bold text-center mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Split PDFs
          </h2>
          <p class="text-gray-600 text-center mb-6">
            Divide a PDF into multiple files. Visual page preview lets you click between pages to set split points easily.
          </p>
          <ul class="space-y-3 mb-8">
            <li class="flex items-start gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              <span class="text-gray-700">Visual page preview</span>
            </li>
            <li class="flex items-start gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              <span class="text-gray-700">Click between pages to split</span>
            </li>
            <li class="flex items-start gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              <span class="text-gray-700">Download all parts at once</span>
            </li>
          </ul>
          <a href="/split" class="block w-full">
            <button class="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white font-bold py-4 px-6 rounded-lg text-lg hover:from-purple-600 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl">
              Start Splitting
              <svg xmlns="http://www.w3.org/2000/svg" class="inline-block h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </a>
        </div>
      </div>

      <!-- Privacy Notice -->
      <div class="bg-white rounded-xl shadow-lg p-8 max-w-4xl mx-auto">
        <div class="flex items-start gap-4">
          <div class="flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <h3 class="text-xl font-bold text-gray-900 mb-2">100% Private & Secure</h3>
            <p class="text-gray-700 leading-relaxed">
              All PDF processing happens directly in your browser using advanced JavaScript technology. Your files never leave your device, are never uploaded to any server, and we have no access to your documents. This ensures complete privacy and security for your sensitive information.
            </p>
          </div>
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