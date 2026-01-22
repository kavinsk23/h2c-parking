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
      await initializeScheduleSheet(accessToken);

      const [usersData, scheduleData] = await Promise.all([
        loadUsers(accessToken),
        loadParkingSchedule(accessToken),
      ]);
      setUsers(usersData);

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

      if (user.vehicleType === "Long" && slot.slotType === "Short") {
        alert("Long vehicles cannot be assigned to Short slots!");
        return;
      }

      slot.userId = userId;
      slot.userName = user.name;
    } else {
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
      return users;
    } else {
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
        <div className="max-w-[1600px] mx-auto px-6 py-3">
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
      <main className="max-w-[1600px] mx-auto px-6 py-6">
        {/* Day Selector & Stats */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 mb-4">
          <div className="flex justify-between items-center mb-3">
            <div className="flex gap-2">
              {[
                { day: "Monday", color: "blue" },
                { day: "Tuesday", color: "purple" },
                { day: "Wednesday", color: "teal" },
                { day: "Thursday", color: "orange" },
                { day: "Friday", color: "green" },
              ].map(({ day, color }) => (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
                    selectedDay === day
                      ? color === "blue"
                        ? "bg-blue-600 text-white shadow-md ring-2 ring-blue-300"
                        : color === "purple"
                          ? "bg-purple-600 text-white shadow-md ring-2 ring-purple-300"
                          : color === "teal"
                            ? "bg-teal-600 text-white shadow-md ring-2 ring-teal-300"
                            : color === "orange"
                              ? "bg-orange-600 text-white shadow-md ring-2 ring-orange-300"
                              : "bg-green-600 text-white shadow-md ring-2 ring-green-300"
                      : color === "blue"
                        ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                        : color === "purple"
                          ? "bg-purple-100 text-purple-700 hover:bg-purple-200"
                          : color === "teal"
                            ? "bg-teal-100 text-teal-700 hover:bg-teal-200"
                            : color === "orange"
                              ? "bg-orange-100 text-orange-700 hover:bg-orange-200"
                              : "bg-green-100 text-green-700 hover:bg-green-200"
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
            <button
              onClick={handleSaveSchedule}
              disabled={loading}
              className="px-5 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed shadow-sm"
            >
              {loading ? "Saving..." : "Save Schedule"}
            </button>
          </div>

          {/* Quick Stats */}
          <div className="flex gap-4 pt-3 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-teal-500"></div>
              <span className="text-xs text-gray-600">
                Office:{" "}
                {currentDaySchedule?.office.filter((s) => s.userId).length || 0}
                /12 allocated
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500"></div>
              <span className="text-xs text-gray-600">
                Temple:{" "}
                {currentDaySchedule?.temple.filter((s) => s.userId).length || 0}
                /6 allocated
              </span>
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-xs text-gray-600">
                Total:{" "}
                {(currentDaySchedule?.office.filter((s) => s.userId).length ||
                  0) +
                  (currentDaySchedule?.temple.filter((s) => s.userId).length ||
                    0)}
                /18 slots used
              </span>
            </div>
          </div>
        </div>

        {/* Parking Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Office Parking - Takes 2 columns */}
          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl shadow-sm p-3">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base font-semibold text-gray-900">
                Office Parking
              </h2>
              <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                12 slots
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-1.5">
              {currentDaySchedule?.office.map((slot, index) => (
                <div
                  key={index}
                  className={`border rounded-md p-1.5 hover:border-teal-500 transition cursor-pointer ${
                    slot.userId
                      ? "border-teal-300 bg-teal-50"
                      : "border-gray-300 bg-white"
                  }`}
                  onClick={() => handleSlotClick("office", index)}
                >
                  <div className="flex justify-between items-start gap-1 mb-1">
                    {/* Left: Slot Name & Type */}
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-gray-900">
                        {slot.slotName}
                      </span>
                      <span
                        className={`text-[9px] px-1 py-0.5 rounded font-medium inline-block w-fit mt-0.5 ${
                          slot.slotType === "Long"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-purple-100 text-purple-700"
                        }`}
                      >
                        {slot.slotType}
                      </span>
                    </div>

                    {/* Right: User Info */}
                    <div className="flex-1 min-w-0">
                      {slot.userId ? (
                        <div className="text-right">
                          <p className="text-[10px] font-medium text-teal-900 truncate">
                            {slot.userName}
                          </p>
                          <p className="text-[9px] text-teal-600">
                            {slot.userId}
                          </p>
                        </div>
                      ) : (
                        <p className="text-[9px] text-gray-500 text-right">
                          Available
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Bottom: Slot Type Toggle */}
                  <div
                    className="flex gap-1 pt-1 border-t border-gray-200"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <label className="flex items-center text-[9px] cursor-pointer flex-1">
                      <input
                        type="radio"
                        name={`office-${index}-type`}
                        checked={slot.slotType === "Short"}
                        onChange={() =>
                          handleSlotTypeChange("office", index, "Short")
                        }
                        className="mr-0.5 w-2 h-2"
                      />
                      Short
                    </label>
                    <label className="flex items-center text-[9px] cursor-pointer flex-1">
                      <input
                        type="radio"
                        name={`office-${index}-type`}
                        checked={slot.slotType === "Long"}
                        onChange={() =>
                          handleSlotTypeChange("office", index, "Long")
                        }
                        className="mr-0.5 w-2 h-2"
                      />
                      Long
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Temple Parking - Takes 1 column */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-3">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base font-semibold text-gray-900">
                Temple Parking
              </h2>
              <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                6 slots
              </span>
            </div>
            <div className="grid grid-cols-1 gap-1.5">
              {currentDaySchedule?.temple.map((slot, index) => (
                <div
                  key={index}
                  className={`border rounded-md p-1.5 hover:border-teal-500 transition cursor-pointer ${
                    slot.userId
                      ? "border-teal-300 bg-teal-50"
                      : "border-gray-300 bg-white"
                  }`}
                  onClick={() => handleSlotClick("temple", index)}
                >
                  <div className="flex justify-between items-start gap-1 mb-1">
                    {/* Left: Slot Name & Type */}
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-gray-900">
                        {slot.slotName}
                      </span>
                      <span
                        className={`text-[9px] px-1 py-0.5 rounded font-medium inline-block w-fit mt-0.5 ${
                          slot.slotType === "Long"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-purple-100 text-purple-700"
                        }`}
                      >
                        {slot.slotType}
                      </span>
                    </div>

                    {/* Right: User Info */}
                    <div className="flex-1 min-w-0">
                      {slot.userId ? (
                        <div className="text-right">
                          <p className="text-[10px] font-medium text-teal-900 truncate">
                            {slot.userName}
                          </p>
                          <p className="text-[9px] text-teal-600">
                            {slot.userId}
                          </p>
                        </div>
                      ) : (
                        <p className="text-[9px] text-gray-500 text-right">
                          Available
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Bottom: Slot Type Toggle */}
                  <div
                    className="flex gap-1 pt-1 border-t border-gray-200"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <label className="flex items-center text-[9px] cursor-pointer flex-1">
                      <input
                        type="radio"
                        name={`temple-${index}-type`}
                        checked={slot.slotType === "Short"}
                        onChange={() =>
                          handleSlotTypeChange("temple", index, "Short")
                        }
                        className="mr-0.5 w-2 h-2"
                      />
                      Short
                    </label>
                    <label className="flex items-center text-[9px] cursor-pointer flex-1">
                      <input
                        type="radio"
                        name={`temple-${index}-type`}
                        checked={slot.slotType === "Long"}
                        onChange={() =>
                          handleSlotTypeChange("temple", index, "Long")
                        }
                        className="mr-0.5 w-2 h-2"
                      />
                      Long
                    </label>
                  </div>
                </div>
              ))}
            </div>
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
