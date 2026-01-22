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
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const googleToken = localStorage.getItem("googleToken");
    const storedAccessToken = localStorage.getItem("accessToken");

    if (storedUser && googleToken) {
      try {
        const decoded: DecodedToken = jwtDecode(googleToken);

        if (decoded.exp * 1000 > Date.now()) {
          const parsedUser = JSON.parse(storedUser) as User;
          setUser(parsedUser);

          if (storedAccessToken) {
            setAccessToken(storedAccessToken);
          }
        } else {
          localStorage.removeItem("user");
          localStorage.removeItem("googleToken");
          localStorage.removeItem("accessToken");
        }
      } catch (error) {
        console.error("Invalid token:", error);
        localStorage.removeItem("user");
        localStorage.removeItem("googleToken");
        localStorage.removeItem("accessToken");
      }
    }
    setLoading(false);
  }, []);

  // Auto-request access token when user logs in
  useEffect(() => {
    if (user && !accessToken) {
      const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

      const initTokenClient = () => {
        if (window.google?.accounts?.oauth2) {
          const client = window.google.accounts.oauth2.initTokenClient({
            client_id: CLIENT_ID,
            scope: "https://www.googleapis.com/auth/spreadsheets",
            callback: (tokenResponse) => {
              console.log("Access token received");
              setAccessToken(tokenResponse.access_token);
              localStorage.setItem("accessToken", tokenResponse.access_token);
            },
          });
          // Request token immediately
          client.requestAccessToken();
        }
      };

      if (window.google?.accounts?.oauth2) {
        initTokenClient();
      } else {
        const checkGoogle = setInterval(() => {
          if (window.google?.accounts?.oauth2) {
            clearInterval(checkGoogle);
            initTokenClient();
          }
        }, 100);

        setTimeout(() => clearInterval(checkGoogle), 5000);
      }
    }
  }, [user, accessToken]);

  const login = async (credential: string): Promise<void> => {
    try {
      setLoading(true);

      const decoded: DecodedToken = jwtDecode(credential);

      if (decoded.exp * 1000 < Date.now()) {
        throw new Error("Token expired");
      }

      if (!decoded.email_verified) {
        throw new Error("Email not verified");
      }

      const role = getUserRole(decoded.email);

      const userData: User = {
        id: decoded.sub,
        email: decoded.email,
        name: decoded.name,
        picture: decoded.picture,
        role: role,
        googleId: decoded.sub,
      };

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
    setAccessToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("googleToken");
    localStorage.removeItem("accessToken");
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isAdmin: user?.role === "admin",
    login,
    logout,
    loading,
    accessToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
