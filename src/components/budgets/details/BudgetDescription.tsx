import { useAppTheme } from '@/theme';
import { useTranslation } from 'react-i18next';
import { forwardRef, MutableRefObject, Ref, useState } from 'react';
import {
  FileText,
  SmilePlus,
} from 'lucide-react';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
import i18next from 'i18next';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { cn } from '@/common/shadcn/lib/utils';
import { Label } from '@/common/shadcn/ui/label.tsx';
import { Button } from '@/common/shadcn/ui/button.tsx';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/common/shadcn/ui/tooltip.tsx';

const BudgetDescription = forwardRef(({}, ref: Ref<HTMLTextAreaElement>) => {
  const theme = useAppTheme();
  const { t } = useTranslation();
  const matchesSmScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const [isEmojiPickerOpen, setEmojiPickerOpen] = useState(false);

  const handleEmojiAdded = (emojiText: string) => {
    const input = (ref as MutableRefObject<HTMLTextAreaElement>)?.current;
    if (input) {
      input.focus();
      const start = input.selectionStart || 0;
      const end = input.selectionEnd || 0;

      input.value =
        input.value.substring(0, start) +
        emojiText +
        input.value.substring(end);

      input.selectionStart = input.selectionEnd = start + emojiText.length;
      setEmojiPickerOpen(false);
    }
  };

  return (
    <div className="relative">
      <Label htmlFor="description" className="sr-only">
        {t('common.description')}
      </Label>
      <div className="relative">
        <FileText className="text-muted-foreground pointer-events-none absolute left-3 top-3 size-4" />
        <textarea
          ref={ref}
          required
          id="description"
          name="description"
          placeholder={t('common.description')}
          rows={3}
          className={cn(
            'border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[80px] w-full rounded-md border px-3 py-2 pl-10 pr-12 text-sm',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          )}
        />
        <div className="absolute right-1 top-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-9 shrink-0"
                aria-label="Emojis"
                onClick={() => setEmojiPickerOpen(!isEmojiPickerOpen)}
              >
                {!matchesSmScreen ? (
                  <SmilePlus className="text-primary size-5" />
                ) : null}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Emojis</TooltipContent>
          </Tooltip>
        </div>
      </div>
      {isEmojiPickerOpen && (
        <div className="absolute bottom-2 right-0 z-[2] max-h-[300px] translate-y-full">
          <Picker
            data={data}
            onEmojiSelect={(emoji: { native: string }) =>
              handleEmojiAdded(emoji.native)
            }
            theme={theme.palette.mode}
            locale={i18next.resolvedLanguage == 'pt' ? 'pt' : 'en'}
          />
        </div>
      )}
    </div>
  );
});
BudgetDescription.displayName = 'BudgetDescription';

export default BudgetDescription;
