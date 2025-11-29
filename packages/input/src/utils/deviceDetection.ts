/**
 * Detect if the device supports touch input
 */
export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false;

  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    // @ts-expect-error - msMaxTouchPoints is IE specific
    navigator.msMaxTouchPoints > 0
  );
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
