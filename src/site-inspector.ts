import axios from "axios";
import * as cheerio from "cheerio";
import { AiBotRule, SchemaItem, SiteAuditResult } from "./types";

const AI_BOTS = [
    { bot: "GPTBot (OpenAI / SearchGPT)", userAgent: "GPTBot" },
    { bot: "ClaudeBot (Anthropic Claude)", userAgent: "ClaudeBot" },
    { bot: "PerplexityBot (Perplexity AI)", userAgent: "PerplexityBot" },
    { bot: "Google-Extended (Gemini / AI Overviews)", userAgent: "Google-Extended" },
    { bot: "Amazon-Rufus (Amazon Shopping AI)", userAgent: "Amazon-Rufus" },
    { bot: "Applebot-Extended (Apple Intelligence)", userAgent: "Applebot-Extended" },
    { bot: "Meta-ExternalAgent (Meta AI)", userAgent: "meta-externalagent" }
];

export async function inspectSite(domain: string): Promise<SiteAuditResult> {
    const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/+$/, '');
    const baseUrl = `https://${cleanDomain}`;
    const analyzedAt = new Date().toISOString();

    const client = axios.create({
        timeout: 12000,
        headers: {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 NeonAeoAuditor/2.0",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
        }
    });

    // 1. Audit robots.txt
    let robotsTxtContent = "";
    let robotsTxtPresent = false;
    const botRules: AiBotRule[] = [];

    try {
        const robotsRes = await client.get(`${baseUrl}/robots.txt`);
        if (robotsRes.status === 200 && typeof robotsRes.data === "string") {
            robotsTxtPresent = true;
            robotsTxtContent = robotsRes.data;
        }
    } catch {
        robotsTxtPresent = false;
    }

    if (robotsTxtPresent && robotsTxtContent) {
        for (const bot of AI_BOTS) {
            const rule = parseRobotsForBot(robotsTxtContent, bot.userAgent);
            botRules.push({
                bot: bot.bot,
                userAgent: bot.userAgent,
                status: rule.status,
                details: rule.details
            });
        }
    } else {
        for (const bot of AI_BOTS) {
            botRules.push({
                bot: bot.bot,
                userAgent: bot.userAgent,
                status: "not_specified",
                details: "No robots.txt found (default allow)"
            });
        }
    }

    const blockedBotsCount = botRules.filter(r => r.status === "blocked").length;
    const aiCrawlScore = robotsTxtPresent
        ? Math.max(0, 100 - (blockedBotsCount * 20))
        : 85; // Missing robots.txt defaults to allow, but loses points for best practices

    // 2. Audit llms.txt and llms-full.txt
    let llmsTxtPresent = false;
    let llmsTxtContent = "";
    let validSyntax = false;
    const missingSections: string[] = [];
    let llmsUrl = `${baseUrl}/.well-known/llms.txt`;

    try {
        let res = await client.get(llmsUrl);
        if (res.status === 200 && typeof res.data === "string" && res.data.length > 20) {
            llmsTxtPresent = true;
            llmsTxtContent = res.data;
        } else {
            // Check fallback /llms.txt
            llmsUrl = `${baseUrl}/llms.txt`;
            res = await client.get(llmsUrl);
            if (res.status === 200 && typeof res.data === "string" && res.data.length > 20) {
                llmsTxtPresent = true;
                llmsTxtContent = res.data;
            }
        }
    } catch {
        llmsTxtPresent = false;
    }

    if (llmsTxtPresent && llmsTxtContent) {
        // Validate llms.txt standard: Title (# H1), Description blockquote, and link list
        const hasH1 = /^#\s+[^\n]+/m.test(llmsTxtContent);
        const hasBlockquote = /^>\s+[^\n]+/m.test(llmsTxtContent);
        const hasLinks = /-\s*\[.*?\]\(.*?\)/m.test(llmsTxtContent);

        if (!hasH1) missingSections.push("Missing # H1 Brand Title");
        if (!hasBlockquote) missingSections.push("Missing > Summary Blockquote");
        if (!hasLinks) missingSections.push("Missing Markdown [Title](URL) Link Manifest");

        validSyntax = missingSections.length === 0;
    } else {
        missingSections.push("File not found at /.well-known/llms.txt or /llms.txt");
    }

    // 3. Audit HTML & JSON-LD Structured Data
    let html = "";
    try {
        const htmlRes = await client.get(baseUrl);
        html = typeof htmlRes.data === "string" ? htmlRes.data : "";
    } catch (e: any) {
        console.warn(`[SiteInspector] Failed to fetch homepage for ${baseUrl}: ${e.message}`);
    }

    const $ = cheerio.load(html);
    const schemaItems: SchemaItem[] = [];
    const typesFound = new Set<string>();

    $('script[type="application/ld+json"]').each((_, el) => {
        try {
            const rawText = $(el).html()?.trim();
            if (!rawText) return;
            const parsed = JSON.parse(rawText);
            const items = Array.isArray(parsed) ? parsed : (parsed["@graph"] ? parsed["@graph"] : [parsed]);

            for (const item of items) {
                const type = item["@type"];
                if (type) {
                    typesFound.add(type);
                    const validation = validateSchemaItem(type, item);
                    schemaItems.push({
                        type,
                        raw: item,
                        isValid: validation.isValid,
                        missingRequiredFields: validation.missingFields,
                        recommendations: validation.recommendations
                    });
                }
            }
        } catch {
            // Malformed JSON-LD
        }
    });

    const hasProductSchema = typesFound.has("Product") || typesFound.has("IndividualProduct");
    const hasOrganizationSchema = typesFound.has("Organization") || typesFound.has("Corporation") || typesFound.has("LocalBusiness");
    const hasFaqSchema = typesFound.has("FAQPage");

    let schemaScore = 0;
    if (schemaItems.length > 0) schemaScore += 30;
    if (hasOrganizationSchema) schemaScore += 25;
    if (hasProductSchema) schemaScore += 30;
    if (hasFaqSchema) schemaScore += 15;

    // 4. Content Clarity & Entity Density
    const metaTitle = $('title').first().text().trim() || $('meta[property="og:title"]').attr('content') || "";
    const metaDescription = $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content') || "";
    const h1 = $('h1').first().text().trim();
    const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
    const wordCount = bodyText ? bodyText.split(' ').length : 0;
    const hasAttributeTable = $('table').length > 0 || $('dl').length > 0 || $('ul[class*="spec"], ul[class*="feature"]').length > 0;

    let clarityScore = 0;
    if (metaTitle.length > 10) clarityScore += 25;
    if (metaDescription.length > 40) clarityScore += 25;
    if (h1.length > 0) clarityScore += 25;
    if (hasAttributeTable) clarityScore += 25;

    const overallTechnicalScore = Math.round(
        (aiCrawlScore * 0.35) +
        ((llmsTxtPresent && validSyntax ? 100 : (llmsTxtPresent ? 50 : 0)) * 0.20) +
        (schemaScore * 0.30) +
        (clarityScore * 0.15)
    );

    return {
        domain: cleanDomain,
        url: baseUrl,
        analyzedAt,
        robotsTxt: {
            present: robotsTxtPresent,
            url: `${baseUrl}/robots.txt`,
            content: robotsTxtContent || undefined,
            botRules,
            aiCrawlScore
        },
        llmsTxt: {
            present: llmsTxtPresent,
            url: llmsUrl,
            content: llmsTxtContent || undefined,
            validSyntax,
            missingSections
        },
        schemaAudit: {
            present: schemaItems.length > 0,
            count: schemaItems.length,
            items: schemaItems,
            typesFound: Array.from(typesFound),
            hasProductSchema,
            hasOrganizationSchema,
            hasFaqSchema,
            schemaScore
        },
        contentClarity: {
            metaTitle: metaTitle || undefined,
            metaDescription: metaDescription || undefined,
            h1Found: !!h1,
            h1Text: h1 || undefined,
            wordCount,
            hasAttributeTable,
            clarityScore
        },
        overallTechnicalScore
    };
}

function parseRobotsForBot(robotsContent: string, targetAgent: string): { status: "allowed" | "blocked" | "not_specified"; details: string } {
    const lines = robotsContent.split(/\r?\n/);
    let currentAgents: string[] = [];
    let isTargetBlock = false;
    let wildcardBlockDisallowRoot = false;

    for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line || line.startsWith("#")) continue;

        const [directive, ...valParts] = line.split(":");
        const key = directive.trim().toLowerCase();
        const value = valParts.join(":").trim();

        if (key === "user-agent") {
            const agent = value.toLowerCase();
            if (currentAgents.length > 0 && !isTargetBlock) {
                // reset if moving to next section
            }
            currentAgents.push(agent);
            if (agent === targetAgent.toLowerCase()) {
                isTargetBlock = true;
            } else if (agent === "*") {
                // wildcard fallback
            }
        } else if (key === "disallow") {
            if (isTargetBlock) {
                if (value === "/" || value === "/*") {
                    return { status: "blocked", details: `Explicitly blocked for User-agent: ${targetAgent} (Disallow: ${value})` };
                }
            } else if (currentAgents.includes("*") && (value === "/" || value === "/*")) {
                wildcardBlockDisallowRoot = true;
            }
        } else if (key === "allow") {
            if (isTargetBlock && (value === "/" || value === "/*")) {
                return { status: "allowed", details: `Explicitly allowed for User-agent: ${targetAgent}` };
            }
        }
    }

    if (isTargetBlock) {
        return { status: "allowed", details: `User-agent: ${targetAgent} declared without root disallow` };
    }

    if (wildcardBlockDisallowRoot) {
        return { status: "blocked", details: `Blocked under wildcard User-agent: * (Disallow: /)` };
    }

    return { status: "not_specified", details: "No specific rule; defaults to allowed" };
}

function validateSchemaItem(type: string, data: any): { isValid: boolean; missingFields: string[]; recommendations: string[] } {
    const missingFields: string[] = [];
    const recommendations: string[] = [];

    if (type === "Product" || type === "IndividualProduct") {
        if (!data.name) missingFields.push("name");
        if (!data.image) missingFields.push("image");
        if (!data.description) missingFields.push("description");
        if (!data.offers) {
            missingFields.push("offers (price, priceCurrency, availability)");
            recommendations.push("AI crawlers require accurate priceCurrency and availability to recommend products");
        }
        if (!data.brand) {
            recommendations.push("Add brand entity so models associate product with your organization");
        }
        if (!data.aggregateRating) {
            recommendations.push("Add aggregateRating (ratingValue, reviewCount) to trigger social proof in AI answers");
        }
    } else if (type === "Organization" || type === "Corporation") {
        if (!data.name) missingFields.push("name");
        if (!data.url) missingFields.push("url");
        if (!data.logo) missingFields.push("logo");
        if (!data.sameAs || !Array.isArray(data.sameAs) || data.sameAs.length === 0) {
            recommendations.push("Add sameAs links (Wikidata, Wikipedia, LinkedIn, Crunchbase) to anchor entity knowledge graph");
        }
    }

    return {
        isValid: missingFields.length === 0,
        missingFields,
        recommendations
    };
}
