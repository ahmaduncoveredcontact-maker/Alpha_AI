const VAPI_BASE = process.env.VAPI_BASE_URL || 'https://api.vapi.ai';
const API_KEY = process.env.VAPI_API_KEY;

const headers = {
  'Authorization': `Bearer ${API_KEY}`,
  'Content-Type': 'application/json',
};

export const vapi = {
  createAssistant: async (config: { name: string, instructions: string, calendarLink?: string }) => {
    const body: any = {
      name: config.name,
      voice: {
        provider: '11labs',
        voiceId: '21m00Tcm4TlvDq8ikWAM', // default
      },
      firstMessage: `Hello, this is ${config.name} assistant. How can I help?`,
      model: {
        provider: 'openai',
        model: 'gpt-4-turbo',
        messages: [
          { role: 'system', content: config.instructions },
        ],
      },
      endCallMessage: 'Thank you for calling. Goodbye.',
    };
    // If a calendar link is provided, include it in the instructions
    if (config.calendarLink) {
      body.model.messages[0].content += `\n\nThe booking link is: ${config.calendarLink}. You can tell the customer to visit this link to book.`;
    }

    const res = await fetch(`${VAPI_BASE}/assistant`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Vapi assistant creation failed: ${err}`);
    }
    const data = await res.json();
    return { assistantId: data.id };
  },

  triggerCall: async (phoneNumber: string, assistantId: string) => {
    const body = {
      phoneNumber,
      assistantId,
    };
    const res = await fetch(`${VAPI_BASE}/call`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Vapi outbound call failed: ${err}`);
    }
    return await res.json();
  },
};