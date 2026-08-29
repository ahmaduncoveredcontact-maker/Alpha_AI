import { Client as QStashClient } from '@upstash/qstash';

const qstash = new QStashClient({
  token: process.env.QSTASH_TOKEN!,
});

export const queue = {
  enqueue: async (url: string, payload: any) => {
    await qstash.publish({
      url,
      body: payload,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  },
};
