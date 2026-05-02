import { NextResponse } from "next/server";

/**
 * POST /api/realtime/session
 *
 * Creates an ephemeral token for the OpenAI Realtime API so the browser
 * can open a WebSocket directly without exposing the secret key.
 */
export async function POST() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("[realtime/session] OPENAI_API_KEY is not set");
    return NextResponse.json(
      { error: "OPENAI_API_KEY not configured" },
      { status: 500 },
    );
  }

  const MODEL = "gpt-4o-mini-realtime-preview-2024-12-17";

  try {
    console.log("[realtime/session] Creating session for model:", MODEL);

    const res = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        modalities: ["audio", "text"],
        instructions:
          "You are EmVoice, a helpful and friendly HR assistant for the EmPay HRMS platform. " +
          "You MUST speak in English only. Never change your language under any circumstances. " +
          "Answer questions asked by the user in English about leave policies, attendance, payroll, employee management, and general HR queries. " +
          "Do NOT create a ticket for general questions that you can answer yourself. ONLY use the 'generate_hr_ticket' tool if the user EXPLICITLY asks you to raise a ticket, report an issue to HR, or if they have a complex problem that requires human HR intervention (e.g., 'my pay is wrong'). Gather all necessary details BEFORE creating the ticket. " +
          "Keep answers concise (1-2 sentences max). Be warm, professional, and supportive.",
        voice: "shimmer",
        input_audio_format: "pcm16",
        output_audio_format: "pcm16",
        input_audio_transcription: { model: "whisper-1" },
        turn_detection: {
          type: "server_vad",
          threshold: 0.7,
          prefix_padding_ms: 300,
          silence_duration_ms: 1000,
        },
        tools: [
          {
            type: "function",
            name: "generate_hr_ticket",
            description: "Generate a ticket to HR/Admin ONLY when the user explicitly asks to raise a ticket or has a complex issue requiring human intervention.",
            parameters: {
              type: "object",
              properties: {
                title: { type: "string", description: "A clear, descriptive title summarizing the issue (must be at least 4-5 words). Example: 'Discrepancy in January Payroll Calculation'." },
                description: { type: "string", description: "Detailed explanation of the user's issue or query." }
              },
              required: ["title", "description"]
            }
          }
        ],
        tool_choice: "auto",
      }),
    });

    const text = await res.text();

    if (!res.ok) {
      console.error("[realtime/session] OpenAI error:", res.status, text);
      return NextResponse.json(
        { error: `OpenAI returned ${res.status}: ${text}` },
        { status: res.status },
      );
    }

    const data = JSON.parse(text);
    console.log("[realtime/session] Session created:", data.id, "model:", data.model);
    console.log("[realtime/session] client_secret present:", !!data.client_secret?.value);
    return NextResponse.json(data);
  } catch (err) {
    console.error("[realtime/session] Exception:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
