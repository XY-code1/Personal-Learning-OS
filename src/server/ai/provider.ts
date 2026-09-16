type ChatMessage = { role: "system" | "user"; content: string };

type ChatCompletionPayload = {
  choices?: Array<{ message?: { content?: unknown } }>;
};

export class AIConfigurationError extends Error {}
export class AIProviderError extends Error {}

export type AIProvider = {
  completeJson(messages: ChatMessage[]): Promise<unknown>;
};

export type UnderstandingReviewProvider = AIProvider;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getMessageContent(payload: unknown) {
  if (!isRecord(payload) || !Array.isArray(payload.choices)) throw new AIProviderError("AI response did not contain choices");
  const firstChoice = payload.choices[0];
  if (!isRecord(firstChoice) || !isRecord(firstChoice.message) || typeof firstChoice.message.content !== "string") {
    throw new AIProviderError("AI response did not contain message content");
  }
  return firstChoice.message.content;
}

function parseJson(content: string): unknown {
  const normalized = content.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  try {
    return JSON.parse(normalized) as unknown;
  } catch {
    throw new AIProviderError("AI response was not valid JSON");
  }
}

class OpenAICompatibleProvider implements AIProvider {
  constructor(private readonly baseUrl: string, private readonly apiKey: string, private readonly model: string) {}

  async completeJson(messages: ChatMessage[]) {
    let response: Response;
    try {
      response = await fetch(`${this.baseUrl.replace(/\/+$/, "")}/chat/completions`, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${this.apiKey}` },
        body: JSON.stringify({ model: this.model, messages, temperature: 0.1 }),
        signal: AbortSignal.timeout(30_000),
        cache: "no-store",
      });
    } catch {
      throw new AIProviderError("AI provider request failed");
    }

    if (!response.ok) throw new AIProviderError(`AI provider returned ${response.status}`);
    const payload = await response.json() as ChatCompletionPayload;
    return parseJson(getMessageContent(payload));
  }
}

export function createAIProvider(): AIProvider | null {
  const apiKey = process.env.AI_API_KEY?.trim() || process.env.AI_PROVIDER_KEY?.trim();
  const model = process.env.AI_MODEL_KEY?.trim();
  if (!apiKey || !model) return null;
  return new OpenAICompatibleProvider(process.env.AI_BASE_URL?.trim() || "https://api.openai.com/v1", apiKey, model);
}

export function createUnderstandingReviewProvider(): UnderstandingReviewProvider | null {
  return createAIProvider();
}
