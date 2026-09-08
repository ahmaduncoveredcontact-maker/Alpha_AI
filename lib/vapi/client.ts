const OMNIDIM_BASE = process.env.OMNIDIM_BASE_URL || 'https://omnidim.io/api/v1';
const API_KEY = process.env.OMNIDIM_API_KEY;

const headers = {
  'Authorization': `Bearer ${API_KEY}`,
  'Content-Type': 'application/json',
};

// Define the structured data schema (same as before – OmniDimensions uses extracted_variables)
const STRUCTURED_DATA_SCHEMA = {
  type: 'object',
  properties: {
    customer_name: { type: 'string' },
    customer_phone: { type: 'string' },
    appointment_time: { type: 'string' },
    status: { type: 'string' },
    address: { type: 'string' },
  },
};

export const vapi = {
  // This function creates an OmniDimensions Agent (equivalent to Vapi assistant)
  createAssistant: async (config: { name: string, instructions: string, calendarLink?: string }) => {
    const body: any = {
      name: config.name,
      welcome_message: `Hello, this is ${config.name} assistant. How can I help?`,
      dynamic_variables: {
        business_name: config.name,
      },
      context_breakdown: [
        {
          title: "Instructions",
          body: config.instructions,
          is_enabled: true,
        },
      ],
      transcriber: {
        provider: "deepgram_stream",
        model: "nova-3",
        language: "en-US",
        silence_timeout_ms: 400,
        interruption_min_words: 2,
        max_call_duration_in_sec: 600,
      },
      model: {
        model: "gpt-4o-mini",
        temperature: 0.7,
      },
      voice: {
        provider: "eleven_labs",
        voice_id: "21m00Tcm4TlvDq8ikWAM", // default
        model: "sonic-3.5",
        speech_speed: 1,
      },
      post_call_actions: {
        webhook: {
          url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/vapi/webhook`,
          extracted_variables: [
            { key: "customer_name", prompt: "Extract the customer's full name." },
            { key: "customer_phone", prompt: "Extract the customer's phone number." },
            { key: "appointment_time", prompt: "Extract the appointment time or date if mentioned." },
            { key: "status", prompt: "Determine the call status: Booked, General Inquiry, No Answer, etc." },
            { key: "address", prompt: "Extract any address mentioned by the customer." },
          ],
          trigger_call_statuses: ["completed"],
        },
      },
      transfer: {
        transfer_options: [
          {
            number: "", // not used – we keep this optional
            type: "static",
            transfer_condition: "Transfer if the customer asks to speak with a human.",
            transfer_message: "Please hold while I connect you to one of our agents.",
          },
        ],
      },
      end_call: {
        condition: "End the call once the customer's issue is resolved or they confirm booking.",
        message: "Thank you for calling. Goodbye.",
        message_prompt: "End the call politely in the same language the user is speaking.",
      },
      languages: ["English"],
    };

    // If calendar link is provided, add it to the context so the assistant can guide the customer
    if (config.calendarLink) {
      body.context_breakdown.push({
        title: "Booking Link",
        body: `The booking link is: ${config.calendarLink}. You can tell the customer to visit this link to book an appointment.`,
        is_enabled: true,
      });
    }

    const res = await fetch(`${OMNIDIM_BASE}/agents/create`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`OmniDimensions agent creation failed: ${err}`);
    }

    const data = await res.json();
    // OmniDimensions returns { id: <agent_id>, name: ..., status: "Completed" }
    return { assistantId: String(data.id) };
  },

  // This function triggers an outbound call using OmniDimensions
  triggerCall: async (phoneNumber: string, assistantId: string) => {
    const body = {
      agent_id: parseInt(assistantId, 10), // agent_id is numeric
      phone_number: phoneNumber,
      dynamic_variables: {
        // You can pass custom variables here if needed
      },
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