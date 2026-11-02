'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useLanguage } from '@/lib/language-context';

export function SplashScreen() {
  const { t } = useLanguage();
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-background via-background to-muted/40 flex items-center justify-center z-50">
      <div className="flex flex-col items-center gap-6">
        {/* Glowing Logo Container */}
        <div className="relative w-40 h-40 flex items-center justify-center">
          {/* Animated outer ring 1 */}
          <div className="absolute inset-0 rounded-full border-2 border-primary/40 animate-pulse" />

          {/* Animated outer ring 2 */}
          <div className="absolute inset-0 rounded-full border-2 border-primary/20" style={{
            animation: 'ring-expand 2s ease-out infinite'
          }} />

          {/* Main glow effect */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary via-primary/50 to-primary/20 blur-xl opacity-60 animate-pulse" />

          {/* Center circle with logo */}
          <div className="relative z-10 bg-card rounded-full shadow-2xl flex items-center justify-center animate-glow p-4">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/images-HWyGW5Gv6zzT9GZWCFVYMEMCWqRHZz.png"
              alt="INT App Logo"
              width={120}
              height={120}
              priority
              loading="eager"
            />
          </div>
        </div>

        {/* Loading Text */}
        <div className="flex flex-col items-center gap-3">
          <h1 className="text-2xl font-bold text-foreground">INT App</h1>
            <p className="text-sm text-muted-foreground">{t('Academic Management System')}</p>

          {/* Loading dots */}
          <div className="flex gap-1 mt-2">
            <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    </div>
  );
}
