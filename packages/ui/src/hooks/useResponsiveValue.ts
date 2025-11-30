import { useMemo } from 'react';
import { useViewport, type ViewportInfo } from './useViewport';

export interface ResponsiveConfig<T> {
  mobile?: T;
  tablet?: T;
  desktop?: T;
  portrait?: T;
  landscape?: T;
  mobilePortrait?: T;
  mobileLandscape?: T;
  tabletPortrait?: T;
  tabletLandscape?: T;
  default: T;
}

export function useResponsiveValue<T>(config: ResponsiveConfig<T>): T {
  const viewport = useViewport();

  return useMemo(() => {
    return getResponsiveValue(config, viewport);
  }, [
    config,
    viewport.deviceType,
    viewport.orientation,
  ]);
}

export function getResponsiveValue<T>(
  config: ResponsiveConfig<T>,
  viewport: ViewportInfo
): T {
  const { deviceType, orientation } = viewport;

  // Most specific: device + orientation combination
  if (deviceType === 'mobile' && orientation === 'portrait' && config.mobilePortrait !== undefined) {
    return config.mobilePortrait;
  }
  if (deviceType === 'mobile' && orientation === 'landscape' && config.mobileLandscape !== undefined) {
    return config.mobileLandscape;
  }
  if (deviceType === 'tablet' && orientation === 'portrait' && config.tabletPortrait !== undefined) {
    return config.tabletPortrait;
  }
  if (deviceType === 'tablet' && orientation === 'landscape' && config.tabletLandscape !== undefined) {
    return config.tabletLandscape;
  }

  // Device type specific
  if (deviceType === 'mobile' && config.mobile !== undefined) {
    return config.mobile;
  }
  if (deviceType === 'tablet' && config.tablet !== undefined) {
    return config.tablet;
  }
  if (deviceType === 'desktop' && config.desktop !== undefined) {
    return config.desktop;
  }

  // Orientation specific
  if (orientation === 'portrait' && config.portrait !== undefined) {
    return config.portrait;
  }
  if (orientation === 'landscape' && config.landscape !== undefined) {
    return config.landscape;
  }

  // Fallback
  return config.default;
}
