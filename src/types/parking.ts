export type ParkingType = "office" | "temple";
export type VehicleType = "long" | "short";
export type DayOfWeek =
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday";

export interface ParkingSlot {
  id: string;
  slotName: string;
  parkingType: ParkingType;
  allowsLongVehicles: boolean; // true = long slot, false = short slot only
  dayOfWeek: DayOfWeek;
}

export interface User {
  id: string;
  name: string;
  email: string;
  department: string;
}

export interface ParkingAllocation {
  id: string;
  slotId: string;
  userId: string;
  vehicleType: VehicleType;
  dayOfWeek: DayOfWeek;
  parkingType: ParkingType;
  allocatedAt: Date;
}

export interface DayParkingSlots {
  day: DayOfWeek;
  officeSlots: ParkingSlot[];
  templeSlots: ParkingSlot[];
}
