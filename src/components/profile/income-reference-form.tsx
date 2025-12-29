'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useUpdateIncomeReference } from '@/hooks/use-profile';
import { FileText, Save } from 'lucide-react';
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
    if (!walletAddress) return;

    updateIncomeRef.mutate({
      walletAddress,
      incomeReference: incomeRef.trim() || null,
    });
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
          <div>
            <CardTitle>Income Reference</CardTitle>
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

