import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "../context/AuthContext";

interface GoogleLoginButtonProps {
  onSuccess?: () => void;
  onError?: () => void;
}

export const GoogleLoginButton = ({
  onSuccess,
  onError,
}: GoogleLoginButtonProps) => {
  const { login } = useAuth();

  const handleSuccess = async (credentialResponse: any) => {
    try {
      if (credentialResponse.credential) {
        login(credentialResponse.credential);
        onSuccess?.();
      }
    } catch (error) {
      console.error("Login failed:", error);
      onError?.();
    }
  };

  const handleError = () => {
    console.error("Google Login Failed");
    onError?.();
  };

  return (
    <div className="flex justify-center">
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={handleError}
        useOneTap
        theme="filled_blue"
        size="large"
        text="signin_with"
        shape="rectangular"
        width="300"
      />
    </div>
  );
};
