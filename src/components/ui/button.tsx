import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background cursor-pointer",
  {
    variants: {
      variant: {
        primary: 'bg-slate-900 text-white shadow-sm hover:bg-slate-800 focus-visible:ring-slate-900 active:bg-slate-950',
        secondary: 'bg-slate-100 text-slate-900 border border-slate-200 shadow-sm hover:bg-slate-50 focus-visible:ring-slate-400 active:bg-slate-200',
        ghost: 'text-slate-700 hover:bg-slate-100 focus-visible:ring-slate-400 active:bg-slate-200',
        danger: 'bg-red-600 text-white shadow-sm hover:bg-red-700 focus-visible:ring-red-600 active:bg-red-800',
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
