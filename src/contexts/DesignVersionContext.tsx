import { createContext, useContext, useEffect, useState } from 'react';

type DesignVersion = 'v1' | 'v2';

interface DesignVersionContextType {
  version: DesignVersion;
  toggleVersion: () => void;
}

const DesignVersionContext = createContext<DesignVersionContextType | undefined>(undefined);

const STORAGE_KEY = 'design-version';

export function DesignVersionProvider({ children }: { children: React.ReactNode }) {
  const [version, setVersion] = useState<DesignVersion>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'v2' ? 'v2' : 'v1';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (version === 'v2') {
      root.classList.add('design-v2');
    } else {
      root.classList.remove('design-v2');
    }
    localStorage.setItem(STORAGE_KEY, version);
  }, [version]);

  const toggleVersion = () => {
    setVersion(prev => (prev === 'v1' ? 'v2' : 'v1'));
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
