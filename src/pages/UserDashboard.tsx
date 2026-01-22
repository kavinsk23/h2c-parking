import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import {
  loadUsers,
  loadParkingSchedule,
  saveParkingSchedule,
  type User,
  type DaySchedule,
} from "../services/Googlesheetsservice";

export const UserDashboard = () => {
  const { user: currentUser, logout, accessToken } = useAuth();

  const [users, setUsers] = useState<User[]>([]);
  const [schedule, setSchedule] = useState<DaySchedule[]>([]);
  const [selectedDay, setSelectedDay] = useState<string>("Monday");
  const [loading, setLoading] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [slotToClear, setSlotToClear] = useState<{
    day: string;
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
      const [usersData, scheduleData] = await Promise.all([
        loadUsers(accessToken),
        loadParkingSchedule(accessToken),
      ]);
      setUsers(usersData);
      setSchedule(scheduleData);
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

  const getMyAllocations = () => {
    const allocations: Array<{
      day: string;
      slotName: string;
      slotType: string;
      area: string;
    }> = [];

    schedule.forEach((daySchedule) => {
      daySchedule.office.forEach((slot) => {
        if (slot.userId === getCurrentUserId()) {
          allocations.push({
            day: daySchedule.day,
            slotName: slot.slotName,
            slotType: slot.slotType,
            area: "Office",
          });
        }
      });
      daySchedule.temple.forEach((slot) => {
        if (slot.userId === getCurrentUserId()) {
          allocations.push({
            day: daySchedule.day,
            slotName: slot.slotName,
            slotType: slot.slotType,
            area: "Temple",
          });
        }
      });
    });

    return allocations;
  };

  const getCurrentUserId = (): string | null => {
    const user = users.find((u) => u.email === currentUser?.email);
    return user?.id || null;
  };

  const isMySlot = (userId: string | null): boolean => {
    return userId === getCurrentUserId();
  };

  const handleClearSlot = (
    day: string,
    type: "office" | "temple",
    index: number,
  ) => {
    setSlotToClear({ day, type, index });
    setShowClearModal(true);
  };

  const confirmClearSlot = async () => {
    if (!slotToClear || !accessToken) return;

    const updatedSchedule = [...schedule];
    const daySchedule = updatedSchedule.find((s) => s.day === slotToClear.day);
    if (!daySchedule) return;

    const slot =
      slotToClear.type === "office"
        ? daySchedule.office[slotToClear.index]
        : daySchedule.temple[slotToClear.index];

    slot.userId = null;
    slot.userName = null;

    try {
      setLoading(true);
      setSchedule(updatedSchedule);
      await saveParkingSchedule(updatedSchedule, accessToken);
      alert("Your slot has been cleared successfully!");
    } catch (error) {
      console.error("Error clearing slot:", error);
      alert("Failed to clear slot. Please try again.");
    } finally {
      setLoading(false);
      setShowClearModal(false);
      setSlotToClear(null);
    }
  };

  const currentDaySchedule = getCurrentDaySchedule();
  const myAllocations = getMyAllocations();
  const currentUserId = getCurrentUserId();

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
              <h1 className="text-xl font-semibold text-gray-900">
                My Parking Dashboard
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
        {/* My Allocations Summary */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 mb-4">
          <h2 className="text-base font-semibold text-gray-900 mb-3">
            My Weekly Allocations
          </h2>
          {myAllocations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map(
                (day) => {
                  const dayAllocation = myAllocations.find(
                    (a) => a.day === day,
                  );
                  return (
                    <div
                      key={day}
                      className={`border rounded-lg p-3 ${
                        dayAllocation
                          ? "border-teal-300 bg-teal-50"
                          : "border-gray-200 bg-gray-50"
                      }`}
                    >
                      <p className="text-xs font-semibold text-gray-900 mb-1">
                        {day}
                      </p>
                      {dayAllocation ? (
                        <div>
                          <p className="text-sm font-bold text-teal-900">
                            {dayAllocation.slotName}
                          </p>
                          <p className="text-xs text-teal-700">
                            {dayAllocation.area}
                          </p>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded font-medium inline-block mt-1 ${
                              dayAllocation.slotType === "Long"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-purple-100 text-purple-700"
                            }`}
                          >
                            {dayAllocation.slotType}
                          </span>
                        </div>
                      ) : (
                        <p className="text-xs text-gray-500">No allocation</p>
                      )}
                    </div>
                  );
                },
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">You have no parking allocations yet.</p>
              <p className="text-xs mt-1">
                Contact admin to get a parking slot assigned.
              </p>
            </div>
          )}
        </div>

        {/* Day Selector */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 mb-4">
          <div className="flex justify-between items-center">
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
          </div>
        </div>

        {/* Full Schedule View */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Office Parking */}
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
              {currentDaySchedule?.office.map((slot, index) => {
                const isMine = isMySlot(slot.userId);
                return (
                  <div
                    key={index}
                    className={`border rounded-md p-1.5 transition ${
                      isMine
                        ? "border-teal-400 bg-teal-100 cursor-pointer hover:border-teal-500"
                        : slot.userId
                          ? "border-gray-300 bg-gray-100 opacity-60 cursor-not-allowed"
                          : "border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed"
                    }`}
                    onClick={() =>
                      isMine && handleClearSlot(selectedDay, "office", index)
                    }
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
                            <p
                              className={`text-[10px] font-medium truncate ${
                                isMine ? "text-teal-900" : "text-gray-600"
                              }`}
                            >
                              {isMine ? "YOU" : slot.userName}
                            </p>
                            <p
                              className={`text-[9px] ${
                                isMine ? "text-teal-600" : "text-gray-500"
                              }`}
                            >
                              {slot.userId}
                            </p>
                          </div>
                        ) : (
                          <p className="text-[9px] text-gray-400 text-right">
                            Available
                          </p>
                        )}
                      </div>
                    </div>

                    {isMine && (
                      <div className="pt-1 border-t border-teal-300">
                        <p className="text-[9px] text-teal-700 text-center">
                          Click to clear
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Temple Parking */}
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
              {currentDaySchedule?.temple.map((slot, index) => {
                const isMine = isMySlot(slot.userId);
                return (
                  <div
                    key={index}
                    className={`border rounded-md p-1.5 transition ${
                      isMine
                        ? "border-teal-400 bg-teal-100 cursor-pointer hover:border-teal-500"
                        : slot.userId
                          ? "border-gray-300 bg-gray-100 opacity-60 cursor-not-allowed"
                          : "border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed"
                    }`}
                    onClick={() =>
                      isMine && handleClearSlot(selectedDay, "temple", index)
                    }
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
                            <p
                              className={`text-[10px] font-medium truncate ${
                                isMine ? "text-teal-900" : "text-gray-600"
                              }`}
                            >
                              {isMine ? "YOU" : slot.userName}
                            </p>
                            <p
                              className={`text-[9px] ${
                                isMine ? "text-teal-600" : "text-gray-500"
                              }`}
                            >
                              {slot.userId}
                            </p>
                          </div>
                        ) : (
                          <p className="text-[9px] text-gray-400 text-right">
                            Available
                          </p>
                        )}
                      </div>
                    </div>

                    {isMine && (
                      <div className="pt-1 border-t border-teal-300">
                        <p className="text-[9px] text-teal-700 text-center">
                          Click to clear
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      {/* Clear Slot Confirmation Modal */}
      {showClearModal && slotToClear && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Clear Your Parking Slot?
              </h3>
              <p className="text-sm text-gray-600 mt-2">
                Are you sure you want to clear your parking allocation for{" "}
                <span className="font-semibold">{slotToClear.day}</span>?
              </p>
              <p className="text-xs text-gray-500 mt-1">
                This action will make the slot available for others.
              </p>
            </div>

            <div className="p-6 flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowClearModal(false);
                  setSlotToClear(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmClearSlot}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition disabled:bg-gray-400"
              >
                {loading ? "Clearing..." : "Clear Slot"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
