import { useState, useEffect, useCallback } from 'react';

export type DeviceType = 'mobile' | 'tablet' | 'desktop';
export type Orientation = 'portrait' | 'landscape';

export interface SafeAreaInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface ViewportInfo {
  width: number;
  height: number;
  aspectRatio: number;
  deviceType: DeviceType;
  orientation: Orientation;
  safeAreaInsets: SafeAreaInsets;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isPortrait: boolean;
  isLandscape: boolean;
}

export const BREAKPOINTS = {
  mobile: 640,
  tablet: 1024,
} as const;

function getDeviceType(width: number): DeviceType {
  if (width < BREAKPOINTS.mobile) return 'mobile';
  if (width < BREAKPOINTS.tablet) return 'tablet';
  return 'desktop';
}

function getOrientation(width: number, height: number): Orientation {
  return width < height ? 'portrait' : 'landscape';
}

function getSafeAreaInsets(): SafeAreaInsets {
  if (typeof window === 'undefined') {
    return { top: 0, right: 0, bottom: 0, left: 0 };
  }

  const style = getComputedStyle(document.documentElement);

  const parseInset = (value: string): number => {
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? 0 : parsed;
  };

  return {
    top: parseInset(style.getPropertyValue('--safe-area-top') || '0'),
    right: parseInset(style.getPropertyValue('--safe-area-right') || '0'),
    bottom: parseInset(style.getPropertyValue('--safe-area-bottom') || '0'),
    left: parseInset(style.getPropertyValue('--safe-area-left') || '0'),
  };
}

function calculateViewportInfo(): ViewportInfo {
  if (typeof window === 'undefined') {
    return {
      width: 1920,
      height: 1080,
      aspectRatio: 1920 / 1080,
      deviceType: 'desktop',
      orientation: 'landscape',
      safeAreaInsets: { top: 0, right: 0, bottom: 0, left: 0 },
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      isPortrait: false,
      isLandscape: true,
    };
  }

  const width = window.innerWidth;
  const height = window.innerHeight;
  const aspectRatio = width / height;
  const deviceType = getDeviceType(width);
  const orientation = getOrientation(width, height);
  const safeAreaInsets = getSafeAreaInsets();

  return {
    width,
    height,
    aspectRatio,
    deviceType,
    orientation,
    safeAreaInsets,
    isMobile: deviceType === 'mobile',
    isTablet: deviceType === 'tablet',
    isDesktop: deviceType === 'desktop',
    isPortrait: orientation === 'portrait',
    isLandscape: orientation === 'landscape',
  };
}

export function useViewport(): ViewportInfo {
  const [viewport, setViewport] = useState<ViewportInfo>(calculateViewportInfo);

  const handleResize = useCallback(() => {
    setViewport(calculateViewportInfo());
  }, []);

  useEffect(() => {
    // Initial calculation
    handleResize();

    // Debounced resize handler
    let timeoutId: ReturnType<typeof setTimeout>;
    const debouncedResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleResize, 100);
    };

    window.addEventListener('resize', debouncedResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', debouncedResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [handleResize]);

  return viewport;
}
