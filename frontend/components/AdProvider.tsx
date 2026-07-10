'use client';

// ── POPUNDER ADS DISABLED — get traffic first, monetize later ──
// To re-enable: uncomment the code below and remove the early return.

import useSWR from 'swr';
// import { useEffect } from 'react';
// import { usePathname } from 'next/navigation';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function AdProvider() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { data: limits } = useSWR('/api/user/limits', fetcher);
  // const isFree = !limits || !limits.isPro;
  // const pathname = usePathname();

  // // Only load popunder ads on the marketing homepage for free users.
  // // These scripts attach global click listeners that hijack ANY click on the
  // // page — so we must NOT load them on the dashboard or other app pages where
  // // users need to click buttons/inputs without being redirected to ads.
  // const isHomepage = pathname === '/';

  // useEffect(() => {
  //   if (!isFree || !isHomepage) return;

  //   const script1 = document.createElement('script');
  //   script1.src = 'https://degreeeruptionpredator.com/37/3d/a1/373da11a439d7ecf8f459267ea2961d5.js';
  //   script1.async = true;
  //   script1.id = 'adsterra-popunder-1';

  //   const script2 = document.createElement('script');
  //   script2.src = 'https://degreeeruptionpredator.com/a4/8d/47/a48d47003a42d6645fb07f3c1380d7aa.js';
  //   script2.async = true;
  //   script2.id = 'adsterra-popunder-2';

  //   document.body.appendChild(script1);
  //   document.body.appendChild(script2);

  //   return () => {
  //     const s1 = document.getElementById('adsterra-popunder-1');
  //     const s2 = document.getElementById('adsterra-popunder-2');
  //     if (s1 && document.body.contains(s1)) document.body.removeChild(s1);
  //     if (s2 && document.body.contains(s2)) document.body.removeChild(s2);
  //   };
  // }, [isFree, isHomepage]);

  return null;
}
