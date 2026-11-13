#!/usr/bin/env node
import { runAeoAudit } from "./index";

async function main() {
    const args = process.argv.slice(2);
    const domainArg = args.find(a => a.startsWith("--domain="))?.split("=")[1];
    const brandArg = args.find(a => a.startsWith("--brand="))?.split("=")[1];
    const keywordsArg = args.find(a => a.startsWith("--keywords="))?.split("=")[1];
    const competitorsArg = args.find(a => a.startsWith("--competitors="))?.split("=")[1];

    if (!domainArg) {
        console.log(`
Usage:
  npx aeo-audit --domain=<domain> [--brand=<brandName>] [--keywords="k1,k2"] [--competitors="c1,c2"]

Example:
  npx aeo-audit --domain=campsnapcamera.com --brand="Camp Snap" --keywords="screenless digital camera,vintage digital camera" --competitors="papershootcamera.com,fujifilm.com"
        `);
        process.exit(1);
    }

    const keywords = keywordsArg ? keywordsArg.split(',').map(k => k.trim()) : [];
    const competitors = competitorsArg ? competitorsArg.split(',').map(c => c.trim()) : [];

    try {
        await runAeoAudit({
            domain: domainArg,
            brand: brandArg,
            keywords,
            competitors
        });
    } catch (err: any) {
        console.error(`❌ [AEO CLI] Error running audit: ${err.message}`);
        process.exit(1);
    }
}

main();
