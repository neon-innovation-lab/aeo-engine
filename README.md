# aeo-engine

Open-source CLI that audits how visible a brand is to AI search engines: `robots.txt` AI-crawler access, `llms.txt`, Schema.org JSON-LD, and a simulated citation scan across commercial buyer prompts.

## Usage

```bash
npm install && npm run build
export GEMINI_API_KEY=your_key   # or OPENAI_API_KEY (bring your own key, nothing is bundled)
node dist/cli.js --domain=example.com --brand="Example" --keywords="kw one,kw two" --competitors="rival.com"
```

Outputs an HTML report, a JSON report and a generated `llms.txt` into `./reports`.

## No-install version

Run the free diagnostic in the browser: https://neoninnovationlab.com/tools/aeo-audit?domain=example.com

Need the fixes implemented? https://neoninnovationlab.com/checkout?item=web_ai_sprint_starter

License: Apache-2.0
