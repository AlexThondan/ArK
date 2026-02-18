export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    role: 'EMPLOYEE' | 'MANAGER' | 'HR' | 'ADMIN';
  };
};

