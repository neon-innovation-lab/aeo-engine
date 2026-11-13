/**
 * Minimal bring-your-own-key LLM client used by the citation scanner.
 * Set GEMINI_API_KEY (preferred) or OPENAI_API_KEY. No keys are bundled.
 */
export interface AiOptions {
    json?: boolean;
    noMarkdown?: boolean;
}

export async function callAI<T = string>(systemPrompt: string, userPrompt: string, options: AiOptions = {}): Promise<T> {
    const geminiKey = process.env.GEMINI_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;
    let text = "";

    if (geminiKey) {
        const model = process.env.AEO_GEMINI_MODEL || "gemini-2.0-flash";
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-goog-api-key": geminiKey },
            body: JSON.stringify({
                systemInstruction: { parts: [{ text: systemPrompt }] },
                contents: [{ role: "user", parts: [{ text: userPrompt }] }],
                generationConfig: options.json ? { responseMimeType: "application/json" } : {}
            })
        });
        if (!res.ok) throw new Error(`Gemini API error ${res.status}`);
        const data: any = await res.json();
        text = data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text || "").join("") || "";
    } else if (openaiKey) {
        const model = process.env.AEO_OPENAI_MODEL || "gpt-4o-mini";
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${openaiKey}` },
            body: JSON.stringify({
                model,
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt }
                ],
                ...(options.json ? { response_format: { type: "json_object" } } : {})
            })
        });
        if (!res.ok) throw new Error(`OpenAI API error ${res.status}`);
        const data: any = await res.json();
        text = data?.choices?.[0]?.message?.content || "";
    } else {
        throw new Error("Set GEMINI_API_KEY or OPENAI_API_KEY to run the citation scan.");
    }

    if (options.noMarkdown) text = text.replace(/```[a-z]*\n?/gi, "").trim();
    return (options.json ? JSON.parse(text) : text) as T;
}
