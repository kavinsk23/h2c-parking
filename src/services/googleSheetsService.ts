const SPREADSHEET_ID = "1jh-oJ4jT9ClmOGQJQzgV8cCJPrUMOF9uwsA3uM5b7ss";

export interface User {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  vehicleType: "Long" | "Short";
}

export interface ParkingSlot {
  slotName: string;
  slotType: "Long" | "Short";
  userId: string | null;
  userName: string | null;
}

export interface DaySchedule {
  day: string;
  office: ParkingSlot[];
  temple: ParkingSlot[];
}

let gapiInitialized = false;

const initGapi = async (accessToken: string) => {
  if (gapiInitialized) return;

  return new Promise<void>((resolve) => {
    if (window.gapi?.client) {
      window.gapi.client.setToken({ access_token: accessToken });
      gapiInitialized = true;
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://apis.google.com/js/api.js";
    script.onload = () => {
      window.gapi.load("client", async () => {
        await window.gapi.client.init({
          discoveryDocs: [
            "https://sheets.googleapis.com/$discovery/rest?version=v4",
          ],
        });
        window.gapi.client.setToken({ access_token: accessToken });
        gapiInitialized = true;
        resolve();
      });
    };
    document.body.appendChild(script);
  });
};

// ========== USER MANAGEMENT FUNCTIONS ==========

export const loadUsers = async (accessToken: string): Promise<User[]> => {
  try {
    await initGapi(accessToken);
    const response = await window.gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "Users!A2:E",
    });
    const rows = response.result.values || [];
    return rows.map((row: string[]) => ({
      id: row[0] || "",
      name: row[1] || "",
      email: row[2] || "",
      role: (row[3] || "user") as "user" | "admin",
      vehicleType: (row[4] || "Short") as "Long" | "Short",
    }));
  } catch (error) {
    console.error("Error loading users:", error);
    return [];
  }
};

export const saveToSheet = async (
  user: User,
  accessToken: string,
): Promise<void> => {
  try {
    await initGapi(accessToken);
    await window.gapi.client.sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: "Users!A:E",
      valueInputOption: "USER_ENTERED",
      resource: {
        values: [[user.id, user.name, user.email, user.role, user.vehicleType]],
      },
    });
  } catch (error) {
    console.error("Error saving user:", error);
    throw error;
  }
};

export const updateInSheet = async (
  user: User,
  accessToken: string,
): Promise<void> => {
  try {
    await initGapi(accessToken);

    // Get all IDs from column A (including header)
    const response = await window.gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "Users!A:A",
    });
    const rows = response.result.values || [];

    // Find the row index (0-based, includes header at index 0)
    const rowIndex = rows.findIndex((row: string[]) => row[0] === user.id);

    if (rowIndex === -1) {
      throw new Error("User not found");
    }

    // Convert to 1-based row number for A1 notation
    const sheetRow = rowIndex + 1;

    await window.gapi.client.sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `Users!A${sheetRow}:E${sheetRow}`,
      valueInputOption: "USER_ENTERED",
      resource: {
        values: [[user.id, user.name, user.email, user.role, user.vehicleType]],
      },
    });
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
};

export const deleteFromSheet = async (
  userId: string,
  accessToken: string,
): Promise<void> => {
  try {
    await initGapi(accessToken);

    // Get the sheet metadata to find the correct sheetId
    const sheetMetadata = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    const sheetData = await sheetMetadata.json();
    const usersSheet = sheetData.sheets?.find(
      (sheet: any) => sheet.properties?.title === "Users",
    );

    if (!usersSheet?.properties?.sheetId) {
      throw new Error("Users sheet not found");
    }

    const sheetId = usersSheet.properties.sheetId;

    // Get all IDs from column A (including header)
    const response = await window.gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "Users!A:A",
    });
    const rows = response.result.values || [];

    // Find the row index (0-based, includes header at index 0)
    const rowIndex = rows.findIndex((row: string[]) => row[0] === userId);

    if (rowIndex === -1) {
      throw new Error("User not found");
    }

    // For batchUpdate deleteDimension, use 0-based row indices
    await window.gapi.client.sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      resource: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: sheetId,
                dimension: "ROWS",
                startIndex: rowIndex,
                endIndex: rowIndex + 1,
              },
            },
          },
        ],
      },
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
};

// ========== SCHEDULE SHEET INITIALIZATION ==========

export const initializeScheduleSheet = async (
  accessToken: string,
): Promise<void> => {
  try {
    await initGapi(accessToken);

    // Check if Schedule sheet exists
    const sheetMetadata = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    const sheetData = await sheetMetadata.json();
    const scheduleSheet = sheetData.sheets?.find(
      (sheet: any) => sheet.properties?.title === "Schedule",
    );

    if (!scheduleSheet) {
      console.log("Schedule sheet not found, creating...");

      // Create the Schedule sheet
      await window.gapi.client.sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        resource: {
          requests: [
            {
              addSheet: {
                properties: {
                  title: "Schedule",
                  gridProperties: {
                    rowCount: 100,
                    columnCount: 72,
                  },
                },
              },
            },
          ],
        },
      });

      // Add headers
      const headers = [];
      for (let i = 1; i <= 12; i++) {
        headers.push(
          `O${i}_Name`,
          `O${i}_Type`,
          `O${i}_UserID`,
          `O${i}_UserName`,
        );
      }
      for (let i = 1; i <= 6; i++) {
        headers.push(
          `T${i}_Name`,
          `T${i}_Type`,
          `T${i}_UserID`,
          `T${i}_UserName`,
        );
      }

      await window.gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: "Schedule!A1:BX1",
        valueInputOption: "USER_ENTERED",
        resource: { values: [headers] },
      });

      console.log("Schedule sheet created successfully");
    } else {
      console.log("Schedule sheet already exists");
    }
  } catch (error) {
    console.error("Error initializing schedule sheet:", error);
    throw error;
  }
};

// ========== PARKING SCHEDULE FUNCTIONS ==========

export const loadParkingSchedule = async (
  accessToken: string,
): Promise<DaySchedule[]> => {
  try {
    await initGapi(accessToken);
    const response = await window.gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "Schedule!A2:BX6", // 5 rows (Mon-Fri), 72 columns (18 slots * 4)
    });
    const rows = response.result.values || [];

    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    const schedule: DaySchedule[] = [];

    for (let i = 0; i < days.length; i++) {
      const dayData = rows[i] || [];

      // Parse office slots (12 slots, each taking 4 columns)
      const officeSlots: ParkingSlot[] = [];
      for (let j = 0; j < 12; j++) {
        const colIndex = j * 4;
        officeSlots.push({
          slotName: dayData[colIndex] || `O${j + 1}`,
          slotType: (dayData[colIndex + 1] || "Short") as "Long" | "Short",
          userId: dayData[colIndex + 2] || null,
          userName: dayData[colIndex + 3] || null,
        });
      }

      // Parse temple slots (6 slots, starting after office slots)
      const templeSlots: ParkingSlot[] = [];
      const templeStartCol = 48; // 12 office slots * 4 columns
      for (let j = 0; j < 6; j++) {
        const colIndex = templeStartCol + j * 4;
        templeSlots.push({
          slotName: dayData[colIndex] || `T${j + 1}`,
          slotType: (dayData[colIndex + 1] || "Short") as "Long" | "Short",
          userId: dayData[colIndex + 2] || null,
          userName: dayData[colIndex + 3] || null,
        });
      }

      schedule.push({
        day: days[i],
        office: officeSlots,
        temple: templeSlots,
      });
    }

    return schedule;
  } catch (error) {
    console.error("Error loading parking schedule:", error);
    return [];
  }
};

export const saveParkingSchedule = async (
  schedule: DaySchedule[],
  accessToken: string,
): Promise<void> => {
  try {
    await initGapi(accessToken);

    const values: any[][] = [];

    schedule.forEach((daySchedule) => {
      const row: any[] = [];

      // Add office slots (12 slots * 4 columns each)
      daySchedule.office.forEach((slot) => {
        row.push(
          slot.slotName,
          slot.slotType,
          slot.userId || "",
          slot.userName || "",
        );
      });

      // Add temple slots (6 slots * 4 columns each)
      daySchedule.temple.forEach((slot) => {
        row.push(
          slot.slotName,
          slot.slotType,
          slot.userId || "",
          slot.userName || "",
        );
      });

      values.push(row);
    });

    console.log("Saving schedule data:", values); // Debug log

    await window.gapi.client.sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: "Schedule!A2:BX6", // 5 days, 72 columns
      valueInputOption: "USER_ENTERED",
      resource: { values },
    });

    console.log("Schedule saved successfully");
  } catch (error) {
    console.error("Error saving parking schedule:", error);
    throw error;
  }
};

// Helper function to initialize default schedule if needed
export const initializeDefaultSchedule = (): DaySchedule[] => {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  return days.map((day) => ({
    day,
    office: Array.from({ length: 12 }, (_, i) => ({
      slotName: `O${i + 1}`,
      slotType: "Short" as "Long" | "Short",
      userId: null,
      userName: null,
    })),
    temple: Array.from({ length: 6 }, (_, i) => ({
      slotName: `T${i + 1}`,
      slotType: "Short" as "Long" | "Short",
      userId: null,
      userName: null,
    })),
  }));
};
