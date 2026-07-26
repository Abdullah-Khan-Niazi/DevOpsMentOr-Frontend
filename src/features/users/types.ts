export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface CreateUserInput {
  name: string;
  email: string;
  role: string;
}
