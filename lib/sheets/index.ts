import { google } from 'googleapis';

const auth = new google.auth.JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });
const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID!;
const HEADER_ROW = [
  'client_slug',
  'timestamp',
  'call_type',
  'customer_name',
  'customer_phone',
  'summary',
  'status',
  'booked_time',
  'recording_url',
  'call_id',
  'address',
];

async function tabExists(slug: string): Promise<boolean> {
  try {
    const response = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
      fields: 'sheets.properties',
    });
    const sheetsList = response.data.sheets || [];
    return sheetsList.some((s) => s.properties?.title === slug);
  } catch (err) {
    console.warn('Could not check tab existence:', err);
    return false;
  }
}

export const createTab = async (slug: string) => {
  try {
    const exists = await tabExists(slug);
    if (exists) {
      console.log(`Tab "${slug}" already exists.`);
      return;
    }

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
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${slug}!A1:K1`,
      valueInputOption: 'RAW',
      requestBody: { values: [HEADER_ROW] },
    });
    console.log(`✅ Tab "${slug}" created with headers.`);
  } catch (error: any) {
    if (error.message?.includes('already exists')) {
      console.log(`Tab "${slug}" already exists (race condition).`);
      return;
    }
    console.error(`❌ Failed to create tab "${slug}":`, error.message);
    throw error;
  }
};

export const appendRow = async (slug: string, row: any[]) => {
  await createTab(slug);
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${slug}!A:K`,
    valueInputOption: 'RAW',
    requestBody: { values: [row] },
  });
};

export const getRows = async (slug: string) => {
  try {
    const exists = await tabExists(slug);
    if (!exists) {
      console.log(`⚠️ Tab "${slug}" not found – returning empty.`);
      return [];
    }

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${slug}!A:K`,
    });
    const rows = response.data.values || [];
    if (rows.length < 2) return [];
    return rows
      .slice(1)
      .map((row: any[], idx: number) => ({
        _row: idx + 2, // 1-indexed, header is row 1, first data row is row 2
        client_slug: row[0],
        timestamp: row[1],
        call_type: row[2],
        customer_name: row[3],
        customer_phone: row[4],
        summary: row[5],
        status: row[6],
        booked_time: row[7],
        recording_url: row[8],
        call_id: row[9] || '',
        address: row[10] || '',
      }))
      .filter((row) => row.client_slug !== '__DELETED__'); // soft delete filter
  } catch (error: any) {
    if (error.message?.includes('Unable to parse range') || error.status === 400) {
      console.log(`⚠️ Tab "${slug}" missing – returning empty.`);
      return [];
    }
    console.error(`❌ Failed to fetch rows for "${slug}":`, error);
    throw error;
  }
};

// NEW: Update a specific row
export const updateRow = async (slug: string, rowNumber: number, data: any[]) => {
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${slug}!A${rowNumber}:K${rowNumber}`,
    valueInputOption: 'RAW',
    requestBody: { values: [data] },
  });
};

// NEW: Soft delete a row (mark client_slug as '__DELETED__')
export const deleteRow = async (slug: string, rowNumber: number) => {
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${slug}!A${rowNumber}`,
    valueInputOption: 'RAW',
    requestBody: { values: [['__DELETED__']] },
  });
};