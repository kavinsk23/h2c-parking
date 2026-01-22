const SPREADSHEET_ID = "1jh-oJ4jT9ClmOGQJQzgV8cCJPrUMOF9uwsA3uM5b7ss";

export interface User {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
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

export const loadUsers = async (accessToken: string): Promise<User[]> => {
  try {
    await initGapi(accessToken);
    const response = await window.gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "Users!A2:D",
    });
    const rows = response.result.values || [];
    return rows.map((row: string[]) => ({
      id: row[0] || "",
      name: row[1] || "",
      email: row[2] || "",
      role: (row[3] || "user") as "user" | "admin",
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
      range: "Users!A:D",
      valueInputOption: "USER_ENTERED",
      resource: { values: [[user.id, user.name, user.email, user.role]] },
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
    // rowIndex is 0-based where 0 = header row
    // So actual data row number = rowIndex + 1
    const sheetRow = rowIndex + 1;

    await window.gapi.client.sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `Users!A${sheetRow}:D${sheetRow}`,
      valueInputOption: "USER_ENTERED",
      resource: { values: [[user.id, user.name, user.email, user.role]] },
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
    // rowIndex is already 0-based where 0 = header
    // So we use rowIndex directly as startIndex
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
