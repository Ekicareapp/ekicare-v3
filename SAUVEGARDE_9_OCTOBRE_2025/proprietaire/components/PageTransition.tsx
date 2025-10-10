'use client';

import { ReactNode } from 'react';

interface PageTransitionProps {
  children: ReactNode;
}

export default function PageTransition({ children }: PageTransitionProps) {
  return (
    <div className="animate-in fade-in-0 duration-300">
      {children}
    </div>
  );
}
