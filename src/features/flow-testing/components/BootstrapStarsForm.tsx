'use client';

import { useState } from 'react';
import { useBootstrapStars } from '@/features/flow-testing/hooks/use-bootstrap-stars';
import { useTypink } from 'typink';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Button } from '@/shared/ui/button';
import { AlertCircle } from 'lucide-react';

/**
 * Form component to bootstrap stars for test accounts (admin function)
 * Used in Analytics tab for pool creators
 */
export function BootstrapStarsForm() {
  const { connectedAccount } = useTypink();
  const { setStars } = useBootstrapStars();
  const [userAddress, setUserAddress] = useState('');
  const [stars, setStarsValue] = useState('');
  const [isSetting, setIsSetting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!userAddress || !stars) {
      setError('Please fill all fields');
      return;
    }

    const starsNum = parseInt(stars);
    if (isNaN(starsNum) || starsNum < 0) {
      setError('Stars must be a positive number');
      return;
    }

    if (!connectedAccount) {
      setError('Please connect your wallet');
      return;
    }

    setIsSetting(true);
    try {
      await setStars(userAddress, starsNum);
      setUserAddress('');
      setStarsValue('');
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to set stars';
      setError(errorMessage);
      console.error('Error setting stars:', err);
    } finally {
      setIsSetting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="bootstrap-user-address">User Address</Label>
        <Input
          id="bootstrap-user-address"
          type="text"
          value={userAddress}
          onChange={(e) => {
            setUserAddress(e.target.value);
            setError(null);
          }}
          placeholder="5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"
          disabled={isSetting || !connectedAccount}
          aria-invalid={!!error}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="bootstrap-stars">Stars</Label>
        <Input
          id="bootstrap-stars"
          type="number"
          value={stars}
          onChange={(e) => {
            setStarsValue(e.target.value);
            setError(null);
          }}
          placeholder="100"
          min="0"
          disabled={isSetting || !connectedAccount}
          aria-invalid={!!error}
        />
      </div>
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600">
          <AlertCircle className="size-4" />
          <p>{error}</p>
        </div>
      )}
      <Button
        type="submit"
        variant="primary"
        className="w-full"
        disabled={isSetting || !connectedAccount || !userAddress || !stars}
      >
        {isSetting ? 'Setting Stars...' : 'Set Stars'}
      </Button>
    </form>
  );
}
