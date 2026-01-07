'use client';

import { useState } from 'react';
import { useBootstrapStars } from '../hooks/use-bootstrap-stars';
import { useStars } from '@/features/profile/hooks/use-reputation-queries';

/**
 * Form component for setting stars via admin function
 * TEMPORARY - Only used in flow-testing page
 */
export function BootstrapStarsForm() {
  const { setStars } = useBootstrapStars();
  const [userAddress, setUserAddress] = useState('');
  const [stars, setStarsInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Query current stars for the entered address
  const { data: currentStars } = useStars(userAddress || undefined);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!userAddress.trim()) {
      setError('User address is required');
      return;
    }

    const starsNum = parseInt(stars);
    if (isNaN(starsNum) || starsNum < 0) {
      setError('Stars must be a valid number >= 0');
      return;
    }

    setIsSubmitting(true);

    try {
      await setStars(userAddress.trim(), starsNum);
      setUserAddress('');
      setStarsInput('');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to set stars';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label htmlFor="user-address" className="block mb-2 text-sm font-medium text-slate-700">
            User Address (AccountId)
          </label>
          <input
            id="user-address"
            type="text"
            value={userAddress}
            onChange={(e) => setUserAddress(e.target.value)}
            placeholder="5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"
            disabled={isSubmitting}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed"
          />
          {currentStars !== undefined && userAddress && (
            <p className="mt-1 text-xs text-slate-600">
              Current stars: {currentStars}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="stars" className="block mb-2 text-sm font-medium text-slate-700">
            Stars
          </label>
          <input
            id="stars"
            type="number"
            value={stars}
            onChange={(e) => setStarsInput(e.target.value)}
            placeholder="100"
            min="0"
            disabled={isSubmitting}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed"
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm border border-red-200">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting || !userAddress.trim() || !stars.trim()}
          className="px-6 py-3 text-base font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? 'Setting Stars...' : 'Set Stars'}
        </button>
      </form>
    </div>
  );
}

