'use client';

import { Suspense } from 'react';
import { TypinkIntro } from '@/shared/components/typink-intro';
import { useDashboard } from '@/features/auth/hooks/use-dashboard';

function DashboardContent() {
  const { userRole, shouldShowContent } = useDashboard();

  if (!shouldShowContent) {
    return (
      <div className='py-16 text-center text-muted-foreground'>
        Preparing your dashboard...
      </div>
    );
  }

  // Mostrar dashboard normal
  return (
    <div>
      <TypinkIntro />
      {userRole && (
        <div className='mt-4 text-center text-sm text-muted-foreground'>
          Role: <span className='font-semibold capitalize'>{userRole}</span>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className='py-16 text-center text-muted-foreground'>
        Loading dashboard...
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
