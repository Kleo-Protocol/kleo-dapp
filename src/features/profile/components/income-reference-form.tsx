'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/ui/tooltip';
import { FileText, Save, Info } from 'lucide-react';
import { useIncomeReferenceForm } from '@/features/profile/hooks/use-income-reference-form';
import type { Profile } from '@/services/mock/profile.mock';

interface IncomeReferenceFormProps {
  profile: Profile | undefined;
  isLoading: boolean;
  walletAddress: string | undefined;
}

export function IncomeReferenceForm({ profile, isLoading, walletAddress }: IncomeReferenceFormProps) {
  const { incomeRef, setIncomeRef, isPending, isDisabled, handleSubmit } = useIncomeReferenceForm({
    profile,
    walletAddress,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <FileText className="size-5 text-slate-500" />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <CardTitle>Income Reference</CardTitle>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="size-4 text-slate-400 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>An income reference helps verify your ability to repay loans and can improve your borrowing capacity.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <CardDescription>Add or update your income reference for loan applications</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              type="text"
              placeholder="Enter income reference ID (e.g., REF-2024-001)"
              value={incomeRef}
              onChange={(e) => setIncomeRef(e.target.value)}
              disabled={isDisabled}
            />
            {profile?.incomeReference && (
              <p className="mt-2 text-sm text-slate-600">
                Current: <span className="font-mono">{profile.incomeReference}</span>
              </p>
            )}
          </div>
          <Button
            type="submit"
            variant="primary"
            disabled={isDisabled}
            className="gap-2"
          >
            <Save className="size-4" />
            {isPending ? 'Saving...' : 'Save Reference'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

