import { apiClient } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { mockCheckUserRegistration, mockRegisterUser, mockRegisterUserWithoutRole } from './mockUserService';

interface CheckUserResponse {
  exists: boolean;
  role?: 'lender' | 'borrower';
}

interface RegisterUserResponse {
  success: boolean;
  role?: 'lender' | 'borrower';
}

/**
 * Verifica si la API está configurada
 */
function isApiConfigured(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  const apiBase = process.env.NEXT_PUBLIC_API_BASE || process.env.VITE_API_BASE;
  return Boolean(apiBase && apiBase.trim() !== '');
}

export async function checkUserRegistration(address: string): Promise<CheckUserResponse> {
  // Si no hay API configurada, usar mock
  if (!isApiConfigured()) {
    return mockCheckUserRegistration(address);
  }

  // Usar API real
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
  // Si no hay API configurada, usar mock
  if (!isApiConfigured()) {
    return mockRegisterUser(address, role);
  }

  // Usar API real
  const response = await apiClient.post<RegisterUserResponse>('/users/register', {
    address,
    role,
  });
  return response.data;
}

export async function registerUserWithoutRole(address: string): Promise<{ success: boolean }> {
  // Si no hay API configurada, usar mock
  if (!isApiConfigured()) {
    return mockRegisterUserWithoutRole(address);
  }

  // Usar API real - registrar sin rol
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
      // NO establecer el rol automáticamente - dejar que el usuario elija en el modal
      // setUserRole(checkResult.role);
      return { isRegistered: true, role: checkResult.role };
    } else {
      setIsRegistered(false);
      return { isRegistered: false };
    }
  } catch (error) {
    // Si el error es sobre API no configurada, usar mock como fallback
    const errorMessage = error instanceof Error ? error.message : 'Failed to check user registration';
    if (errorMessage.includes('API base URL is not configured')) {
      // Intentar con mock como fallback
      try {
        const mockResult = await mockCheckUserRegistration(address);
        if (mockResult.exists && mockResult.role) {
          setIsRegistered(true);
          // NO establecer el rol automáticamente - dejar que el usuario elija en el modal
          // setUserRole(mockResult.role);
          setIsCheckingRegistration(false);
          return { isRegistered: true, role: mockResult.role };
        }
        setIsRegistered(false);
        setIsCheckingRegistration(false);
        return { isRegistered: false };
      } catch {
        setIsRegistered(false);
        setIsCheckingRegistration(false);
        return { isRegistered: false };
      }
    }
    setError(errorMessage);
    setIsCheckingRegistration(false);
    throw error;
  } finally {
    setIsCheckingRegistration(false);
  }
}
