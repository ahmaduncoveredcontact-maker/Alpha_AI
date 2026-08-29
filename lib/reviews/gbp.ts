import { google } from 'googleapis';

// Reuse JWT auth from sheets
const auth = new google.auth.JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  scopes: [
    'https://www.googleapis.com/auth/business.manage',
    'https://www.googleapis.com/auth/spreadsheets',
  ],
});

// Helper to get access token
const getToken = async () => {
  await auth.authorize();
  return auth.credentials.access_token;
};

export const gbp = {
  // List all accounts (v1 Account Management API)
  listAccounts: async () => {
    const token = await getToken();
    const url = 'https://mybusinessaccountmanagement.googleapis.com/v1/accounts';
    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Failed to list accounts: ${err}`);
    }
    const data = await res.json();
    return data.accounts || [];
  },

  // List locations for a given account (v1 Business Information API)
  listLocations: async (accountId: string) => {
    const token = await getToken();
    const url = `https://mybusinessbusinessinformation.googleapis.com/v1/accounts/${accountId}/locations?pageSize=100`;
    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Failed to list locations: ${err}`);
    }
    const data = await res.json();
    return data.locations || [];
  },

  // Fetch new reviews (v4 legacy API – still needed for reviews)
  getNewReviews: async (accountId: string, locationId: string, lastChecked: string) => {
    const token = await getToken();
    const url = `https://mybusiness.googleapis.com/v4/accounts/${accountId}/locations/${locationId}/reviews`;
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
    // Filter reviews after lastChecked, 5-star, no reply
    return reviews.filter((r: any) => {
      const reviewDate = new Date(r.createTime);
      const after = new Date(lastChecked);
      return reviewDate > after && r.starRating === 'FIVE' && !r.reply;
    });
  },

  // Post a reply to a review (v4 legacy API)
  postReply: async (accountId: string, locationId: string, reviewId: string, reply: string) => {
    const token = await getToken();
    const url = `https://mybusiness.googleapis.com/v4/accounts/${accountId}/locations/${locationId}/reviews/${reviewId}/reply`;
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