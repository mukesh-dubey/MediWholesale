export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  expiresAt: string;
  email: string;
  fullName: string;
  roles: string[];
  customerId?: number | null;
}

export interface AuthUser {
  token: string;
  email: string;
  fullName: string;
  roles: string[];
  customerId?: number | null;
}
