import { NextResponse } from "next/server";
import OpenAI from "openai";

const systemPrompt = `Welcome to HeadstarterAI Support! I'm here to help you navigate through your AI-powered interview process. Whether you need assistance with setting up your interview, technical support, or have questions about how to best prepare, just type your query below.

If you're ready to start, you can also say "Begin interview," and I'll guide you through the process. How can I assist you today?`;

const OPENAI_API_KEY = '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';

export async function POST(req) {
  try {
    // Log the API key to verify it is being read correctly
    console.log("Using OpenAI API Key:", OPENAI_API_KEY);

    const openai = new OpenAI({
      apiKey: OPENAI_API_KEY.trim(),  // Ensure no leading/trailing spaces
    });

    const data = await req.json();
    console.log("Received data:", data);

    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        ...data,
      ],
      model: 'gpt-4o-mini',  // Use a valid model name from the list
      stream: true,
    });

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const chunk of completion) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              const text = encoder.encode(content);
              controller.enqueue(text);
            }
          }
        } catch (err) {
          console.error("Error during streaming:", err);
          controller.error(err);
        } finally {
          controller.close();
        }
      },
    });

    return new NextResponse(stream);

  } catch (error) {
    console.error("Error in POST /api/chat:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
