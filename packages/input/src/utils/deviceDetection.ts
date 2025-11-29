/**
 * Detect if the device supports touch input
 * Checks multiple signals: touch events, maxTouchPoints, and mobile user agent
 */
export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false;

  // Check for touch event support
  const hasOntouchstart = 'ontouchstart' in window;
  const maxTouchPoints = navigator.maxTouchPoints;
  // @ts-expect-error - msMaxTouchPoints is IE specific
  const msMaxTouchPoints = navigator.msMaxTouchPoints || 0;

  const hasTouchEvents = hasOntouchstart || maxTouchPoints > 0 || msMaxTouchPoints > 0;

  // Also check user agent for mobile browsers (helps with DevTools emulation)
  const isMobile = isMobileBrowser();

  return hasTouchEvents || isMobile;
}

/**
 * Detect if a gamepad is connected
 */
export function hasGamepad(): boolean {
  if (typeof navigator === 'undefined' || !navigator.getGamepads) return false;

  const gamepads = navigator.getGamepads();
  return gamepads.some((gamepad) => gamepad !== null);
}

/**
 * Get the first connected gamepad
 */
export function getFirstGamepad(): Gamepad | null {
  if (typeof navigator === 'undefined' || !navigator.getGamepads) return null;

  const gamepads = navigator.getGamepads();
  for (const gamepad of gamepads) {
    if (gamepad !== null) return gamepad;
  }
  return null;
}

/**
 * Check if we're in a mobile browser
 */
export function isMobileBrowser(): boolean {
  if (typeof navigator === 'undefined') return false;

  const userAgent = navigator.userAgent.toLowerCase();
  return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
    userAgent
  );
}

/**
 * Check if the browser supports the Gamepad API
 */
export function supportsGamepadAPI(): boolean {
  return typeof navigator !== 'undefined' && 'getGamepads' in navigator;
}

/**
 * Check if the browser supports Pointer Events
 */
export function supportsPointerEvents(): boolean {
  return typeof window !== 'undefined' && 'PointerEvent' in window;
}
