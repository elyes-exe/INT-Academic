'use client';

import { Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/lib/language-context';

export function LanguageToggle() {
  const { language, setLanguage, t } = useLanguage();
  const nextLanguage = language === 'en' ? 'fr' : 'en';
  const label = nextLanguage === 'fr' ? 'Switch to French' : 'Switch to English';

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="gap-2 px-2 text-foreground"
      onClick={() => setLanguage(nextLanguage)}
      aria-label={t(label)}
      title={t(label)}
      aria-pressed={language === 'fr'}
    >
      <Languages className="h-4 w-4" aria-hidden="true" />
      <span>{nextLanguage.toUpperCase()}</span>
    </Button>
  );
}
