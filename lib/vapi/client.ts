const OMNIDIM_BASE = process.env.OMNIDIM_BASE_URL || 'https://backend.omnidim.io/api/v1';
const API_KEY = process.env.OMNIDIM_API_KEY;

const headers = {
  'Authorization': `Bearer ${API_KEY}`,
  'Content-Type': 'application/json',
};

export const vapi = {
  // This function creates an OmniDimensions Agent
  createAssistant: async (config: { name: string, instructions: string, calendarLink?: string }) => {
    // Build context breakdown with instructions
    const contextBreakdown = [
      {
        title: "Instructions",
        body: config.instructions,
        is_enabled: true,
      },
    ];

    // If calendar link is provided, add it as a separate context block
    if (config.calendarLink) {
      contextBreakdown.push({
        title: "Booking Link",
        body: `The booking link is: ${config.calendarLink}. You can tell the customer to visit this link to book an appointment.`,
        is_enabled: true,
      });
    }

    // Simplified payload – only what's needed
    const body: any = {
      name: config.name,
      welcome_message: `Hello, this is ${config.name} assistant. How can I help?`,
      context_breakdown: contextBreakdown,
      // Webhook configuration – this is what sends data to your system
      post_call_actions: {
        webhook: {
          url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/vapi/webhook`,
          extracted_variables: [
            { key: "customer_name", prompt: "Extract the customer's full name." },
            { key: "customer_phone", prompt: "Extract the customer's phone number." },
            { key: "appointment_time", prompt: "Extract the appointment time or date if mentioned." },
            { key: "status", prompt: "Determine the call status: Booked, General Inquiry, No Answer." },
            { key: "address", prompt: "Extract any address mentioned by the customer." },
          ],
          trigger_call_statuses: ["completed"],
        },
      },
    };

    const res = await fetch(`${OMNIDIM_BASE}/agents/create`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('OmniDimensions agent creation failed:', err);
      throw new Error(`OmniDimensions agent creation failed: ${err}`);
    }

    const data = await res.json();
    // OmniDimensions returns { id: <agent_id>, name: ..., status: "Completed" }
    return { assistantId: String(data.id) };
  },

  // This function triggers an outbound call using OmniDimensions
  triggerCall: async (phoneNumber: string, assistantId: string) => {
    const body = {
      agent_id: parseInt(assistantId, 10),
      phone_number: phoneNumber,
      dynamic_variables: {},
    };

    const res = await fetch(`${OMNIDIM_BASE}/calls/dispatch`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`OmniDimensions outbound call failed: ${err}`);
    }

    return await res.json();
  },
};