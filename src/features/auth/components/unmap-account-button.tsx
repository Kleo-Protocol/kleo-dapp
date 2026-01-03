'use client';

import { ReactNode } from 'react';
import { Button } from '@/shared/ui/button';
import { useUnmapAccount } from '@/features/auth/hooks/use-unmap-account';

export interface UnmapAccountButtonProps {
  onSuccess?: () => void;
  size?: 'default' | 'sm' | 'lg' | 'icon';
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost' | 'danger';
  children?: ReactNode;
  refresh?: () => Promise<void>;
}

export default function UnmapAccountButton({
  onSuccess,
  size = 'sm',
  variant = 'primary',
  children = 'Unmap Account',
}: UnmapAccountButtonProps) {
  const { isLoading, isDisabled, handleUnmapAccount } = useUnmapAccount(onSuccess);

  return (
    <Button size={size} variant={variant} disabled={isDisabled} onClick={handleUnmapAccount}>
      {isLoading ? 'Unmapping...' : children}
    </Button>
  );
}
