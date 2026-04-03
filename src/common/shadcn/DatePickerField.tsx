import dayjs, { type Dayjs } from 'dayjs';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/common/shadcn/ui/button';
import { Calendar } from '@/common/shadcn/ui/calendar';
import { Label } from '@/common/shadcn/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/common/shadcn/ui/popover';
import { cn } from '@/common/shadcn/lib/utils';

export type DatePickerFieldProps = {
  value: Dayjs | null;
  onChange: (next: Dayjs | null) => void;
  label?: string;
  /** dayjs format string, default DD/MM/YYYY */
  format?: string;
  required?: boolean;
  disabled?: boolean;
  id?: string;
  name?: string;
  className?: string;
  placeholder?: string;
};

export function DatePickerField({
  value,
  onChange,
  label,
  format = 'DD/MM/YYYY',
  required,
  disabled,
  id,
  name,
  className,
  placeholder,
}: DatePickerFieldProps) {
  const selected = value?.isValid() ? value.toDate() : undefined;

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label ? (
        <Label htmlFor={id} className="text-muted-foreground">
          {label}
          {required ? ' *' : ''}
        </Label>
      ) : null}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id={id}
            name={name}
            type="button"
            variant="outline"
            disabled={disabled}
            className={cn(
              'h-12 w-full justify-start text-left font-normal',
              !value?.isValid() && 'text-muted-foreground',
            )}
            aria-required={required}
          >
            <CalendarIcon className="mr-2 size-4 shrink-0 opacity-70" />
            {value?.isValid() ? (
              value.format(format)
            ) : (
              <span>{placeholder ?? '—'}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selected}
            defaultMonth={selected ?? new Date()}
            onSelect={(date) => {
              onChange(date ? dayjs(date) : null);
            }}
            disabled={disabled}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
