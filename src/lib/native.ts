import { Capacitor } from '@capacitor/core';

/**
 * True inside the Android app (Capacitor shell). Browser-only features (service worker, install
 * prompt) check this flag; native-only calls belong in this module and are no-ops in the browser.
 */
export const isNative = Capacitor.isNativePlatform();
