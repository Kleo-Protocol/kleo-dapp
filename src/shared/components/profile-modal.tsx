'use client';

import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { User, LogOut } from 'lucide-react';
import { signOut } from '@/services/authService';
import { useSupabaseUser } from '@/hooks/useSupabaseUser';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const router = useRouter();
  const { user } = useSupabaseUser();

  const handleSignOut = async () => {
    await signOut();
    onClose();
    router.push('/signin');
  };

  const handleProfileClick = () => {
    onClose();
    router.push('/profile');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Profile</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3 py-4">
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={handleProfileClick}
          >
            <User className="h-4 w-4" />
            View Profile
          </Button>
          {user && (
            <Button
              variant="destructive"
              className="w-full justify-start gap-2"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
