declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

export function trackEvent(event: string, params?: Record<string, unknown>) {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", event, params);
  }
}

export function trackSignUp() {
  trackEvent("CompleteRegistration");
}

export function trackUpload(filename: string) {
  trackEvent("InitiateCheckout", { content_name: filename });
}

export function trackConversion(filename: string) {
  trackEvent("Purchase", { content_name: filename, value: 0, currency: "USD" });
}

export function trackPurchase(value: number) {
  trackEvent("Purchase", { value, currency: "USD" });
}

export function trackPlay() {
  trackEvent("ViewContent", { content_name: "audio_play" });
}

export function trackDownload(format: string) {
  trackEvent("Lead", { content_name: `download_${format}` });
}

export function trackPricingView() {
  trackEvent("ViewContent", { content_name: "pricing" });
}
