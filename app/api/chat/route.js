import { NextResponse } from "next/server";
import OpenAI from "openai";
import { Pinecone } from "@pinecone-database/pinecone";

export async function POST(req) {
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY.trim(),
    });

    const pc = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY.trim(),
    });

    const index = pc.index("ml");

    const value = await req.json();
    const data = value.messages.map((message) => ({
      role: "user",
      content: message.content,
    }));

    const language = value.language ? value.language : "English";

    // Create embeddings for the user messages
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: data.map((d) => d.content).join(" "),
    });

    const queryEmbedding = embeddingResponse.data[0].embedding;

    const queryResults = await index.query({
      topK: 3,
      vector: queryEmbedding,
      includeValues: true,
      includeMetadata: true,
    });

    const retrievedTexts = queryResults.matches.map(
      (match) => match.metadata.text
    );

    const context = retrievedTexts.join("\n");

    const systemPrompt = `
      The following is the relevant information to answer the user's query. Please base your response strictly on this information:

      ${context}
      if the input is not related to the Machine Learning, please respond with "I can only answer question about Machine Learning".
      Respond in ${language}:
    `;

    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        ...data,
      ],
      model: "gpt-4o-mini",
      stream: true,
      max_tokens: 150,
      temperature: 0.7,
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
