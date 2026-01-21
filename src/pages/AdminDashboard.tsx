import { useAuth } from "../context/AuthContext";

export const AdminDashboard = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-indigo-600 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-indigo-200 text-sm">H2C Parking Management</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              {user?.picture && (
                <img
                  src={user.picture}
                  alt={user.name}
                  className="w-10 h-10 rounded-full border-2 border-white"
                />
              )}
              <div className="text-sm">
                <p className="font-semibold text-white">{user?.name}</p>
                <p className="text-indigo-200">{user?.email}</p>
                <span className="px-2 py-0.5 bg-yellow-400 text-yellow-900 rounded text-xs font-semibold">
                  ADMIN
                </span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-white text-indigo-600 rounded-lg hover:bg-indigo-50 transition font-semibold"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">
            Welcome, Admin {user?.name}!
          </h2>
          <p className="text-gray-600">
            This is your admin dashboard with full system access.
          </p>
        </div>
      </main>
    </div>
  );
};
