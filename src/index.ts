import { inspectSite } from "./site-inspector";
import { scanCitations } from "./citation-scanner";
import { generateRemediation } from "./remediation-generator";
import { generateHtmlReport } from "./report-generator";
import { AuditReportData } from "./types";
import * as fs from "fs";
import * as path from "path";

export interface RunAeoAuditOptions {
    domain: string;
    brand?: string;
    keywords?: string[];
    competitors?: string[];
    outputDir?: string;
}

export async function runAeoAudit(options: RunAeoAuditOptions): Promise<AuditReportData> {
    const cleanDomain = options.domain.replace(/^https?:\/\//, '').replace(/\/+$/, '');
    const targetBrand = options.brand || cleanDomain.split('.')[0].replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    const keywords = options.keywords && options.keywords.length > 0 ? options.keywords : ["products", "hardware"];
    const competitors = options.competitors && options.competitors.length > 0 ? options.competitors : [];

    console.log(`\n🔍 [AEO Engine] Starting comprehensive audit for: ${targetBrand} (${cleanDomain})`);

    // 1. Technical Site Audit
    console.log(`[AEO Engine] Step 1/3: Inspecting robots.txt, llms.txt, and Schema.org JSON-LD...`);
    const siteAudit = await inspectSite(cleanDomain);

    // 2. Multi-Model AI Citation Scan
    console.log(`[AEO Engine] Step 2/3: Simulating commercial search queries across AI models...`);
    const citationScan = await scanCitations(targetBrand, cleanDomain, keywords, competitors);

    // 3. Remediation & Code Generation
    console.log(`[AEO Engine] Step 3/3: Synthesizing remediation fixes and llms.txt knowledge base...`);
    const remediation = generateRemediation(targetBrand, cleanDomain, siteAudit, citationScan, keywords);

    // 4. Calculate Master AEO Score & Grade
    const aiCrawlScore = siteAudit.robotsTxt.aiCrawlScore;
    const schemaScore = siteAudit.schemaAudit.schemaScore;
    const shareOfVoiceScore = citationScan.shareOfModelPct;
    const contentStructureScore = siteAudit.contentClarity.clarityScore;

    const overallScore = Math.round(
        (aiCrawlScore * 0.25) +
        (schemaScore * 0.25) +
        (shareOfVoiceScore * 0.35) +
        (contentStructureScore * 0.15)
    );

    let grade: "A" | "B" | "C" | "D" | "F" = "C";
    if (overallScore >= 90) grade = "A";
    else if (overallScore >= 80) grade = "B";
    else if (overallScore >= 65) grade = "C";
    else if (overallScore >= 50) grade = "D";
    else grade = "F";

    const reportData: AuditReportData = {
        id: `aeo_${cleanDomain.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`,
        generatedAt: new Date().toISOString(),
        targetBrand,
        targetDomain: cleanDomain,
        keywords,
        competitors,
        siteAudit,
        citationScan,
        remediation,
        aeoScore: {
            overall: overallScore,
            aiCrawlScore,
            schemaScore,
            shareOfVoiceScore,
            contentStructureScore,
            grade
        }
    };

    // Export Reports
    const outDir = options.outputDir || path.resolve(process.cwd(), "reports");
    if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
    }

    const htmlReport = generateHtmlReport(reportData);
    const htmlPath = path.join(outDir, `aeo-audit-${cleanDomain}.html`);
    const jsonPath = path.join(outDir, `aeo-audit-${cleanDomain}.json`);
    const llmsTxtPath = path.join(outDir, `llms-${cleanDomain}.txt`);

    fs.writeFileSync(htmlPath, htmlReport, "utf-8");
    fs.writeFileSync(jsonPath, JSON.stringify(reportData, null, 2), "utf-8");
    fs.writeFileSync(llmsTxtPath, remediation.generatedLlmsTxt, "utf-8");

    console.log(`✅ [AEO Engine] Audit Complete!`);
    console.log(`   • Overall Score: ${overallScore}/100 (Grade: ${grade})`);
    console.log(`   • Share of Model: ${shareOfVoiceScore}%`);
    console.log(`   • HTML Report: ${htmlPath}`);
    console.log(`   • llms.txt: ${llmsTxtPath}\n`);

    return reportData;
}

export * from "./types";
export { inspectSite } from "./site-inspector";
export { scanCitations } from "./citation-scanner";
export { generateRemediation } from "./remediation-generator";
export { generateHtmlReport } from "./report-generator";
