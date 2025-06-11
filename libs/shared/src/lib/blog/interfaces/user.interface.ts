export interface User {
  id: string;
  username: string;
  email: string;
  password?: string; // Optional for security - should not be included in API responses
  displayName?: string;
  avatar?: string;
  role: 'admin' | 'editor' | 'viewer';
  createdAt: Date | string;
  updatedAt: Date | string;
  lastLoginAt?: Date | string;
  isActive?: boolean;
}
