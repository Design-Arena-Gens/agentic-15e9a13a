import { NextResponse } from "next/server";
import { z } from "zod";
import { callOpenRouter, type ChatMessage } from "@/lib/openrouter";
import { findBestMatch, rankMatches } from "@/lib/googleSheets";

const messageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string().min(1).max(4000),
});

const requestSchema = z.object({
  messages: z.array(messageSchema).min(1),
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const { messages } = requestSchema.parse(json);

    const latestUserMessage = [...messages]
      .reverse()
      .find((message) => message.role === "user");

    if (!latestUserMessage) {
      return NextResponse.json(
        { error: "A user message is required." },
        { status: 400 },
      );
    }

    const bestMatch = await findBestMatch(latestUserMessage.content);
    if (bestMatch && bestMatch.score >= 0.45 && bestMatch.answer) {
      return NextResponse.json({
        reply: bestMatch.answer,
        source: {
          type: "sheet",
          matchScore: bestMatch.score,
          question: bestMatch.question,
        },
      });
    }

    const rankedMatches = await rankMatches(latestUserMessage.content, 3);
    const context = rankedMatches
      .map(
        (match, index) =>
          `Entry ${index + 1} — Relevance: ${(match.score * 100).toFixed(0)}%\nQuestion: ${match.question}\nAnswer: ${match.answer}`,
      )
      .join("\n\n");

    const systemPrompt =
      rankedMatches.length > 0
        ? `You are a helpful support assistant. Base your answer on the most relevant entries from the knowledge base below. If the knowledge base does not contain the answer, respond with your best effort but be transparent that you used the language model.\n\nKnowledge Base:\n${context}`
        : `You are a helpful support assistant. No relevant entries were found in the knowledge base, so answer the question using general knowledge. Make it clear to the user that the answer comes from the language model.`;

    const completionMessages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      ...messages.map((message) => ({
        role: message.role,
        content: message.content,
      })),
    ];

    const responseText = await callOpenRouter(completionMessages);

    return NextResponse.json({
      reply: responseText,
      source: {
        type: "openrouter",
        matchScore: bestMatch?.score ?? 0,
        question: bestMatch?.question ?? null,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unexpected error while processing the request.",
      },
      { status: 500 },
    );
  }
}
