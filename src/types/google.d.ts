declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: google.accounts.id.CredentialResponse) => void;
          }) => void;
          prompt: (callback?: (notification: any) => void) => void;
          disableAutoSelect: () => void;
          renderButton: (parent: HTMLElement, options: any) => void;
        };
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: { access_token: string }) => void;
          }) => {
            requestAccessToken: () => void;
          };
        };
      };
    };
    gapi: {
      load: (api: string, callback: () => void) => void;
      client: {
        init: (config: { discoveryDocs: string[] }) => Promise<void>;
        setToken: (token: { access_token: string }) => void;
        sheets: {
          spreadsheets: {
            values: {
              get: (params: {
                spreadsheetId: string;
                range: string;
              }) => Promise<{ result: { values?: string[][] } }>;
              update: (params: {
                spreadsheetId: string;
                range: string;
                valueInputOption: string;
                resource: { values: string[][] };
              }) => Promise<void>;
            };
          };
        };
      };
    };
  }

  namespace google {
    namespace accounts {
      namespace id {
        interface CredentialResponse {
          credential: string;
          select_by: string;
        }
      }
    }
  }
}

export {};
