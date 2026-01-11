'use client';

import { useDashboard } from '@/features/auth/hooks/use-dashboard';
import { PersonalDashboard } from './personal-dashboard';

export function DashboardContent() {
  const { shouldShowContent } = useDashboard();

  if (!shouldShowContent) {
    return (
      <div className="py-16 text-center text-muted-foreground">
        Preparing your dashboard...
      </div>
    );
  }

  return <PersonalDashboard />;
}
