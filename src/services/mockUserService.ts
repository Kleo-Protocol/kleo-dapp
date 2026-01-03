/**
 * Mock service to simulate user backend
 * This service uses localStorage to persist data
 * When you have the real backend, simply configure NEXT_PUBLIC_API_BASE
 * and this mock will be automatically ignored
 */

import { logger } from '@/lib/logger';
import { STORAGE_KEYS, MOCK_DELAYS } from '@/lib/constants';

interface MockUser {
  address: string;
  role: 'lender' | 'borrower';
  registeredAt: number;
}

function getMockUsers(): Map<string, MockUser> {
  if (typeof window === 'undefined') {
    return new Map();
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEYS.MOCK_USERS);
    if (stored) {
      const users = JSON.parse(stored) as MockUser[];
      return new Map(users.map((user) => [user.address, user]));
    }
  } catch (error) {
    logger.warn('Error reading mock users from localStorage', { error: error instanceof Error ? error.message : String(error) }, error instanceof Error ? error : undefined);
  }

  return new Map();
}

function saveMockUsers(users: Map<string, MockUser>): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const usersArray = Array.from(users.values());
    localStorage.setItem(STORAGE_KEYS.MOCK_USERS, JSON.stringify(usersArray));
  } catch (error) {
    logger.warn('Error saving mock users to localStorage', { error: error instanceof Error ? error.message : String(error) }, error instanceof Error ? error : undefined);
  }
}

export async function mockCheckUserRegistration(address: string): Promise<{ exists: boolean; role?: 'lender' | 'borrower' }> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, MOCK_DELAYS.SHORT));

  const users = getMockUsers();
  const user = users.get(address);

  if (user) {
    return {
      exists: true,
      role: user.role,
    };
  }

  return {
    exists: false,
  };
}

export async function mockRegisterUser(address: string, role: 'lender' | 'borrower'): Promise<{ success: boolean; role: 'lender' | 'borrower' }> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, MOCK_DELAYS.MEDIUM));

  const users = getMockUsers();
  
  const newUser: MockUser = {
    address,
    role,
    registeredAt: Date.now(),
  };

  users.set(address, newUser);
  saveMockUsers(users);

  return {
    success: true,
    role,
  };
}

export async function mockRegisterUserWithoutRole(address: string): Promise<{ success: boolean }> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, MOCK_DELAYS.MEDIUM));

  const users = getMockUsers();
  
  // Register without role (role will be set later)
  const newUser: MockUser = {
    address,
    role: 'lender', // Temporary role, will be changed in dashboard
    registeredAt: Date.now(),
  };

  users.set(address, newUser);
  saveMockUsers(users);

  return {
    success: true,
  };
}

/**
 * Utility function to clear mock data (useful for testing)
 */
export function clearMockUsers(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEYS.MOCK_USERS);
  }
}

