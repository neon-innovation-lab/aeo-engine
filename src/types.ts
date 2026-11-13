export interface AiBotRule {
    bot: string;
    userAgent: string;
    status: "allowed" | "blocked" | "not_specified";
    details: string;
}

export interface SchemaItem {
    type: string;
    raw: any;
    isValid: boolean;
    missingRequiredFields: string[];
    recommendations: string[];
}

export interface SiteAuditResult {
    domain: string;
    url: string;
    analyzedAt: string;
    robotsTxt: {
        present: boolean;
        url: string;
        content?: string;
        botRules: AiBotRule[];
        aiCrawlScore: number; // 0 - 100
    };
    llmsTxt: {
        present: boolean;
        url: string;
        content?: string;
        validSyntax: boolean;
        missingSections: string[];
    };
    schemaAudit: {
        present: boolean;
        count: number;
        items: SchemaItem[];
        typesFound: string[];
        hasProductSchema: boolean;
        hasOrganizationSchema: boolean;
        hasFaqSchema: boolean;
        schemaScore: number; // 0 - 100
    };
    contentClarity: {
        metaTitle?: string;
        metaDescription?: string;
        h1Found: boolean;
        h1Text?: string;
        wordCount: number;
        hasAttributeTable: boolean;
        clarityScore: number; // 0 - 100
    };
    overallTechnicalScore: number; // 0 - 100
}

export interface CitationQueryTest {
    prompt: string;
    engine: "chatgpt" | "perplexity" | "claude" | "gemini";
    brandMentioned: boolean;
    brandRank?: number;
    sentiment: "positive" | "neutral" | "negative" | "omitted";
    citedDomains: string[];
    competitorsMentioned: string[];
    aiAnswerSnippet: string;
}

export interface CompetitorComparison {
    competitor: string;
    mentions: number;
    shareOfModelPct: number;
    primaryCitingSources: string[];
}

export interface CitationScanResult {
    targetBrand: string;
    targetDomain: string;
    totalPromptsTested: number;
    promptsWonCount: number; // brand recommended or ranked #1-#3
    shareOfModelPct: number;
    competitorBreakdown: CompetitorComparison[];
    tests: CitationQueryTest[];
    topCitingSourcesOverall: { domain: string; frequency: number }[];
    authorityGapAnalysis: string[];
}

export interface RemediationPackage {
    suggestedRobotsTxtPatch: string;
    generatedLlmsTxt: string;
    generatedLlmsFullTxt: string;
    generatedProductSchemaJsonLd: string;
    actionableFixList: {
        priority: "CRITICAL" | "HIGH" | "MEDIUM";
        title: string;
        impact: string;
        instruction: string;
        codeSnippet?: string;
    }[];
}

export interface AuditReportData {
    id: string;
    generatedAt: string;
    targetBrand: string;
    targetDomain: string;
    keywords: string[];
    competitors: string[];
    siteAudit: SiteAuditResult;
    citationScan: CitationScanResult;
    remediation: RemediationPackage;
    aeoScore: {
        overall: number; // 0 - 100
        aiCrawlScore: number;
        schemaScore: number;
        shareOfVoiceScore: number;
        contentStructureScore: number;
        grade: "A" | "B" | "C" | "D" | "F";
    };
}
