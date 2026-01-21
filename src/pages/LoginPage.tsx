import { GoogleLoginButton } from "../components/GoogleLoginButton";
import { useAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";

export const LoginPage = () => {
  const { isAuthenticated, isAdmin, user } = useAuth();
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [loginError, setLoginError] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      setLoginSuccess(true);
      // Redirect based on role
      setTimeout(() => {
        if (isAdmin) {
          window.location.href = "/admin";
        } else {
          window.location.href = "/dashboard";
        }
      }, 1500);
    }
  }, [isAuthenticated, isAdmin, user]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="bg-white p-10 rounded-3xl shadow-2xl w-full max-w-md border border-gray-100">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
              />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">H2C Parking</h1>
          <p className="text-gray-600 text-lg">
            Smart Parking Management System
          </p>
        </div>

        {/* Login Section */}
        <div className="space-y-6">
          {loginSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <p className="font-semibold text-green-900">
                    Login Successful!
                  </p>
                  <p className="text-sm text-green-700">
                    Welcome {user?.name} - Redirecting to{" "}
                    {isAdmin ? "admin" : "user"} dashboard...
                  </p>
                </div>
              </div>
            </div>
          )}

          {loginError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <svg
                  className="w-6 h-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <p className="font-semibold text-red-900">Login Failed</p>
                  <p className="text-sm text-red-700">
                    Please try again or contact support
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 bg-gray-50">
            <p className="text-center text-gray-700 font-medium mb-4">
              Sign in with Google
            </p>
            <GoogleLoginButton
              onSuccess={() => {
                setLoginSuccess(true);
                setLoginError(false);
              }}
              onError={() => {
                setLoginError(true);
                setLoginSuccess(false);
              }}
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div className="text-sm">
                <p className="font-semibold text-blue-900 mb-1">
                  Access Levels:
                </p>
                <ul className="text-blue-700 space-y-1">
                  <li>
                    • <span className="font-medium">Users:</span> Book and
                    manage parking slots
                  </li>
                  <li>
                    • <span className="font-medium">Admins:</span> Full system
                    management access
                  </li>
                </ul>
                <p className="text-xs text-blue-600 mt-2 italic">
                  Role is automatically assigned based on your email
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="text-center text-sm text-gray-600 space-y-2">
            <p>By signing in, you agree to our</p>
            <div className="flex justify-center gap-4">
              <a
                href="#"
                className="text-blue-600 hover:text-blue-700 font-medium hover:underline"
              >
                Terms of Service
              </a>
              <span className="text-gray-400">•</span>
              <a
                href="#"
                className="text-blue-600 hover:text-blue-700 font-medium hover:underline"
              >
                Privacy Policy
              </a>
            </div>
          </div>

          <div className="mt-6 text-center">
            <div className="inline-flex items-center gap-2 text-sm text-gray-500">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
              <span>Need help?</span>
              <a
                href="mailto:support@h2cparking.com"
                className="text-blue-600 hover:underline font-medium"
              >
                Contact Support
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
