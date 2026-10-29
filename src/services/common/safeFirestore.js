/**
 * Safe Firestore Async Operation Helper
 * - Handles offline / retry / network timeouts
 * - Prevents unhandled promise rejections from crashing the UI
 * - Integrates with offline synchronization queue when applicable
 */

import { enqueueOfflineReport } from "./workReportSyncEngine";

/**
 * Execute a Firestore write operation safely
 * @param {Function} asyncFn - Async operation returning a promise
 * @param {Object} options
 * @param {string} options.operationName - Human readable operation name for logs
 * @param {string} [options.collectionName] - Optional Firestore collection name for offline queuing
 * @param {string} [options.docId] - Optional Firestore document ID
 * @param {any} [options.payload] - Optional payload to queue offline if network fails
 * @param {any} [options.fallbackValue] - Fallback value to return on failure
 * @returns {Promise<{ success: boolean, data: any, isOffline: boolean, error: any }>}
 */
export async function safeFirestoreWrite(asyncFn, options = {}) {
  const {
    operationName = "Firestore Operation",
    collectionName = null,
    docId = null,
    payload = null,
    fallbackValue = null
  } = options;

  const isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;

  if (!isOnline && collectionName && docId && payload) {
    console.info(`[SafeFirestore] Currently offline. Queuing ${operationName} (${collectionName}/${docId}) for background sync.`);
    try {
      enqueueOfflineReport({
        collectionName,
        id: docId,
        payload,
        docType: operationName
      });
      return { success: true, data: fallbackValue || payload, isOffline: true, error: null };
    } catch (e) {
      console.warn(`[SafeFirestore] Failed to queue offline report:`, e);
    }
  }

  try {
    const result = await asyncFn();
    return { success: true, data: result ?? fallbackValue, isOffline: false, error: null };
  } catch (error) {
    console.warn(`[SafeFirestore] Error during ${operationName}:`, error);

    // If write fails due to network/unavailable and we have offline queue info
    const isNetworkError =
      !navigator.onLine ||
      error?.code === "unavailable" ||
      error?.message?.includes("offline") ||
      error?.message?.includes("Failed to fetch");

    if (isNetworkError && collectionName && docId && payload) {
      console.info(`[SafeFirestore] Network failure detected. Enqueueing ${docId} to offline sync.`);
      try {
        enqueueOfflineReport({
          collectionName,
          id: docId,
          payload,
          docType: operationName
        });
      } catch (queueErr) {
        console.warn(`[SafeFirestore] Offline queueing error:`, queueErr);
      }
    }

    return {
      success: false,
      data: fallbackValue,
      isOffline: !isOnline || isNetworkError,
      error
    };
  }
}

/**
 * Execute a Firestore read operation with timeout and fallback
 * @param {Function} asyncFn - Async operation returning a promise
 * @param {Object} options
 * @param {string} options.operationName - Human readable operation name
 * @param {any} options.fallbackValue - Safe default value if read fails or times out
 * @param {number} [options.timeoutMs] - Timeout in milliseconds (default: 8000ms)
 * @returns {Promise<any>}
 */
export async function safeFirestoreRead(asyncFn, options = {}) {
  const {
    operationName = "Firestore Read",
    fallbackValue = null,
    timeoutMs = 8000
  } = options;

  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`Timeout of ${timeoutMs}ms exceeded during ${operationName}`));
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([asyncFn(), timeoutPromise]);
    clearTimeout(timeoutId);
    return result ?? fallbackValue;
  } catch (error) {
    clearTimeout(timeoutId);
    console.warn(`[SafeFirestore] Read error or timeout during ${operationName}:`, error?.message || error);
    return fallbackValue;
  }
}
