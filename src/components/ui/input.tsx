import * as React from 'react';

import { cn } from '@/lib/utils';

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot='input'
      className={cn(
        'flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400',
        'transition-colors duration-200',
        'file:border-0 file:bg-transparent file:text-sm file:font-medium',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 focus-visible:border-slate-400',
        'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-slate-50',
        'aria-invalid:border-red-300 aria-invalid:ring-red-200',
        className,
      )}
      {...props}
    />
  );
}

export { Input };
