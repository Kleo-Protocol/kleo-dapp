'use client';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Loader2 } from 'lucide-react';
import { useUserRoleSelection } from '@/features/auth/hooks/use-user-role-selection';

export function UserRoleSelectionModal() {
  const { shouldShowModal, shouldRender, isRegistering, error, handleRoleSelection } = useUserRoleSelection();

  if (!shouldRender) {
    return null;
  }

  return (
    <Dialog open={shouldShowModal} onOpenChange={() => {}}>
      <DialogContent showCloseButton={false} className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>Welcome to Kleo Protocol</DialogTitle>
          <DialogDescription>Choose your role to get started with Kleo Protocol</DialogDescription>
        </DialogHeader>

        {error && <div className='rounded-md bg-destructive/10 p-3 text-sm text-destructive'>{error}</div>}

        <div className='flex flex-col gap-3 py-4'>
          <Button
            onClick={() => handleRoleSelection('lender')}
            disabled={isRegistering}
            size='lg'
            className='w-full h-16 text-base'
            variant='secondary'>
            {isRegistering ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Registering...
              </>
            ) : (
              'Continue as Lender'
            )}
          </Button>

          <Button
            onClick={() => handleRoleSelection('borrower')}
            disabled={isRegistering}
            size='lg'
            className='w-full h-16 text-base'
            variant='secondary'>
            {isRegistering ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Registering...
              </>
            ) : (
              'Continue as Borrower'
            )}
          </Button>
        </div>

        <p className='text-xs text-center text-muted-foreground'>You can change your role later in settings</p>
      </DialogContent>
    </Dialog>
  );
}
