import { Badge } from '@/common/shadcn/ui/badge.tsx';
import { cn } from '@/common/shadcn/lib/utils';

type Props = {
  title: string;
  subtitle: string;
  titleChipText?: string;
};

const PageHeader = (props: Props) => {
  return (
    <div className="mb-[30px]">
      <div className="flex flex-row items-center gap-2">
        <h1 className="text-foreground m-0 mb-[5px] text-lg font-bold">
          {props.title}
        </h1>
        {props.titleChipText ? (
          <Badge
            variant="outline"
            className={cn(
              'border-green-600 text-green-700 dark:border-green-500 dark:text-green-400',
              'text-[0.6rem] font-normal',
            )}
            aria-label={props.titleChipText}
          >
            {props.titleChipText}
          </Badge>
        ) : null}
      </div>
      <p className="text-primary text-base">{props.subtitle}</p>
    </div>
  );
};

export default PageHeader;
