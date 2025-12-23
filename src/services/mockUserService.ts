/**
 * Mock service para simular el backend de usuarios
 * Este servicio usa localStorage para persistir datos
 * Cuando tengas el backend real, simplemente configura NEXT_PUBLIC_API_BASE
 * y este mock será ignorado automáticamente
 */

interface MockUser {
  address: string;
  role: 'lender' | 'borrower';
  registeredAt: number;
}

const STORAGE_KEY = 'kleo_mock_users';

function getMockUsers(): Map<string, MockUser> {
  if (typeof window === 'undefined') {
    return new Map();
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const users = JSON.parse(stored) as MockUser[];
      return new Map(users.map((user) => [user.address, user]));
    }
  } catch (error) {
    console.warn('Error reading mock users from localStorage:', error);
  }

  return new Map();
}

function saveMockUsers(users: Map<string, MockUser>): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const usersArray = Array.from(users.values());
    localStorage.setItem(STORAGE_KEY, JSON.stringify(usersArray));
  } catch (error) {
    console.warn('Error saving mock users to localStorage:', error);
  }
}

export async function mockCheckUserRegistration(address: string): Promise<{ exists: boolean; role?: 'lender' | 'borrower' }> {
  // Simular delay de red
  await new Promise((resolve) => setTimeout(resolve, 300));

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
  // Simular delay de red
  await new Promise((resolve) => setTimeout(resolve, 500));

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
  // Simular delay de red
  await new Promise((resolve) => setTimeout(resolve, 500));

  const users = getMockUsers();
  
  // Registrar sin rol (el rol se establecerá después)
  const newUser: MockUser = {
    address,
    role: 'lender', // Rol temporal, se cambiará en el dashboard
    registeredAt: Date.now(),
  };

  users.set(address, newUser);
  saveMockUsers(users);

  return {
    success: true,
  };
}

/**
 * Función de utilidad para limpiar los datos mock (útil para testing)
 */
export function clearMockUsers(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
  }
}

