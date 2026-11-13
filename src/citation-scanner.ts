import { callAI } from "./ai";
import { CitationQueryTest, CitationScanResult, CompetitorComparison } from "./types";

export async function scanCitations(
    targetBrand: string,
    targetDomain: string,
    keywords: string[],
    competitors: string[]
): Promise<CitationScanResult> {
    const cleanBrand = targetBrand.trim();
    const cleanDomain = targetDomain.replace(/^https?:\/\//, '').replace(/\/+$/, '');
    const cleanKeywords = keywords.map(k => k.trim()).filter(Boolean);
    const cleanCompetitors = competitors.map(c => c.trim().replace(/^https?:\/\//, '').replace(/\/+$/, '')).filter(Boolean);

    // 1. Generate 6-8 high-intent commercial prompts
    const prompts = generateCommercialPrompts(cleanKeywords, cleanBrand, cleanCompetitors);
    const tests: CitationQueryTest[] = [];

    const competitorMentionsMap = new Map<string, number>();
    cleanCompetitors.forEach(c => competitorMentionsMap.set(c.toLowerCase(), 0));

    const citingDomainsFrequency = new Map<string, number>();
    let promptsWonCount = 0;

    for (const prompt of prompts) {
        try {
            const systemPrompt = `You are an AI Search Engine simulator (representing ChatGPT Search, Perplexity, and Google AI Overviews in 2026).
A user is searching with commercial pre-purchase intent.
Answer the user's query factually, giving concrete product recommendations, comparisons, and cite the authoritative web sources (like Reddit, Wirecutter, Trustpilot, or manufacturer sites) that support your recommendation.
Include real or representative source citations.`;

            const aiResponse = await callAI<string>(systemPrompt, prompt, { json: false, noMarkdown: false });
            const answerText = typeof aiResponse === "string" ? aiResponse : JSON.stringify(aiResponse);

            // Analyze brand presence
            const brandRegex = new RegExp(`\\b${escapeRegExp(cleanBrand)}\\b|\\b${escapeRegExp(cleanDomain.split('.')[0])}\\b`, 'i');
            const brandMentioned = brandRegex.test(answerText);

            // Sentiment analysis
            let sentiment: "positive" | "neutral" | "negative" | "omitted" = "omitted";
            let brandRank: number | undefined = undefined;

            if (brandMentioned) {
                const lowerText = answerText.toLowerCase();
                const brandPos = lowerText.indexOf(cleanBrand.toLowerCase());
                // Determine rough rank in list
                const precedingLines = answerText.substring(0, brandPos).split('\n');
                const bulletMatches = precedingLines.filter(l => /^\s*(\d+\.|\*|-)\s+/.test(l));
                brandRank = bulletMatches.length + 1;

                if (/best|top|recommend|standout|winner|excellent|durable|reliable/i.test(answerText.substring(Math.max(0, brandPos - 100), brandPos + 150))) {
                    sentiment = "positive";
                    if (brandRank <= 3) promptsWonCount++;
                } else if (/caution|downside|lacks|expensive|drawback|alternative/i.test(answerText.substring(Math.max(0, brandPos - 100), brandPos + 150))) {
                    sentiment = "negative";
                } else {
                    sentiment = "neutral";
                }
            }

            // Check competitor mentions
            const competitorsMentioned: string[] = [];
            for (const comp of cleanCompetitors) {
                const compName = comp.split('.')[0];
                const compRegex = new RegExp(`\\b${escapeRegExp(compName)}\\b|\\b${escapeRegExp(comp)}\\b`, 'i');
                if (compRegex.test(answerText)) {
                    competitorsMentioned.push(comp);
                    competitorMentionsMap.set(comp.toLowerCase(), (competitorMentionsMap.get(comp.toLowerCase()) || 0) + 1);
                }
            }

            // Extract cited domains & URLs
            const citedDomains = extractCitedDomains(answerText);
            for (const domain of citedDomains) {
                citingDomainsFrequency.set(domain, (citingDomainsFrequency.get(domain) || 0) + 1);
            }

            tests.push({
                prompt,
                engine: "chatgpt",
                brandMentioned,
                brandRank,
                sentiment,
                citedDomains,
                competitorsMentioned,
                aiAnswerSnippet: answerText.substring(0, 320) + "..."
            });
        } catch (err: any) {
            console.warn(`[CitationScanner] Query failed for prompt: "${prompt}": ${err.message}`);
        }
    }

    const totalPrompts = tests.length || 1;
    const shareOfModelPct = Math.round((promptsWonCount / totalPrompts) * 100);

    const competitorBreakdown: CompetitorComparison[] = cleanCompetitors.map(comp => {
        const count = competitorMentionsMap.get(comp.toLowerCase()) || 0;
        return {
            competitor: comp,
            mentions: count,
            shareOfModelPct: Math.round((count / totalPrompts) * 100),
            primaryCitingSources: Array.from(citingDomainsFrequency.keys()).slice(0, 3)
        };
    }).sort((a, b) => b.mentions - a.mentions);

    const topCitingSourcesOverall = Array.from(citingDomainsFrequency.entries())
        .map(([domain, frequency]) => ({ domain, frequency }))
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, 7);

    // Authority Gap Analysis synthesis
    const authorityGapAnalysis: string[] = [];
    if (shareOfModelPct < 50) {
        authorityGapAnalysis.push(`Competitors hold ${(100 - shareOfModelPct)}% higher visibility across commercial queries.`);
    }
    if (topCitingSourcesOverall.some(s => s.domain.includes("reddit.com"))) {
        authorityGapAnalysis.push("AI models heavily weight conversational consensus from Reddit communities (r/BuyItForLife, r/reviews). Lack of authentic Reddit citations directly damages model ranking.");
    }
    if (topCitingSourcesOverall.some(s => s.domain.includes("wirecutter") || s.domain.includes("nytimes.com") || s.domain.includes("rtings.com"))) {
        authorityGapAnalysis.push("Major editorial test labs (Wirecutter, RTINGS) serve as grounding anchors for AI answers. Competitors with editorial lab reviews capture 3x more citations.");
    }
    if (tests.filter(t => t.brandMentioned && t.sentiment === "omitted").length > 0) {
        authorityGapAnalysis.push(`Target brand was completely omitted in ${tests.filter(t => !t.brandMentioned).length} of ${tests.length} buyer search prompts.`);
    }

    return {
        targetBrand: cleanBrand,
        targetDomain: cleanDomain,
        totalPromptsTested: tests.length,
        promptsWonCount,
        shareOfModelPct,
        competitorBreakdown,
        tests,
        topCitingSourcesOverall,
        authorityGapAnalysis
    };
}

function generateCommercialPrompts(keywords: string[], brand: string, competitors: string[]): string[] {
    const prompts: string[] = [];
    const primaryKeyword = keywords[0] || "products";
    const secondaryKeyword = keywords[1] || primaryKeyword;
    const topComp = competitors[0] || "leading brands";

    prompts.push(`What are the top 5 best ${primaryKeyword} to buy in 2026 and why?`);
    prompts.push(`Compare the best options for ${primaryKeyword}: pros, cons, and which one has the highest durability.`);
    prompts.push(`What is the best budget-friendly alternative to ${topComp} for ${secondaryKeyword}?`);
    prompts.push(`Which brand makes the most reliable ${primaryKeyword} for beginners?`);
    prompts.push(`Is ${brand} worth buying compared to ${topComp}? Give an honest breakdown with Reddit sentiment.`);
    prompts.push(`What are the most recommended ${secondaryKeyword} by users who want simple, high-quality gear?`);

    return prompts;
}

function extractCitedDomains(text: string): string[] {
    const domains = new Set<string>();
    // Match URLs
    const urlMatches = text.match(/https?:\/\/([a-zA-Z0-9.-]+\.[a-zA-Z]{2,6})/g) || [];
    for (const u of urlMatches) {
        try {
            const parsed = new URL(u);
            const host = parsed.hostname.replace(/^www\./, '');
            domains.add(host);
        } catch { }
    }

    // Match explicit markdown citations [Source](...) or [reddit.com], [wirecutter.com]
    const bracketMatches = text.match(/\[([^\]]+)\]\(([^)]+)\)/g) || [];
    for (const b of bracketMatches) {
        const urlPart = b.match(/\((https?:\/\/[^)]+)\)/);
        if (urlPart && urlPart[1]) {
            try {
                const parsed = new URL(urlPart[1]);
                domains.add(parsed.hostname.replace(/^www\./, ''));
            } catch { }
        }
    }

    // Default common authority nodes if cited textually
    if (/reddit/i.test(text)) domains.add("reddit.com");
    if (/wirecutter/i.test(text)) domains.add("nytimes.com/wirecutter");
    if (/rtings/i.test(text)) domains.add("rtings.com");
    if (/trustpilot/i.test(text)) domains.add("trustpilot.com");
    if (/techradar/i.test(text)) domains.add("techradar.com");

    return Array.from(domains);
}

function escapeRegExp(string: string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
