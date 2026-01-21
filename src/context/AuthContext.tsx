import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { jwtDecode } from "jwt-decode";
import type { User, AuthContextType, DecodedToken } from "../types/auth";
import { getUserRole } from "../utils/roleChecker";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored user session on mount
    const storedUser = localStorage.getItem("user");
    const googleToken = localStorage.getItem("googleToken");

    if (storedUser && googleToken) {
      try {
        const decoded: DecodedToken = jwtDecode(googleToken);

        // Check if token is expired
        if (decoded.exp * 1000 > Date.now()) {
          const parsedUser = JSON.parse(storedUser) as User;
          setUser(parsedUser);
        } else {
          // Token expired, clear storage
          localStorage.removeItem("user");
          localStorage.removeItem("googleToken");
        }
      } catch (error) {
        console.error("Invalid token:", error);
        localStorage.removeItem("user");
        localStorage.removeItem("googleToken");
      }
    }
    setLoading(false);
  }, []);

  const login = async (credential: string): Promise<void> => {
    try {
      setLoading(true);

      // Decode the Google JWT token
      const decoded: DecodedToken = jwtDecode(credential);

      // Verify token is not expired
      if (decoded.exp * 1000 < Date.now()) {
        throw new Error("Token expired");
      }

      // Verify email is verified
      if (!decoded.email_verified) {
        throw new Error("Email not verified");
      }

      // Determine user role based on email
      const role = getUserRole(decoded.email);

      // Create user object
      const userData: User = {
        id: decoded.sub,
        email: decoded.email,
        name: decoded.name,
        picture: decoded.picture,
        role: role,
        googleId: decoded.sub,
      };

      // Save to state and localStorage
      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("googleToken", credential);

      console.log(`User logged in as ${role}:`, userData.email);
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("googleToken");
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isAdmin: user?.role === "admin",
    login,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
