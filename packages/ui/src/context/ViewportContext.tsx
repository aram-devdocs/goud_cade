import React, { createContext, useContext, type ReactNode } from 'react';
import { useViewport, type ViewportInfo } from '../hooks/useViewport';

const ViewportContext = createContext<ViewportInfo | null>(null);

export interface ViewportProviderProps {
  children: ReactNode;
}

export function ViewportProvider({ children }: ViewportProviderProps) {
  const viewport = useViewport();

  return (
    <ViewportContext.Provider value={viewport}>
      {children}
    </ViewportContext.Provider>
  );
}

export function useViewportContext(): ViewportInfo {
  const context = useContext(ViewportContext);

  if (context === null) {
    throw new Error('useViewportContext must be used within a ViewportProvider');
  }

  return context;
}

export function useOptionalViewportContext(): ViewportInfo | null {
  return useContext(ViewportContext);
}
