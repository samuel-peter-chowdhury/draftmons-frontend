'use client';

import { AccordionTrigger } from '@/components/ui/accordion';
import { cn } from '@/lib/utils';

type Props = {
  /** Text (or any nodes) shown next to the logo */
  children: React.ReactNode;
  /** Optional logo node (lucide icon, img, svg, etc.) */
  logo?: React.ReactNode;
  /** Optional wrapper className for the trigger */
  className?: string;
  /** Optional className applied to the logo wrapper (size, color, etc.) */
  logoClassName?: string;
};

export function SectionAccordionTrigger({
  children,
  logo,
  className,
  logoClassName,
}: Props) {
  return (
    <AccordionTrigger className={cn('group text-sm font-semibold', className)}>
      <div className="flex items-center gap-2">
        {logo ? (
          <span
            className={cn(
              'inline-flex items-center justify-center transition-transform duration-500 group-data-[state=open]:rotate-[360deg]',
              logoClassName,
            )}
          >
            {logo}
          </span>
        ) : (
          <span
            className="
              h-5 w-3 rounded bg-primary
              transition-transform duration-500
              group-data-[state=open]:rotate-[360deg]
            "
          />
        )}

        <span>{children}</span>
      </div>
    </AccordionTrigger>
  );
}