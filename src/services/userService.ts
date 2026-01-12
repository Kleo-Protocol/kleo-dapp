import { apiClient } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

interface CheckUserResponse {
  exists: boolean;
  role?: 'lender' | 'borrower';
}

interface RegisterUserResponse {
  success: boolean;
  role?: 'lender' | 'borrower';
}

/**
 * Checks if the API is configured
 */
function isApiConfigured(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  const apiBase = process.env.NEXT_PUBLIC_API_BASE || process.env.VITE_API_BASE;
  return Boolean(apiBase && apiBase.trim() !== '');
}

export async function checkUserRegistration(address: string): Promise<CheckUserResponse> {
  if (!isApiConfigured()) {
    throw new Error('API not configured - mock removed');
  }

  // Use real API
  try {
    const response = await apiClient.get<CheckUserResponse>(`/users/check/${address}`);
    return response.data;
  } catch (error) {
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { status?: number } };
      if (axiosError.response?.status === 404) {
        return { exists: false };
      }
    }
    throw error;
  }
}

export async function registerUser(address: string, role: 'lender' | 'borrower'): Promise<RegisterUserResponse> {
  if (!isApiConfigured()) {
    throw new Error('API not configured - mock removed');
  }

  // Use real API
  const response = await apiClient.post<RegisterUserResponse>('/users/register', {
    address,
    role,
  });
  return response.data;
}

export async function registerUserWithoutRole(address: string): Promise<{ success: boolean }> {
  if (!isApiConfigured()) {
    throw new Error('API not configured - mock removed');
  }

  // Use real API - register without role
  const response = await apiClient.post<{ success: boolean }>('/users/register', {
    address,
  });
  return response.data;
}

export async function verifyAndRegisterUser(
  address: string,
): Promise<{ isRegistered: boolean; role?: 'lender' | 'borrower' }> {
  const { setIsCheckingRegistration, setIsRegistered, setError } = useAuthStore.getState();

  try {
    setIsCheckingRegistration(true);
    setError(undefined);

    const checkResult = await checkUserRegistration(address);

    if (checkResult.exists && checkResult.role) {
      setIsRegistered(true);
      // DO NOT set role automatically - let user choose in modal
      // setUserRole(checkResult.role);
      return { isRegistered: true, role: checkResult.role };
    } else {
      setIsRegistered(false);
      return { isRegistered: false };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to check user registration';
    setError(errorMessage);
    setIsCheckingRegistration(false);
    throw error;
  } finally {
    setIsCheckingRegistration(false);
  }
}
