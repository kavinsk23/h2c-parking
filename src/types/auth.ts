export interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
  role: "user" | "admin";
  googleId: string;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (credential: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  accessToken: string | null;
}

export interface GoogleCredentialResponse {
  credential: string;
  select_by: string;
  clientId: string;
}

export interface DecodedToken {
  sub: string;
  email: string;
  name: string;
  picture?: string;
  email_verified: boolean;
  iat: number;
  exp: number;
}
