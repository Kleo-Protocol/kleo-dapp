'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useUpdateIncomeReference } from '@/hooks/use-profile';
import { FileText, Save, Info } from 'lucide-react';
import { toast } from 'sonner';
import type { Profile } from '@/services/mock/profile.mock';

interface IncomeReferenceFormProps {
  profile: Profile | undefined;
  isLoading: boolean;
  walletAddress: string | undefined;
}

export function IncomeReferenceForm({ profile, isLoading, walletAddress }: IncomeReferenceFormProps) {
  const [incomeRef, setIncomeRef] = useState('');
  const updateIncomeRef = useUpdateIncomeReference();

  useEffect(() => {
    if (profile?.incomeReference) {
      setIncomeRef(profile.incomeReference);
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletAddress) {
      toast.error('Wallet not connected', {
        description: 'Please connect your wallet to update income reference',
      });
      return;
    }

    updateIncomeRef.mutate(
      {
        walletAddress,
        incomeReference: incomeRef.trim() || null,
      },
      {
        onSuccess: () => {
          toast.success('Income reference updated', {
            description: incomeRef.trim()
              ? 'Your income reference has been saved'
              : 'Income reference has been removed',
          });
        },
        onError: () => {
          toast.error('Update failed', {
            description: 'Failed to update income reference. Please try again.',
          });
        },
      }
    );
  };

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
              disabled={updateIncomeRef.isPending || !walletAddress}
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
            disabled={updateIncomeRef.isPending || !walletAddress}
            className="gap-2"
          >
            <Save className="size-4" />
            {updateIncomeRef.isPending ? 'Saving...' : 'Save Reference'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

