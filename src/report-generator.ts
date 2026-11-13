import { AuditReportData } from "./types";

export function generateHtmlReport(data: AuditReportData): string {
    const { targetBrand, targetDomain, analyzedAt } = {
        targetBrand: data.targetBrand,
        targetDomain: data.targetDomain,
        analyzedAt: new Date(data.generatedAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })
    };

    const gradeColors: Record<string, { bg: string; text: string; border: string }> = {
        A: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
        B: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
        C: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
        D: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
        F: { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200" },
    };

    const gradeStyle = gradeColors[data.aeoScore.grade] || gradeColors.C;

    return `<!DOCTYPE html>
<html lang="en" class="h-full bg-slate-50">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AEO Audit Report: ${escapeHtml(targetBrand)} (${escapeHtml(targetDomain)})</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif; }
        code, pre { font-family: 'JetBrains Mono', monospace; }
    </style>
</head>
<body class="min-h-full text-slate-800 antialiased selection:bg-indigo-500 selection:text-white">

    <!-- Header Navigation -->
    <header class="border-b border-slate-200 bg-white sticky top-0 z-50 shadow-sm backdrop-blur-md bg-white/90">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div class="flex items-center gap-3">
                <div class="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white font-black text-lg shadow-md shadow-indigo-200">
                    ⚡
                </div>
                <div>
                    <h1 class="text-base font-bold text-slate-900 tracking-tight">Neon AEO Diagnostic Studio</h1>
                    <p class="text-xs text-slate-500 font-medium">Enterprise Generative Engine Optimization Audit</p>
                </div>
            </div>
            <div class="flex items-center gap-4 text-xs font-semibold">
                <span class="text-slate-500">Audited on ${escapeHtml(analyzedAt)}</span>
                <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                    2026 Engine Standard
                </span>
            </div>
        </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">

        <!-- Executive Summary Hero -->
        <section class="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm relative overflow-hidden">
            <div class="absolute -right-20 -top-20 w-80 h-80 bg-indigo-50 rounded-full blur-3xl opacity-70 pointer-events-none"></div>
            <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div class="space-y-2">
                    <div class="flex items-center gap-3">
                        <span class="px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                            Target Entity
                        </span>
                        <a href="https://${escapeHtml(targetDomain)}" target="_blank" class="text-sm font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                            ${escapeHtml(targetDomain)} ↗
                        </a>
                    </div>
                    <h2 class="text-3xl font-extrabold text-slate-900 tracking-tight">
                        ${escapeHtml(targetBrand)}
                    </h2>
                    <p class="text-sm text-slate-600 max-w-2xl leading-relaxed">
                        Evaluated across ChatGPT Search, Perplexity, and Claude for commercial intent queries. This diagnostic analyzes AI crawl accessibility, structured schema validity, and Share-of-Model (SoM) against major category competitors.
                    </p>
                </div>

                <div class="flex items-center gap-6 self-start md:self-auto bg-slate-50 border border-slate-200 rounded-2xl p-6">
                    <div class="text-center">
                        <div class="text-xs uppercase tracking-wider font-bold text-slate-500 mb-1">Overall Score</div>
                        <div class="text-4xl font-extrabold text-slate-900">${data.aeoScore.overall}<span class="text-lg text-slate-400 font-normal">/100</span></div>
                    </div>
                    <div class="h-12 w-px bg-slate-200"></div>
                    <div class="text-center">
                        <div class="text-xs uppercase tracking-wider font-bold text-slate-500 mb-1">AEO Grade</div>
                        <div class="inline-flex items-center justify-center w-12 h-12 rounded-xl text-2xl font-black ${gradeStyle.bg} ${gradeStyle.text} border ${gradeStyle.border} shadow-sm">
                            ${data.aeoScore.grade}
                        </div>
                    </div>
                </div>
            </div>

            <!-- Score Metric Cards Grid -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-8 border-t border-slate-100">
                <div class="bg-slate-50 rounded-xl p-4 border border-slate-200/80">
                    <div class="text-xs font-semibold text-slate-500 uppercase tracking-wide">AI Crawl Access</div>
                    <div class="text-2xl font-bold text-slate-900 mt-1">${data.aeoScore.aiCrawlScore}%</div>
                    <div class="text-xs text-slate-500 mt-1">Robots.txt & bot permissions</div>
                </div>
                <div class="bg-slate-50 rounded-xl p-4 border border-slate-200/80">
                    <div class="text-xs font-semibold text-slate-500 uppercase tracking-wide">Schema Validity</div>
                    <div class="text-2xl font-bold text-slate-900 mt-1">${data.aeoScore.schemaScore}%</div>
                    <div class="text-xs text-slate-500 mt-1">Product & Org JSON-LD</div>
                </div>
                <div class="bg-slate-50 rounded-xl p-4 border border-slate-200/80">
                    <div class="text-xs font-semibold text-slate-500 uppercase tracking-wide">Share of Model</div>
                    <div class="text-2xl font-bold text-slate-900 mt-1">${data.aeoScore.shareOfVoiceScore}%</div>
                    <div class="text-xs text-slate-500 mt-1">Recommended in AI search</div>
                </div>
                <div class="bg-slate-50 rounded-xl p-4 border border-slate-200/80">
                    <div class="text-xs font-semibold text-slate-500 uppercase tracking-wide">Knowledge Index</div>
                    <div class="text-2xl font-bold text-slate-900 mt-1">${data.siteAudit.llmsTxt.present ? '100%' : '0%'}</div>
                    <div class="text-xs text-slate-500 mt-1">llms.txt manifest status</div>
                </div>
            </div>
        </section>

        <!-- Section 1: AI Search Model Simulation -->
        <section class="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-6">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div>
                    <h3 class="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <span>🔍</span> Commercial Search Simulation & Share of Voice
                    </h3>
                    <p class="text-xs text-slate-500 mt-0.5">Live prompt tests evaluating recommendation frequency, ranking, and competitor co-mentions.</p>
                </div>
                <div class="flex items-center gap-2 text-xs">
                    <span class="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                        ${data.citationScan.promptsWonCount} of ${data.citationScan.totalPromptsTested} Prompts Won
                    </span>
                    <span class="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                        ${data.citationScan.shareOfModelPct}% Share of Model
                    </span>
                </div>
            </div>

            <!-- Competitor Comparison Table -->
            <div class="overflow-x-auto">
                <table class="w-full text-left text-sm">
                    <thead class="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-y border-slate-200">
                        <tr>
                            <th class="py-3 px-4">Entity</th>
                            <th class="py-3 px-4">AI Mentions</th>
                            <th class="py-3 px-4">Share of Voice</th>
                            <th class="py-3 px-4">Status</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100 font-medium">
                        <tr class="bg-indigo-50/50">
                            <td class="py-3.5 px-4 font-bold text-indigo-900 flex items-center gap-2">
                                <span class="w-2 h-2 rounded-full bg-indigo-600"></span>
                                ${escapeHtml(targetBrand)} (Target)
                            </td>
                            <td class="py-3.5 px-4 font-bold text-slate-900">${data.citationScan.promptsWonCount} / ${data.citationScan.totalPromptsTested}</td>
                            <td class="py-3.5 px-4">
                                <div class="flex items-center gap-2">
                                    <div class="w-24 bg-slate-200 rounded-full h-2 overflow-hidden">
                                        <div class="bg-indigo-600 h-2 rounded-full" style="width: ${data.citationScan.shareOfModelPct}%"></div>
                                    </div>
                                    <span class="text-xs text-slate-700">${data.citationScan.shareOfModelPct}%</span>
                                </div>
                            </td>
                            <td class="py-3.5 px-4">
                                <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-indigo-100 text-indigo-800">
                                    Primary Target
                                </span>
                            </td>
                        </tr>
                        ${data.citationScan.competitorBreakdown.map(comp => `
                        <tr class="hover:bg-slate-50/60 transition-colors">
                            <td class="py-3.5 px-4 text-slate-700 font-medium">${escapeHtml(comp.competitor)}</td>
                            <td class="py-3.5 px-4 text-slate-600">${comp.mentions} / ${data.citationScan.totalPromptsTested}</td>
                            <td class="py-3.5 px-4">
                                <div class="flex items-center gap-2">
                                    <div class="w-24 bg-slate-200 rounded-full h-2 overflow-hidden">
                                        <div class="bg-slate-500 h-2 rounded-full" style="width: ${comp.shareOfModelPct}%"></div>
                                    </div>
                                    <span class="text-xs text-slate-600">${comp.shareOfModelPct}%</span>
                                </div>
                            </td>
                            <td class="py-3.5 px-4">
                                <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                    Competitor
                                </span>
                            </td>
                        </tr>
                        `).join("")}
                    </tbody>
                </table>
            </div>

            <!-- Prompts Accordion / List -->
            <div class="space-y-3 pt-4">
                <h4 class="text-sm font-bold text-slate-900">Tested Commercial Queries & Model Evidence:</h4>
                <div class="grid grid-cols-1 gap-3">
                    ${data.citationScan.tests.map((test, idx) => `
                    <div class="border border-slate-200 rounded-xl p-4 bg-slate-50/40 hover:bg-white transition-all space-y-2">
                        <div class="flex items-start justify-between gap-3">
                            <div class="flex items-center gap-2">
                                <span class="text-xs font-bold text-slate-400">#${idx + 1}</span>
                                <span class="text-sm font-semibold text-slate-900">"${escapeHtml(test.prompt)}"</span>
                            </div>
                            <span class="shrink-0 text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                                test.sentiment === 'positive' ? 'bg-emerald-100 text-emerald-800' :
                                test.sentiment === 'neutral' ? 'bg-blue-100 text-blue-800' :
                                test.sentiment === 'negative' ? 'bg-rose-100 text-rose-800' : 'bg-slate-200 text-slate-600'
                            }">
                                ${test.sentiment}
                            </span>
                        </div>
                        <p class="text-xs text-slate-600 font-mono bg-white p-2.5 rounded-lg border border-slate-200/70 leading-relaxed">
                            "${escapeHtml(test.aiAnswerSnippet)}"
                        </p>
                        ${test.citedDomains.length > 0 ? `
                        <div class="flex flex-wrap items-center gap-1.5 pt-1">
                            <span class="text-[11px] font-semibold text-slate-400">Grounding Sources Cited:</span>
                            ${test.citedDomains.map(d => `<span class="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">${escapeHtml(d)}</span>`).join("")}
                        </div>
                        ` : ''}
                    </div>
                    `).join("")}
                </div>
            </div>
        </section>

        <!-- Section 2: Technical Crawler & Schema Audit -->
        <section class="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-6">
            <div class="border-b border-slate-100 pb-5">
                <h3 class="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <span>🤖</span> AI Crawler & Technical Infrastructure
                </h3>
                <p class="text-xs text-slate-500 mt-0.5">Verification of robots.txt directives, llms.txt index, and Schema.org rich results.</p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Robots.txt Box -->
                <div class="border border-slate-200 rounded-xl p-5 space-y-3 bg-slate-50/50">
                    <div class="flex items-center justify-between">
                        <span class="text-xs font-bold uppercase tracking-wider text-slate-500">Robots.txt Directives</span>
                        <span class="text-xs px-2 py-0.5 rounded font-semibold ${data.siteAudit.robotsTxt.present ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}">
                            ${data.siteAudit.robotsTxt.present ? 'Present' : 'Missing'}
                        </span>
                    </div>
                    <ul class="space-y-2 text-xs">
                        ${data.siteAudit.robotsTxt.botRules.map(r => `
                        <li class="flex items-center justify-between p-2 rounded bg-white border border-slate-200/70">
                            <span class="font-medium text-slate-800">${escapeHtml(r.bot)}</span>
                            <span class="px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                                r.status === 'allowed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                r.status === 'blocked' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-slate-100 text-slate-600'
                            }">
                                ${r.status}
                            </span>
                        </li>
                        `).join("")}
                    </ul>
                </div>

                <!-- LLMs.txt & Schema Box -->
                <div class="border border-slate-200 rounded-xl p-5 space-y-4 bg-slate-50/50">
                    <div class="space-y-2">
                        <div class="flex items-center justify-between">
                            <span class="text-xs font-bold uppercase tracking-wider text-slate-500">/.well-known/llms.txt</span>
                            <span class="text-xs px-2 py-0.5 rounded font-semibold ${data.siteAudit.llmsTxt.present && data.siteAudit.llmsTxt.validSyntax ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}">
                                ${data.siteAudit.llmsTxt.present ? (data.siteAudit.llmsTxt.validSyntax ? 'Valid Format' : 'Syntax Issues') : 'Not Deployed'}
                            </span>
                        </div>
                        <p class="text-xs text-slate-600">
                            ${data.siteAudit.llmsTxt.present 
                                ? 'Manifest index detected. AI models can parse official product URLs and factual documentation directly.' 
                                : 'No llms.txt found. AI models are forced to guess entity information from unstructured HTML scrapes.'}
                        </p>
                    </div>

                    <div class="pt-3 border-t border-slate-200/80 space-y-2">
                        <div class="flex items-center justify-between">
                            <span class="text-xs font-bold uppercase tracking-wider text-slate-500">Schema.org JSON-LD</span>
                            <span class="text-xs px-2 py-0.5 rounded font-semibold ${data.siteAudit.schemaAudit.hasProductSchema ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">
                                ${data.siteAudit.schemaAudit.count} Schemas Found
                            </span>
                        </div>
                        <div class="flex flex-wrap gap-1.5">
                            ${data.siteAudit.schemaAudit.typesFound.map(t => `<span class="text-xs bg-white text-slate-700 px-2 py-1 rounded border border-slate-200 font-mono">${escapeHtml(t)}</span>`).join("")}
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Section 3: Actionable Fixes & Code Artifacts -->
        <section class="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-6">
            <div class="border-b border-slate-100 pb-5">
                <h3 class="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <span>🛠️</span> Executable Remediation Package
                </h3>
                <p class="text-xs text-slate-500 mt-0.5">Drop-in fixes to establish AI search authority, unblock crawlers, and eliminate hallucinations.</p>
            </div>

            <!-- Action Fix Cards -->
            <div class="space-y-4">
                ${data.remediation.actionableFixList.map(fix => `
                <div class="border border-slate-200 rounded-xl p-5 space-y-3 bg-white">
                    <div class="flex items-center justify-between gap-3">
                        <div class="flex items-center gap-2">
                            <span class="px-2 py-0.5 text-[10px] font-black uppercase rounded ${
                                fix.priority === 'CRITICAL' ? 'bg-rose-100 text-rose-800' :
                                fix.priority === 'HIGH' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                            }">${fix.priority}</span>
                            <h4 class="text-sm font-bold text-slate-900">${escapeHtml(fix.title)}</h4>
                        </div>
                        <span class="text-xs text-slate-500 font-medium">${escapeHtml(fix.impact)}</span>
                    </div>
                    <p class="text-xs text-slate-600 leading-relaxed">${escapeHtml(fix.instruction)}</p>
                    ${fix.codeSnippet ? `
                    <div class="relative">
                        <pre class="bg-slate-900 text-slate-100 p-4 rounded-xl text-xs overflow-x-auto max-h-56"><code>${escapeHtml(fix.codeSnippet)}</code></pre>
                        <button onclick="copyCode(this)" class="absolute top-2.5 right-2.5 bg-white/20 hover:bg-white/30 text-white text-[11px] px-2.5 py-1 rounded font-semibold transition-all">
                            Copy Code
                        </button>
                    </div>
                    ` : ''}
                </div>
                `).join("")}
            </div>

            <!-- Full llms.txt Download Tab -->
            <div class="mt-8 pt-6 border-t border-slate-100 space-y-3">
                <div class="flex items-center justify-between">
                    <h4 class="text-sm font-bold text-slate-900">Generated /.well-known/llms.txt</h4>
                    <button onclick="copyText('${escapeJs(data.remediation.generatedLlmsTxt)}')" class="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg font-semibold shadow-sm transition-all">
                        Copy Full llms.txt
                    </button>
                </div>
                <pre class="bg-slate-900 text-slate-100 p-4 rounded-xl text-xs overflow-x-auto max-h-64"><code>${escapeHtml(data.remediation.generatedLlmsTxt)}</code></pre>
            </div>
        </section>

    </main>

    <footer class="border-t border-slate-200 bg-white py-8 mt-16 text-center text-xs text-slate-500 font-medium">
        Generated by Neon Innovation Lab • AEO & Generative Engine Optimization Engine • Confirmed 2026 Telemetry
    </footer>

    <script>
        function copyCode(btn) {
            const pre = btn.parentElement.querySelector('code');
            navigator.clipboard.writeText(pre.innerText).then(() => {
                const orig = btn.innerText;
                btn.innerText = 'Copied!';
                btn.classList.add('bg-emerald-600');
                setTimeout(() => {
                    btn.innerText = orig;
                    btn.classList.remove('bg-emerald-600');
                }, 2000);
            });
        }

        function copyText(str) {
            navigator.clipboard.writeText(str).then(() => {
                alert('Copied to clipboard!');
            });
        }
    </script>
</body>
</html>`;
}

function escapeHtml(str: string): string {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function escapeJs(str: string): string {
    return str.replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/\n/g, "\\n");
}
