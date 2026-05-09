import { createContext, useContext, useEffect, useState } from 'react';

type DesignVersion = 'v1' | 'v2' | 'v3';

interface DesignVersionContextType {
  version: DesignVersion;
  toggleVersion: () => void;
}

const DesignVersionContext = createContext<DesignVersionContextType | undefined>(undefined);

const STORAGE_KEY = 'design-version';

const NEXT_VERSION: Record<DesignVersion, DesignVersion> = {
  v1: 'v2',
  v2: 'v3',
  v3: 'v1',
};

export function DesignVersionProvider({ children }: { children: React.ReactNode }) {
  const [version, setVersion] = useState<DesignVersion>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'v2' || stored === 'v3') return stored;
    return 'v1';
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('design-v2', 'design-v3');
    if (version === 'v2') {
      root.classList.add('design-v2');
    } else if (version === 'v3') {
      root.classList.add('design-v3');
    }
    localStorage.setItem(STORAGE_KEY, version);
  }, [version]);

  const toggleVersion = () => {
    setVersion(prev => NEXT_VERSION[prev]);
  };

  return (
    <DesignVersionContext.Provider value={{ version, toggleVersion }}>
      {children}
    </DesignVersionContext.Provider>
  );
}

export function useDesignVersion() {
  const context = useContext(DesignVersionContext);
  if (!context) {
    return { version: 'v1' as DesignVersion, toggleVersion: () => {} };
  }
  return context;
}
