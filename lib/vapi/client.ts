const OMNIDIM_BASE = process.env.OMNIDIM_BASE_URL || 'https://backend.omnidim.io/api/v1';
const API_KEY = process.env.OMNIDIM_API_KEY;
const CALCOM_API_KEY = process.env.CALCOM_API_KEY;

const headers = {
  'Authorization': `Bearer ${API_KEY}`,
  'Content-Type': 'application/json',
};

export const vapi = {
  createAssistant: async (config: { 
    name: string, 
    instructions: string, 
    calEventSlug?: string,
  }) => {
    const contextBreakdown = [
      {
        title: "Instructions",
        body: config.instructions,
        is_enabled: true,
      },
    ];

    if (config.calEventSlug) {
      contextBreakdown.push({
        title: "Booking Info",
        body: `You can book appointments using the "Book_Appointment" tool. The event slug is ${config.calEventSlug}.`,
        is_enabled: true,
      });
    }

    const body: any = {
      name: config.name,
      welcome_message: `Hello, this is ${config.name} assistant. How can I help?`,
      context_breakdown: contextBreakdown,
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

    if (CALCOM_API_KEY && config.calEventSlug) {
      body.tools = [
        {
          name: "Book_Appointment",
          description: "Books an appointment using Cal.com. Use this when the customer confirms a date and time.",
          method: "POST",
          url: "https://api.cal.com/v2/bookings",
          headers: {
            "Authorization": `Bearer ${CALCOM_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: {
            eventTypeSlug: config.calEventSlug,
            start: "{{customer_date_time}}",
            timeZone: "{{customer_timezone}}",
            responses: {
              name: "{{customer_name}}",
              phone: "{{customer_phone}}",
              notes: "{{customer_notes}}",
            },
          },
          successMessage: "Appointment booked successfully for {{start}}.",
          failureMessage: "Sorry, that time is not available. Please suggest another time.",
        }
      ];
    }

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
    return { assistantId: String(data.id) };
  },

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