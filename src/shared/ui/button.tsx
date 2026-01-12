import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background cursor-pointer",
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 focus-visible:ring-ring active:bg-primary/80',
        secondary: 'bg-secondary text-secondary-foreground border border-border shadow-sm hover:border-atomic-tangerine/50 hover:bg-atomic-tangerine/15 focus-visible:ring-ring active:bg-atomic-tangerine/25',
        accent: 'bg-accent text-accent-foreground shadow-sm hover:bg-accent/90 focus-visible:ring-amber-honey active:bg-accent/80',
        ghost: 'text-foreground hover:bg-atomic-tangerine/10 hover:text-atomic-tangerine focus-visible:ring-ring active:bg-atomic-tangerine/20',
        danger: 'bg-destructive text-white shadow-sm hover:bg-destructive/90 focus-visible:ring-destructive active:bg-destructive/80',
      },
      size: {
        default: 'h-10 px-4 py-2 text-sm',
        sm: 'h-8 px-3 py-1.5 text-sm',
        lg: 'h-12 px-6 py-3 text-base',
        icon: 'size-10 p-0',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : 'button';

  return <Comp data-slot='button' className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

export { Button, buttonVariants };
