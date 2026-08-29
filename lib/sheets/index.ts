import { google } from 'googleapis';

const auth = new google.auth.JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });
const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID!;
const HEADER_ROW = ['client_slug', 'timestamp', 'call_type', 'customer_name', 'customer_phone', 'summary', 'status', 'booked_time', 'recording_url'];

export const createTab = async (slug: string) => {
  try {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: [{
          addSheet: {
            properties: { title: slug },
          },
        }],
      },
    });
    // Add header row
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${slug}!A1:I1`,
      valueInputOption: 'RAW',
      requestBody: { values: [HEADER_ROW] },
    });
  } catch (error: any) {
    if (error.message?.includes('already exists')) {
      // Sheet already exists � fine
      return;
    }
    throw error;
  }
};

export const appendRow = async (slug: string, row: any[]) => {
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${slug}!A:I`,
    valueInputOption: 'RAW',
    requestBody: { values: [row] },
  });
};

export const getRows = async (slug: string) => {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${slug}!A:I`,
  });
  const rows = response.data.values || [];
  if (rows.length < 2) return [];
  // Skip header row
  return rows.slice(1).map((row: any[]) => ({
    client_slug: row[0],
    timestamp: row[1],
    call_type: row[2],
    customer_name: row[3],
    customer_phone: row[4],
    summary: row[5],
    status: row[6],
    booked_time: row[7],
    recording_url: row[8],
  }));
};
