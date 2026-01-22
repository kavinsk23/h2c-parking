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
    const response = await window.gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "Users!A:A",
    });
    const rows = response.result.values || [];
    const rowIndex = rows.findIndex((row: string[]) => row[0] === user.id);

    if (rowIndex === -1) {
      throw new Error("User not found");
    }

    await window.gapi.client.sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `Users!A${rowIndex + 2}:D${rowIndex + 2}`,
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
    const response = await window.gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "Users!A:A",
    });
    const rows = response.result.values || [];
    const rowIndex = rows.findIndex((row: string[]) => row[0] === userId);

    if (rowIndex === -1) {
      throw new Error("User not found");
    }

    await window.gapi.client.sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      resource: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: 0,
                dimension: "ROWS",
                startIndex: rowIndex + 1,
                endIndex: rowIndex + 2,
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
