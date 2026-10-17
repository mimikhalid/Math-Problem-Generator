// Shared Gemini caller with model fallback.
// The free tier allows only ~20 requests per day *per model*, so when one model is out of quota (429),
// unavailable to this key (404/403) or overloaded (503) we move on to the next model in the list.

const apiKey = process.env.GOOGLE_API_KEY;

/** Override with GEMINI_MODELS="model-a,model-b" (or a single GEMINI_MODEL) in .env.local. */
const MODELS = (process.env.GEMINI_MODELS || process.env.GEMINI_MODEL
    || 'gemini-3.8-flash,gemini-3.7-flash,gemini-3.6-flash,gemini-3.5-flash-lite,gemini-3.1-flash-lite')
    .split(',').map(m => m.trim()).filter(Boolean);

// Models that just returned 429 are skipped for a while instead of being retried on every request.
// Lives per server instance, which is enough to avoid wasting calls on a model we know is exhausted.
const COOLDOWN_MS = 30 * 60 * 1000;
const DEFAULT_TIMEOUT_MS = 20 * 1000;
const exhaustedUntil = new Map<string, number>();

/**
 * Sends `payload` (a generateContent body with a JSON responseSchema) and returns the parsed JSON
 * once `isValid` accepts it, or null if every model failed.
 */
export async function generateJson<T>(
    payload: object,
    isValid: (data: any) => boolean,
    label: string,
    // Batches (a whole set or worksheet) take longer to write than a single item
    timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<T | null> {
    const now = Date.now();
    const available = MODELS.filter(m => (exhaustedUntil.get(m) ?? 0) <= now);
    // If everything is cooling down, try them all anyway rather than failing without a call
    const models = available.length > 0 ? available : MODELS;

    for (const model of models) {
        // Two tries per model covers a malformed response or a brief network error
        for (let attempt = 0; attempt < 2; attempt++) {
            try {
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                    // A model that hangs shouldn't hold the student up; move on to the next one
                    signal: AbortSignal.timeout(timeoutMs),
                });

                if (!response.ok) {
                    const detail = (await response.text()).slice(0, 300);
                    if (response.status === 429) {
                        exhaustedUntil.set(model, Date.now() + COOLDOWN_MS);
                        console.warn(`[${label}] ${model} is out of quota (429), trying next model.`);
                    } else {
                        console.warn(`[${label}] ${model} returned ${response.status}, trying next model: ${detail}`);
                    }
                    break; // next model
                }

                const result = await response.json();
                const jsonText = result.candidates?.[0]?.content?.parts?.[0]?.text;
                if (!jsonText) throw new Error('empty response');

                const data = JSON.parse(jsonText);
                if (!isValid(data)) throw new Error('response did not match the expected shape');
                return data as T;

            } catch (error) {
                console.warn(`[${label}] ${model} attempt ${attempt + 1} failed: ${error}`);
                if (error instanceof Error && error.name === 'TimeoutError') break; // too slow: next model
            }
        }
    }

    console.error(`[${label}] all Gemini models failed (${models.join(', ')}).`);
    return null;
}
