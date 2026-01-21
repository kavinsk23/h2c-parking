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
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                Admin Dashboard
              </h1>
              <p className="text-sm text-teal-600 mt-0.5">
                H2C Parking Management
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-lg border border-gray-200">
                {user?.picture && (
                  <img
                    src={user.picture}
                    alt={user.name}
                    className="w-9 h-9 rounded-full ring-2 ring-teal-200"
                  />
                )}
                <div className="text-sm">
                  <p className="font-medium text-gray-900">{user?.name}</p>
                  <p className="text-gray-600 text-xs">{user?.email}</p>
                </div>
                <span className="ml-2 px-2 py-1 bg-teal-100 text-teal-700 rounded text-xs font-medium">
                  Admin
                </span>
              </div>

              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-teal-700 bg-white border border-gray-300 rounded-lg hover:bg-teal-50 transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-sm">
          <h2 className="text-lg font-semibold text-teal-600 mb-2">
            Welcome back, {user?.name?.split(" ")[0]}
          </h2>
          <p className="text-sm text-gray-600">
            Manage parking spaces, view analytics, and control system settings.
          </p>
        </div>

        {/* Menu Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm hover:shadow-md transition text-left">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              Manage Users
            </h3>
            <p className="text-sm text-gray-600">
              Add, edit, or remove user accounts
            </p>
          </button>
          <button className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm hover:shadow-md transition text-left">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              Allocate Parking
            </h3>
            <p className="text-sm text-gray-600">
              Assign parking spaces to users
            </p>
          </button>
        </div>
      </main>
    </div>
  );
};
