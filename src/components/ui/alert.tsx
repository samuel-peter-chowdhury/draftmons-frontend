import * as React from 'react';
import { cn } from '@/lib/utils';

export function Alert({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="alert"
      className={cn(
        'relative w-full rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm',
        className,
      )}
      {...props}
    />
  );
}

export function AlertTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h5 className={cn('mb-1 font-semibold text-destructive-foreground', className)} {...props} />
  );
}

export function AlertDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return <div className={cn('text-destructive-foreground/90', className)} {...props} />;
}
