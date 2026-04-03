import type { AppPaletteMode } from '@/theme/types';
import { useAppTheme } from '@/theme';
import PageHeader from '../../components/PageHeader.tsx';
import { useTranslation } from 'react-i18next';
import i18next from 'i18next';
import { useContext, useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { ColorModeContext } from '../../providers/MyFinThemeProvider.tsx';
import UserStatList from './UserStatList.tsx';
import Utilities from './Utilities.tsx';
import ChangePasswordForm from './ChangePasswordForm.tsx';
import { useUserData } from '../../providers/UserProvider.tsx';
import ChangeCurrencyForm from './ChangeCurrencyForm.tsx';
import { Card } from '@/common/shadcn/ui/card.tsx';
import { RadioGroup, RadioGroupItem } from '@/common/shadcn/ui/radio-group.tsx';
import { Label } from '@/common/shadcn/ui/label.tsx';
import { Separator } from '@/common/shadcn/ui/separator.tsx';
import { cn } from '@/common/shadcn/lib/utils';

const Profile = () => {
  const theme = useAppTheme();
  const { t } = useTranslation();
  const colorMode = useContext(ColorModeContext);
  const [language, setLanguage] = useState(i18next.resolvedLanguage || 'en');
  const [currentTheme, setTheme] = useState<AppPaletteMode>(
    theme.palette.mode || 'dark',
  );
  const { partiallyUpdateUserSessionData, userSessionData } = useUserData();

  useEffect(() => {
    colorMode.setColorMode(currentTheme);
  }, [currentTheme]);

  useEffect(() => {
    i18next.changeLanguage(language);
    partiallyUpdateUserSessionData({ language });
  }, [language]);

  const sectionSurface = cn(
    'w-full max-w-[700px] rounded-lg border',
    theme.palette.mode === 'dark' ? 'bg-card' : 'bg-background',
  );

  return (
    <>
      <Card className="m-4 p-4 shadow-none">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <PageHeader
            title={t('profile.profileManagement')}
            subtitle={t('profile.strapLine')}
          />
        </div>
        <div className="mt-4 flex flex-col items-start gap-2">
          <details className={cn('group', sectionSurface)} open>
            <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 [&::-webkit-details-marker]:hidden">
              <ChevronDown className="size-4 shrink-0 transition-transform group-open:rotate-180" />
              <div className="grid flex-1 gap-1 sm:grid-cols-2">
                <span className="font-medium">
                  {t('profile.changeLanguage')}
                </span>
                <span className="text-muted-foreground text-sm">
                  {t('profile.changeLanguageStrapLine')}
                </span>
              </div>
            </summary>
            <div className="border-t px-4 pb-4 pt-2">
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
            </div>
          </details>

          <details className={cn('group', sectionSurface)} open>
            <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 [&::-webkit-details-marker]:hidden">
              <ChevronDown className="size-4 shrink-0 transition-transform group-open:rotate-180" />
              <div className="grid flex-1 gap-1 sm:grid-cols-2">
                <span className="font-medium">
                  {t('profile.changeCurrency')}
                </span>
                <span className="text-muted-foreground text-sm">
                  {t('profile.changeCurrencyStrapline')}
                </span>
              </div>
            </summary>
            <div className="border-t px-4 pb-4 pt-2">
              <ChangeCurrencyForm />
            </div>
          </details>

          <details className={cn('group', sectionSurface)} open>
            <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 [&::-webkit-details-marker]:hidden">
              <ChevronDown className="size-4 shrink-0 transition-transform group-open:rotate-180" />
              <div className="grid flex-1 gap-1 sm:grid-cols-2">
                <span className="font-medium">{t('profile.changeTheme')}</span>
                <span className="text-muted-foreground text-sm">
                  {t('profile.changeThemeStrapLine')}
                </span>
              </div>
            </summary>
            <div className="border-t px-4 pb-4 pt-2">
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
            </div>
          </details>

          <details className={cn('group', sectionSurface)} open>
            <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 [&::-webkit-details-marker]:hidden">
              <ChevronDown className="size-4 shrink-0 transition-transform group-open:rotate-180" />
              <div className="grid flex-1 gap-1 sm:grid-cols-2">
                <span className="font-medium">
                  {t('profile.changePassword')}
                </span>
                <span className="text-muted-foreground text-sm">
                  {t('profile.changePasswordStrapLine')}
                </span>
              </div>
            </summary>
            <div className="border-t px-4 pb-4 pt-2">
              <ChangePasswordForm />
            </div>
          </details>

          <details className={cn('group', sectionSurface)} open>
            <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 [&::-webkit-details-marker]:hidden">
              <ChevronDown className="size-4 shrink-0 transition-transform group-open:rotate-180" />
              <div className="grid flex-1 gap-1 sm:grid-cols-2">
                <span className="font-medium">{t('profile.tools')}</span>
                <span className="text-muted-foreground text-sm">
                  {t('profile.toolsStrapLine')}
                </span>
              </div>
            </summary>
            <div className="border-t px-4 pb-4 pt-2">
              <Utilities />
            </div>
          </details>

          <details className={cn('group', sectionSurface)} open>
            <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 [&::-webkit-details-marker]:hidden">
              <ChevronDown className="size-4 shrink-0 transition-transform group-open:rotate-180" />
              <div className="grid flex-1 gap-1 sm:grid-cols-2">
                <span className="font-medium">
                  {t('profile.statsForNerds')}
                </span>
                <span className="text-muted-foreground text-sm">
                  {t('profile.statsForNerdsStrapLine')}
                </span>
              </div>
            </summary>
            <div className="border-t px-4 pb-4 pt-2">
              <UserStatList />
            </div>
          </details>
        </div>
      </Card>
      <div className="flex justify-center px-4 pb-6">
        <div className="text-muted-foreground flex flex-row flex-wrap items-center justify-center gap-2 text-xs">
          <span>
            {t('profile.version')}:{' '}
            <a
              href="https://github.com/afaneca/myfin/releases"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline-offset-4 hover:underline"
            >
              {import.meta.env.PACKAGE_VERSION}
            </a>
          </span>
          <Separator orientation="vertical" className="h-4" />
          <span>
            API:{' '}
            <a
              href="https://github.com/afaneca/myfin-api/releases"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline-offset-4 hover:underline"
            >
              {userSessionData?.apiVersion || '-'}
            </a>
          </span>
        </div>
      </div>
    </>
  );
};

export default Profile;
