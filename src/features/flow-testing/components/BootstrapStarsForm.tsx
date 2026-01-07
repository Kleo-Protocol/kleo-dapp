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
    <div style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid #ccc', borderRadius: '4px' }}>
      <h2 style={{ marginTop: 0 }}>Bootstrap Stars (Admin)</h2>
      <p style={{ fontSize: '0.9rem', color: '#666' }}>
        Set stars for test accounts. This is an admin function and will be removed after testing.
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label htmlFor="user-address" style={{ display: 'block', marginBottom: '0.5rem' }}>
            User Address (AccountId)
          </label>
          <input
            id="user-address"
            type="text"
            value={userAddress}
            onChange={(e) => setUserAddress(e.target.value)}
            placeholder="5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"
            disabled={isSubmitting}
            style={{
              width: '100%',
              padding: '0.5rem',
              fontSize: '0.9rem',
              border: '1px solid #ccc',
              borderRadius: '4px',
            }}
          />
          {currentStars !== undefined && userAddress && (
            <p style={{ marginTop: '0.25rem', fontSize: '0.85rem', color: '#666' }}>
              Current stars: {currentStars}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="stars" style={{ display: 'block', marginBottom: '0.5rem' }}>
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
            style={{
              width: '100%',
              padding: '0.5rem',
              fontSize: '0.9rem',
              border: '1px solid #ccc',
              borderRadius: '4px',
            }}
          />
        </div>

        {error && (
          <div style={{ padding: '0.75rem', backgroundColor: '#fee', color: '#c00', borderRadius: '4px' }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting || !userAddress.trim() || !stars.trim()}
          style={{
            padding: '0.75rem 1.5rem',
            fontSize: '1rem',
            backgroundColor: isSubmitting ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
          }}
        >
          {isSubmitting ? 'Setting Stars...' : 'Set Stars'}
        </button>
      </form>
    </div>
  );
}

