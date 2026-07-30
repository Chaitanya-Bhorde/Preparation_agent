import { useEffect } from 'react';

export function usePageTitle(title) {
  useEffect(() => {
    const prev = document.title;
    document.title = title ? `${title} | PrepAgent` : 'PrepAgent';
    return () => {
      document.title = prev;
    };
  }, [title]);
}