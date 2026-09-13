/**
 * VAPID Key Utilities
 *
 * Shared between PWA install and push notification hooks.
 * Converts a base64 VAPID public key to Uint8Array for the Web Push API.
 * Only usable in browser (client-side) context.
 */

/** Decode a base64url-encoded VAPID public key to Uint8Array. */
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}