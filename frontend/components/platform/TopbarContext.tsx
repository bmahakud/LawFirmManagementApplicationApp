'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';

interface TopbarMeta {
  title: string;
  sub: string;
}

interface TopbarContextValue {
  dynamic: TopbarMeta | null;
  setDynamic: (meta: TopbarMeta | null) => void;
}

const TopbarContext = createContext<TopbarContextValue>({
  dynamic: null,
  setDynamic: () => {},
});

export function TopbarProvider({ children }: { children: ReactNode }) {
  const [dynamic, setDynamicState] = useState<TopbarMeta | null>(null);

  const setDynamic = useCallback((meta: TopbarMeta | null) => {
    setDynamicState(meta);
  }, []);

  return (
    <TopbarContext.Provider value={{ dynamic, setDynamic }}>
      {children}
    </TopbarContext.Provider>
  );
}

export function useTopbar() {
  return useContext(TopbarContext);
}

/**
 * Drop this hook inside any client component to push a dynamic title
 * into the topbar. Clears itself automatically on unmount.
 *
 * Usage:
 *   useTopbarTitle('State vs Mehta', 'Case detail view');
 */
export function useTopbarTitle(title: string, sub: string) {
  const { setDynamic } = useTopbar();

  useEffect(() => {
    if (title) {
      setDynamic({ title, sub });
    }
    return () => {
      setDynamic(null);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, sub]);
}
