import { GoogleGenAI, Type } from "@google/genai";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

async function getMcpClient() {
  const client = new Client({ name: "empay-chat", version: "1.0.0" });
  const transport = new StreamableHTTPClientTransport(
    new URL(`${process.env.NEXT_PUBLIC_APP_URL}/api/mcp/mcp`)
  );
  await client.connect(transport);
  return client;
}

// Convert MCP tool schema to Gemini function declaration format
function mcpToolToGemini(tool: any) {
  return {
    name: tool.name,
    description: tool.description,
    parameters: {
      type: Type.OBJECT,
      properties: Object.fromEntries(
        Object.entries(tool.inputSchema?.properties ?? {}).map(([key, val]: any) => [
          key,
          {
            type: val.type === "number" ? Type.NUMBER
              : val.type === "integer" ? Type.NUMBER
              : val.enum ? Type.STRING
              : Type.STRING,
            description: val.description ?? "",
            ...(val.enum ? { enum: val.enum } : {}),
          },
        ])
      ),
      required: tool.inputSchema?.required ?? [],
    },
  };
}

// POST /api/chat — Send a message and get a response
export async function POST(req: NextRequest) {
  let mcpClient: Client | null = null;

  try {
    const userId = await getSession();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, companyId: true, name: true },
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const { messages, conversationId } = await req.json();

    // Resolve or create conversation
    let convId = conversationId;
    if (!convId) {
      const conv = await prisma.chatConversation.create({
        data: { userId, title: messages[0]?.content?.slice(0, 80) || "New conversation" },
      });
      convId = conv.id;
    }

    // Save the user message
    const lastUserMsg = messages[messages.length - 1];
    await prisma.chatMessage.create({
      data: { conversationId: convId, role: "user", content: lastUserMsg.content },
    });

    // Connect to MCP server and get tools
    mcpClient = await getMcpClient();
    const { tools } = await mcpClient.listTools();
    const geminiTools = [{ functionDeclarations: tools.map(mcpToolToGemini) }];

    const systemPrompt = `You are a professional HR assistant for EmPay HRMS.
Current user: ${user.name} (ID: ${user.id}), Company ID: ${user.companyId}, Role: ${user.role}.
Current date/time: ${new Date().toISOString()}.

IMPORTANT - When calling tools:
- Always pass userId as "${user.id}" for self-service queries.
- Always pass companyId as "${user.companyId}" for company-wide queries.
- For date queries without explicit dates, use the current month/year.

RULES:
- Respond in clean, well-structured Markdown.
- Use tables (GFM syntax) when presenting structured/tabular data.
- Use headings, bold, lists, and code blocks where appropriate.
- NEVER use emojis.
- Be concise, factual, and professional.
- When showing numerical data, use proper formatting.
- Always use the available tools to fetch real data before answering.`;

    const chat = genai.chats.create({
      model: "gemini-2.5-flash",
      config: { systemInstruction: systemPrompt, tools: geminiTools },
      history: messages.slice(0, -1).map((m: any) => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.content }],
      })),
    });

    let response = await chat.sendMessage({ message: lastUserMsg.content });

    // Agentic loop - keep going while Gemini wants to call MCP tools
    let iterations = 0;
    while (response.functionCalls && response.functionCalls.length > 0 && iterations < 10) {
      iterations++;
      const functionResults = [];

      for (const call of response.functionCalls) {
        const result = await mcpClient.callTool({
          name: call.name!,
          arguments: call.args as Record<string, unknown>,
        });

        functionResults.push({
          functionResponse: {
            name: call.name!,
            response: { result: result.content },
          },
        });
      }

      response = await chat.sendMessage({ message: functionResults });
    }

    const reply = response.text ?? "Sorry, I could not generate a response.";

    // Save assistant message
    await prisma.chatMessage.create({
      data: { conversationId: convId, role: "assistant", content: reply },
    });

    // Update conversation title if first exchange
    if (!conversationId) {
      await prisma.chatConversation.update({
        where: { id: convId },
        data: { title: lastUserMsg.content.slice(0, 80) },
      });
    }

    return NextResponse.json({ reply, conversationId: convId });
  } catch (err) {
    console.error("Chat error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  } finally {
    if (mcpClient) {
      try { await mcpClient.close(); } catch { /* silent */ }
    }
  }
}

// GET /api/chat — Fetch conversations list or a specific conversation's messages
export async function GET(req: NextRequest) {
  try {
    const userId = await getSession();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const convId = searchParams.get("conversationId");

    if (convId) {
      const conversation = await prisma.chatConversation.findFirst({
        where: { id: convId, userId },
        include: { messages: { orderBy: { createdAt: "asc" } } },
      });
      if (!conversation) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json({ conversation });
    }

    const conversations = await prisma.chatConversation.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      select: { id: true, title: true, updatedAt: true, _count: { select: { messages: true } } },
      take: 50,
    });

    return NextResponse.json({ conversations });
  } catch (err) {
    console.error("Chat GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/chat — Delete a conversation
export async function DELETE(req: NextRequest) {
  try {
    const userId = await getSession();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { conversationId } = await req.json();
    if (!conversationId) return NextResponse.json({ error: "conversationId required" }, { status: 400 });

    const conv = await prisma.chatConversation.findFirst({ where: { id: conversationId, userId } });
    if (!conv) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.chatConversation.delete({ where: { id: conversationId } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Chat DELETE error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}