'use client';

import { useState } from 'react';
import { useBootstrapStars } from '@/features/flow-testing/hooks/use-bootstrap-stars';
import { useTypink } from 'typink';

/**
 * Bootstrap Stars Form Component
 * TEMPORARY - Only used in flow-testing page
 * Admin function to set stars for test accounts
 */
export function BootstrapStarsForm() {
  const { setStars } = useBootstrapStars();
  const { connectedAccount } = useTypink();
  const [userAddress, setUserAddress] = useState('');
  const [stars, setStarsValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userAddress || !stars) {
      return;
    }

    const starsNum = parseInt(stars);
    if (isNaN(starsNum) || starsNum < 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      await setStars(userAddress, starsNum);
      setUserAddress('');
      setStarsValue('');
    } catch (error) {
      console.error('Error setting stars:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label htmlFor="bootstrap-user-address" className="block mb-2 text-sm font-medium text-slate-700">
          User Address
        </label>
        <input
          id="bootstrap-user-address"
          type="text"
          value={userAddress}
          onChange={(e) => setUserAddress(e.target.value)}
          placeholder={connectedAccount?.address || '0x...'}
          disabled={isSubmitting || !connectedAccount}
          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed"
        />
      </div>
      <div>
        <label htmlFor="bootstrap-stars" className="block mb-2 text-sm font-medium text-slate-700">
          Stars
        </label>
        <input
          id="bootstrap-stars"
          type="number"
          value={stars}
          onChange={(e) => setStarsValue(e.target.value)}
          placeholder="100"
          min="0"
          disabled={isSubmitting || !connectedAccount}
          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed"
        />
      </div>
      <button
        type="submit"
        disabled={isSubmitting || !connectedAccount || !userAddress || !stars}
        className="px-6 py-3 text-base font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
      >
        {isSubmitting ? 'Setting Stars...' : 'Set Stars'}
      </button>
    </form>
  );
}

