import type { AppPaletteMode } from '@/theme/types';
import { useTranslation } from 'react-i18next';
import { useContext, useEffect, useState } from 'react';
import { ChevronsRight } from 'lucide-react';
import i18next from 'i18next';
import { ColorModeContext } from '../../providers/MyFinThemeProvider.tsx';
import { useUserData } from '../../providers/UserProvider.tsx';
import { CURRENCIES, Currency } from '@/config/Currency.ts';
import { Button } from '@/common/shadcn/ui/button.tsx';
import { Label } from '@/common/shadcn/ui/label.tsx';
import { Separator } from '@/common/shadcn/ui/separator.tsx';
import { RadioGroup, RadioGroupItem } from '@/common/shadcn/ui/radio-group.tsx';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/common/shadcn/ui/select.tsx';

export type Props = {
  onNext: (currency: Currency) => void;
};

const currencyOptions = Object.values(CURRENCIES);

const SetupStep0 = (props: Props) => {
  const { t } = useTranslation();

  const colorMode = useContext(ColorModeContext);
  const { partiallyUpdateUserSessionData } = useUserData();

  const [language, setLanguage] = useState(i18next.resolvedLanguage || 'en');
  const [currentTheme, setTheme] = useState<AppPaletteMode>(() => {
    if (typeof document === 'undefined') return 'dark';
    return document.documentElement.classList.contains('dark')
      ? 'dark'
      : 'light';
  });

  const [currency, setCurrency] = useState<Currency>(CURRENCIES.EUR);

  useEffect(() => {
    colorMode.setColorMode(currentTheme);
  }, [currentTheme]);

  useEffect(() => {
    i18next.changeLanguage(language);
    partiallyUpdateUserSessionData({ language });
  }, [language]);

  return (
    <div className="p-1">
      <div className="flex flex-col gap-4">
        <p className="text-base">{t('setup.step0Description')}</p>
        <h2 className="pt-8 text-lg font-bold">🌐 {t('common.language')}</h2>
        <Separator className="my-2" />
        <RadioGroup
          value={language}
          onValueChange={setLanguage}
          className="gap-3"
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem value="pt" id="lang-pt" />
            <Label htmlFor="lang-pt">Português (pt-PT)</Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="en" id="lang-en" />
            <Label htmlFor="lang-en">English</Label>
          </div>
        </RadioGroup>
        <h2 className="pt-8 text-lg font-bold">🎨 {t('common.theme')}</h2>
        <Separator className="my-2" />
        <RadioGroup
          value={currentTheme}
          onValueChange={(v) => setTheme(v as AppPaletteMode)}
          className="gap-3"
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem value="light" id="theme-light" />
            <Label htmlFor="theme-light">{t('profile.lightTheme')}</Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="dark" id="theme-dark" />
            <Label htmlFor="theme-dark">{t('profile.darkTheme')}</Label>
          </div>
        </RadioGroup>
        <h2 className="pt-8 text-lg font-bold">🪙 {t('common.currency')}</h2>
        <Separator className="my-2" />
        <div className="mb-4 mt-2 space-y-2">
          <Label>{t('common.currency')}</Label>
          <Select
            value={currency.code}
            onValueChange={(code) => {
              const next = currencyOptions.find((c) => c.code === code);
              if (next) setCurrency(next);
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {currencyOptions.map((option) => (
                <SelectItem key={option.code} value={option.code}>
                  {option.name} ({option.symbol}/{option.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="mt-4 flex justify-center">
          <Button
            size="lg"
            className="gap-2"
            onClick={() => props.onNext(currency)}
          >
            {t('common.next')}
            <ChevronsRight className="size-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SetupStep0;
