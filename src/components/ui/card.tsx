import * as React from 'react';
import { cn } from '@/lib/utils';

// export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
//   return (
//     <div
//       className={cn('rounded-lg border border-border/40 ring-1 ring-inset ring-white/5 bg-card text-card-foreground shadow-sm', className)}
//       {...props}
//     />
//   );
// }
export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        `
        relative
        rounded-xl
        border border-border/50 ring-1 ring-inset ring-white/10
        bg-card
        text-card-foreground
        shadow-sm 
        backdrop-blur-sm

        before:absolute before:top-2 before:left-2
        before:h-5 before:w-5
        before:border-t-2 before:border-l-2
        before:border-border/90
        before:content-['']

        after:absolute after:bottom-2 after:right-2
        after:h-5 after:w-5
        after:border-b-2 after:border-r-2
        after:border-border/90
        after:content-['']

        before:animate-cornerGlow
        after:animate-cornerGlow
        `,
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn('text-2xl font-semibold leading-none tracking-tight', className)}
      {...props}
    />
  );
}

export function CardDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-sm text-muted-foreground', className)} {...props} />;
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-6 pt-0', className)} {...props} />;
}

export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex items-center p-6 pt-0', className)} {...props} />;
}
