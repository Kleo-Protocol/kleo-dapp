import { ReactNode } from 'react';
import { Button } from '@/shared/ui/button';
import { useMapAccount } from '@/features/auth/hooks/use-map-account';

export interface MapAccountButtonProps {
  onSuccess?: () => void;
  size?: 'default' | 'sm' | 'lg' | 'icon';
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  children?: ReactNode;
  refresh?: () => Promise<void>;
}

export default function MapAccountButton({
  onSuccess,
  size = 'sm',
  variant = 'default',
  children = 'Map Account',
}: MapAccountButtonProps) {
  const { isLoading, isDisabled, handleMapAccount } = useMapAccount(onSuccess);

  return (
    <Button size={size} variant={variant} disabled={isDisabled} onClick={handleMapAccount}>
      {isLoading ? 'Mapping...' : children}
    </Button>
  );
}
