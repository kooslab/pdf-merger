import { writable } from "svelte/store";

// Simple analytics tracking
export const trackEvent = async (type: "visit" | "merge") => {
  try {
    // Only track if the user hasn't opted out
    if (localStorage.getItem("analytics-opt-out") === "true") return;

    const metadata = {
      userAgent: navigator.userAgent,
      referrer: document.referrer,
      page: window.location.pathname,
    };

    await fetch("/api/analytics", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ type, metadata }),
    });
  } catch (error) {
    // Silently fail - we don't want to impact user experience
    console.error("Analytics error:", error);
  }
};

// Store for analytics opt-out state
export const analyticsOptOut = writable(
  typeof localStorage !== "undefined"
    ? localStorage.getItem("analytics-opt-out") === "true"
    : false
);

// Update localStorage when opt-out state changes
analyticsOptOut.subscribe((value) => {
  if (typeof localStorage !== "undefined") {
    localStorage.setItem("analytics-opt-out", value.toString());
  }
});
