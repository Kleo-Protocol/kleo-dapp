import { ReactNode } from 'react';
import { Button } from '@/shared/ui/button';
import { useMapAccount } from '@/features/auth/hooks/use-map-account';

export interface MapAccountButtonProps {
  onSuccess?: () => void;
  size?: 'default' | 'sm' | 'lg' | 'icon';
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost' | 'danger';
  children?: ReactNode;
  refresh?: () => Promise<void>;
}

export default function MapAccountButton({
  onSuccess,
  size = 'sm',
  variant = 'primary',
  children = 'Map Account',
}: MapAccountButtonProps) {
  const { isLoading, isDisabled, handleMapAccount } = useMapAccount(onSuccess);

  return (
    <Button size={size} variant={variant} disabled={isDisabled} onClick={handleMapAccount}>
      {isLoading ? 'Mapping...' : children}
    </Button>
  );
}
