export { InteractionPrompt } from './InteractionPrompt';
export { GameOverlay } from './GameOverlay';

// Responsive utilities
export {
  useViewport,
  BREAKPOINTS,
  type ViewportInfo,
  type DeviceType,
  type Orientation,
  type SafeAreaInsets,
} from './hooks/useViewport';

export {
  useResponsiveValue,
  getResponsiveValue,
  type ResponsiveConfig,
} from './hooks/useResponsiveValue';

export {
  ViewportProvider,
  useViewportContext,
  useOptionalViewportContext,
  type ViewportProviderProps,
} from './context/ViewportContext';

