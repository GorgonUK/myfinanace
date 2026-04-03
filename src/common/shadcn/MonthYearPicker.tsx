import dayjs, { type Dayjs } from 'dayjs';
import { Label } from '@/common/shadcn/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/common/shadcn/ui/select';
import { cn } from '@/common/shadcn/lib/utils';

export type MonthYearPickerProps = {
  value: Dayjs;
  onChange: (next: Dayjs) => void;
  label?: string;
  className?: string;
  /** Inclusive year range (defaults around current year). */
  fromYear?: number;
  toYear?: number;
};

export function MonthYearPicker({
  value,
  onChange,
  label,
  className,
  fromYear,
  toYear,
}: MonthYearPickerProps) {
  const y = value.year();
  const m = value.month() + 1;
  const now = new Date().getFullYear();
  const start = fromYear ?? now - 15;
  const end = toYear ?? now + 10;
  const years = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const monthIndex = i;
    return {
      value: String(monthIndex + 1),
      label: dayjs().month(monthIndex).format('MMMM'),
    };
  });

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label ? (
        <Label className="text-muted-foreground">{label}</Label>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Select
          value={String(m)}
          onValueChange={(v) => {
            const month = Number.parseInt(v, 10);
            onChange(value.month(month - 1).year(y));
          }}
        >
          <SelectTrigger className="min-w-[10rem] flex-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {monthOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={String(y)}
          onValueChange={(v) => {
            const year = Number.parseInt(v, 10);
            onChange(value.year(year));
          }}
        >
          <SelectTrigger className="min-w-[6rem] w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {years.map((year) => (
              <SelectItem key={year} value={String(year)}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
