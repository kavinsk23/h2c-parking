import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import {
  loadUsers,
  loadParkingSchedule,
  saveParkingSchedule,
  initializeScheduleSheet,
  initializeDefaultSchedule,
  type User,
  type ParkingSlot,
  type DaySchedule,
} from "../services/Googlesheetsservice";

export const AllocateParking = () => {
  const { user: currentUser, logout, accessToken } = useAuth();

  const [users, setUsers] = useState<User[]>([]);
  const [schedule, setSchedule] = useState<DaySchedule[]>([]);
  const [selectedDay, setSelectedDay] = useState<string>("Monday");
  const [loading, setLoading] = useState(false);
  const [showAllocationModal, setShowAllocationModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{
    type: "office" | "temple";
    index: number;
  } | null>(null);

  useEffect(() => {
    if (accessToken) {
      loadData();
    }
  }, [accessToken]);

  const loadData = async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      // Initialize schedule sheet if needed
      await initializeScheduleSheet(accessToken);

      const [usersData, scheduleData] = await Promise.all([
        loadUsers(accessToken),
        loadParkingSchedule(accessToken),
      ]);
      setUsers(usersData);

      // If schedule is empty, initialize with default slots
      if (scheduleData.length === 0) {
        const defaultSchedule = initializeDefaultSchedule();
        setSchedule(defaultSchedule);
      } else {
        setSchedule(scheduleData);
      }
    } catch (error) {
      console.error("Error loading data:", error);
      alert("Failed to load data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    window.location.href = "/login";
  };

  const getCurrentDaySchedule = (): DaySchedule | undefined => {
    return schedule.find((s) => s.day === selectedDay);
  };

  const handleSlotClick = (type: "office" | "temple", index: number) => {
    setSelectedSlot({ type, index });
    setShowAllocationModal(true);
  };

  const handleAllocateUser = (userId: string | null) => {
    if (!selectedSlot) return;

    const updatedSchedule = [...schedule];
    const daySchedule = updatedSchedule.find((s) => s.day === selectedDay);
    if (!daySchedule) return;

    const slot =
      selectedSlot.type === "office"
        ? daySchedule.office[selectedSlot.index]
        : daySchedule.temple[selectedSlot.index];

    if (userId) {
      const user = users.find((u) => u.id === userId);
      if (!user) return;

      // Check if user's vehicle type matches slot type
      if (user.vehicleType === "Long" && slot.slotType === "Short") {
        alert("Long vehicles cannot be assigned to Short slots!");
        return;
      }

      slot.userId = userId;
      slot.userName = user.name;
    } else {
      // Deallocate
      slot.userId = null;
      slot.userName = null;
    }

    setSchedule(updatedSchedule);
    setShowAllocationModal(false);
    setSelectedSlot(null);
  };

  const handleSlotTypeChange = (
    type: "office" | "temple",
    index: number,
    slotType: "Long" | "Short",
  ) => {
    const updatedSchedule = [...schedule];
    const daySchedule = updatedSchedule.find((s) => s.day === selectedDay);
    if (!daySchedule) return;

    const slot =
      type === "office" ? daySchedule.office[index] : daySchedule.temple[index];

    // If changing to Short and a Long vehicle is assigned, remove the assignment
    if (slotType === "Short" && slot.userId) {
      const user = users.find((u) => u.id === slot.userId);
      if (user?.vehicleType === "Long") {
        slot.userId = null;
        slot.userName = null;
      }
    }

    slot.slotType = slotType;
    setSchedule(updatedSchedule);
  };

  const handleSaveSchedule = async () => {
    if (!accessToken) {
      alert("Authentication required. Please refresh the page and try again.");
      return;
    }

    try {
      setLoading(true);
      await saveParkingSchedule(schedule, accessToken);
      alert("Schedule saved successfully!");
    } catch (error) {
      console.error("Error saving schedule:", error);
      alert("Failed to save schedule. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getAvailableUsersForSlot = (slot: ParkingSlot): User[] => {
    if (slot.slotType === "Short") {
      // Short slots can accommodate both Short and Long vehicles
      return users;
    } else {
      // Long slots can only accommodate Long vehicles
      return users.filter((u) => u.vehicleType === "Long");
    }
  };

  const currentDaySchedule = getCurrentDaySchedule();

  if (!accessToken) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading authentication...</p>
        </div>
      </div>
    );
  }

  if (loading && schedule.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading parking data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Link
                  to="/admin"
                  className="text-teal-600 hover:text-teal-800 transition text-sm"
                >
                  ← Back to Dashboard
                </Link>
              </div>
              <h1 className="text-xl font-semibold text-gray-900">
                Allocate Parking
              </h1>
              <p className="text-sm text-teal-600 mt-0.5">
                H2C Parking Management
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-lg border border-gray-200">
                {currentUser?.picture && (
                  <img
                    src={currentUser.picture}
                    alt={currentUser.name}
                    className="w-9 h-9 rounded-full ring-2 ring-teal-200"
                  />
                )}
                <div className="text-sm">
                  <p className="font-medium text-gray-900">
                    {currentUser?.name}
                  </p>
                  <p className="text-gray-600 text-xs">{currentUser?.email}</p>
                </div>
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
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Day Selector */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map(
                (day) => (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(day)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
                      selectedDay === day
                        ? "bg-teal-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {day}
                  </button>
                ),
              )}
            </div>
            <button
              onClick={handleSaveSchedule}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? "Saving..." : "Save Schedule"}
            </button>
          </div>
        </div>

        {/* Office Parking */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Office Parking (12 Slots)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {currentDaySchedule?.office.map((slot, index) => (
              <div
                key={index}
                className="border border-gray-300 rounded-lg p-4 hover:border-teal-500 transition cursor-pointer"
                onClick={() => handleSlotClick("office", index)}
              >
                <div className="flex justify-between items-start mb-3">
                  <span className="text-sm font-semibold text-gray-900">
                    {slot.slotName}
                  </span>
                  <div className="flex gap-2">
                    <label
                      className="flex items-center text-xs cursor-pointer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="radio"
                        name={`office-${index}-type`}
                        checked={slot.slotType === "Short"}
                        onChange={() =>
                          handleSlotTypeChange("office", index, "Short")
                        }
                        className="mr-1"
                      />
                      Short
                    </label>
                    <label
                      className="flex items-center text-xs cursor-pointer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="radio"
                        name={`office-${index}-type`}
                        checked={slot.slotType === "Long"}
                        onChange={() =>
                          handleSlotTypeChange("office", index, "Long")
                        }
                        className="mr-1"
                      />
                      Long
                    </label>
                  </div>
                </div>

                <div className="text-sm">
                  {slot.userId ? (
                    <div className="bg-teal-50 border border-teal-200 rounded p-2">
                      <p className="font-medium text-teal-900">
                        {slot.userName}
                      </p>
                      <p className="text-xs text-teal-600">ID: {slot.userId}</p>
                    </div>
                  ) : (
                    <div className="bg-gray-50 border border-gray-200 rounded p-2 text-center text-gray-500">
                      Available
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Temple Parking */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Temple Parking (6 Slots)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentDaySchedule?.temple.map((slot, index) => (
              <div
                key={index}
                className="border border-gray-300 rounded-lg p-4 hover:border-teal-500 transition cursor-pointer"
                onClick={() => handleSlotClick("temple", index)}
              >
                <div className="flex justify-between items-start mb-3">
                  <span className="text-sm font-semibold text-gray-900">
                    {slot.slotName}
                  </span>
                  <div className="flex gap-2">
                    <label
                      className="flex items-center text-xs cursor-pointer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="radio"
                        name={`temple-${index}-type`}
                        checked={slot.slotType === "Short"}
                        onChange={() =>
                          handleSlotTypeChange("temple", index, "Short")
                        }
                        className="mr-1"
                      />
                      Short
                    </label>
                    <label
                      className="flex items-center text-xs cursor-pointer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="radio"
                        name={`temple-${index}-type`}
                        checked={slot.slotType === "Long"}
                        onChange={() =>
                          handleSlotTypeChange("temple", index, "Long")
                        }
                        className="mr-1"
                      />
                      Long
                    </label>
                  </div>
                </div>

                <div className="text-sm">
                  {slot.userId ? (
                    <div className="bg-teal-50 border border-teal-200 rounded p-2">
                      <p className="font-medium text-teal-900">
                        {slot.userName}
                      </p>
                      <p className="text-xs text-teal-600">ID: {slot.userId}</p>
                    </div>
                  ) : (
                    <div className="bg-gray-50 border border-gray-200 rounded p-2 text-center text-gray-500">
                      Available
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Allocation Modal */}
      {showAllocationModal && selectedSlot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Allocate User to Slot
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {selectedSlot.type === "office" ? "Office" : "Temple"} Slot -{" "}
                {
                  (selectedSlot.type === "office"
                    ? currentDaySchedule?.office[selectedSlot.index]
                    : currentDaySchedule?.temple[selectedSlot.index]
                  )?.slotName
                }
              </p>
            </div>

            <div className="p-6 max-h-96 overflow-y-auto">
              <div className="space-y-2">
                <button
                  onClick={() => handleAllocateUser(null)}
                  className="w-full text-left px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  <span className="text-sm font-medium text-red-600">
                    Clear Allocation
                  </span>
                </button>

                {getAvailableUsersForSlot(
                  selectedSlot.type === "office"
                    ? currentDaySchedule!.office[selectedSlot.index]
                    : currentDaySchedule!.temple[selectedSlot.index],
                ).map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleAllocateUser(user.id)}
                    className="w-full text-left px-4 py-3 border border-gray-300 rounded-lg hover:bg-teal-50 hover:border-teal-500 transition"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {user.name}
                        </p>
                        <p className="text-xs text-gray-600">{user.email}</p>
                      </div>
                      <div className="flex gap-2">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded ${
                            user.vehicleType === "Long"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-purple-100 text-purple-700"
                          }`}
                        >
                          {user.vehicleType}
                        </span>
                        <span className="px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-700">
                          {user.id}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => {
                  setShowAllocationModal(false);
                  setSelectedSlot(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
