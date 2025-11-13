import { User } from '../types';

const mockUsers: User[] = [
  {
    id: '1',
    name: 'Administrador',
    email: 'admin@tapajos.com',
    role: 'admin',
    createdAt: new Date(),
    isActive: true
  }
];

const simulateApiDelay = (ms: number = 300) => new Promise((res) => setTimeout(res, ms));
const generateId = (): string => Date.now().toString(36) + Math.random().toString(36).slice(2);

export const userService = {
  async getCurrentUser(): Promise<User> {
    await simulateApiDelay();
    return mockUsers[0];
  },

  async login(email: string, password: string): Promise<User> {
    await simulateApiDelay();
    const user = mockUsers.find((u) => u.email === email) || mockUsers[0];
    return user;
  }
};
