import { useEffect } from 'react';

export const usePageTitle = (pageTitle?: string) => {
  useEffect(() => {
    const title = pageTitle ? `${pageTitle} | SUMULASYS | ORANGE` : 'SUMULASYS | ORANGE';
    document.title = title;
    
    // Cleanup
    return () => {
      document.title = 'SUMULASYS | ORANGE';
    };
  }, [pageTitle]);
};
