import { google } from 'googleapis';

// Reuse the same JWT auth from sheets, but add My Business scopes
const auth = new google.auth.JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  scopes: [
    'https://www.googleapis.com/auth/business.manage',
    'https://www.googleapis.com/auth/spreadsheets',
  ],
});

const myBusiness = google.mybusinessbusinessinformation({ version: 'v1', auth });
const myBusinessAccount = google.mybusinessaccountmanagement({ version: 'v1', auth });

export const gbp = {
  // List all accounts accessible by the service account
  listAccounts: async () => {
    const res = await myBusinessAccount.accounts.list();
    return res.data.accounts || [];
  },

  // List locations for a given account ID
  listLocations: async (accountId: string) => {
    const res = await myBusiness.locations.list({
      parent: `accounts/${accountId}`,
      pageSize: 100,
    });
    return res.data.locations || [];
  },

  // Fetch new reviews since lastChecked for a location
  getNewReviews: async (accountId: string, locationId: string, lastChecked: string) => {
    const url = `https://mybusiness.googleapis.com/v4/accounts/${accountId}/locations/${locationId}/reviews`;
    const token = await auth.getAccessToken();
    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Failed to fetch reviews: ${err}`);
    }
    const data = await res.json();
    const reviews = data.reviews || [];
    return reviews.filter((r: any) => {
      const reviewDate = new Date(r.createTime);
      const after = new Date(lastChecked);
      return reviewDate > after && r.starRating === 'FIVE' && !r.reply;
    });
  },

  // Post a reply to a review
  postReply: async (accountId: string, locationId: string, reviewId: string, reply: string) => {
    const url = `https://mybusiness.googleapis.com/v4/accounts/${accountId}/locations/${locationId}/reviews/${reviewId}/reply`;
    const token = await auth.getAccessToken();
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reply }),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Failed to post reply: ${err}`);
    }
    return res.json();
  },
};
