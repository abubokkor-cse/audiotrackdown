'use client';

import useSWR from 'swr';
import { useEffect } from 'react';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function AdProvider() {
  const { data: limits } = useSWR('/api/user/limits', fetcher);
  const isFree = !limits || !limits.isPro;

  useEffect(() => {
    if (isFree) {
      const script1 = document.createElement('script');
      script1.src = 'https://degreeeruptionpredator.com/37/3d/a1/373da11a439d7ecf8f459267ea2961d5.js';
      script1.async = true;
      script1.id = 'adsterra-popunder-1';

      const script2 = document.createElement('script');
      script2.src = 'https://degreeeruptionpredator.com/a4/8d/47/a48d47003a42d6645fb07f3c1380d7aa.js';
      script2.async = true;
      script2.id = 'adsterra-popunder-2';

      document.body.appendChild(script1);
      document.body.appendChild(script2);

      return () => {
        const s1 = document.getElementById('adsterra-popunder-1');
        const s2 = document.getElementById('adsterra-popunder-2');
        if (s1 && document.body.contains(s1)) document.body.removeChild(s1);
        if (s2 && document.body.contains(s2)) document.body.removeChild(s2);
      };
    }
  }, [isFree]);

  return null;
}
