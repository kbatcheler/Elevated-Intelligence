# MASTER BUILD PROMPT
## Different Day | Elevated Intelligence Portal

You are building a high-fidelity interactive prototype of an enterprise intelligence portal. This is a strategic demonstration artefact, not a production system. It must be visually elevated, content-rich, and immediately convincing to enterprise buyers and technical reviewers. It is not a typical SaaS dashboard. It is not a vibe-coded prototype. Every detail matters.

You will execute this build in **seven phases**. At the end of each phase, output a brief summary of what was completed and **wait for explicit confirmation before proceeding to the next phase**. Do not skip phases. Do not combine phases.

---

## MISSION

Build a single-portal application showing ten distinct intelligence layers for a single fictional client, plus an architecture section explaining the AI stack behind it. The portal must demonstrate the descriptive → diagnostic → prescriptive intelligence pattern: showing not just what happened, but why, what to do about it, and what gaps in the client's architecture were revealed in the process.

Every screen must feel like a real, considered enterprise product. The narrator panel on the right side must feel like an analyst is reading the system's output to you. The architecture section must convince a technical buyer that real reasoning is happening underneath.

The fictional client is **Mercer Group**, a US diversified retail and trade business. The current period is **Q3 2026**. All currency is **USD**.

---

## TECH STACK

- **React 18** with Vite
- **JavaScript** (not TypeScript, to keep the prototype fast to iterate)
- **Tailwind CSS** for styling, with custom CSS variables for the brand palette
- **Recharts** for all chart components
- **Lucide React** for icons
- **Google Fonts**: Crimson Pro (serif), Inter (sans)
- **No backend**. All data is hard-coded in `src/data/` as JS modules.
- **No state management library**. Use React state and props.
- **No animation libraries**. Use CSS transitions only.

Do not install any other packages. Do not add Storybook, testing frameworks, routing libraries, or component libraries. The repo must remain lean.

---

## DESIGN SYSTEM

### Palette (use exactly these hex values)

```
--cream: #F4F1EA        Main canvas background
--cream-light: #FAF8F2  Card alternate background
--cream-dark: #E8E2D2   Subtle dividers
--paper: #FFFFFF        Top-tier card background
--border: #E5E2D8       Standard borders
--navy: #1B2A4E         Primary brand colour, headings, navigation
--navy-deep: #0F1A33    Deep accents
--navy-soft: #4A5878    Secondary navy
--gold: #C8A24A         Accent colour, eyebrows, key data values
--gold-light: #E5C97B   Hover and highlight states
--slate: #3F4858        Body text dark
--slate-light: #6B7280  Secondary text
--ink: #1F1F1F          Strongest body text
--coral: #D85A30        Intelligence layer accent, prescriptive markers, warnings
--coral-faint: #FBE8DF  Coral fill backgrounds
--teal: #1D9E75         Positive values, recovery indicators
--teal-faint: #E1F5EE   Teal fill backgrounds
--amber: #BA7517        Diagnostic warnings, signal type
--amber-faint: #FAEEDA  Amber fill backgrounds
--red: #A32D2D          Negative values, variance indicators
--red-faint: #FCEBEB    Red fill backgrounds
--blue: #185FA5         Data type indicators
--blue-faint: #E6F1FB   Blue fill backgrounds
--purple: #534AB7       Integration / process type
--purple-faint: #EEEDFE Purple fill backgrounds
```

### Typography

- **Serif** (`Crimson Pro`): Used for all narrative text, executive summaries, headings of intelligence panels, and the "system speaking" voice. This is the editorial voice.
- **Sans** (`Inter`): Used for navigation, UI labels, data values, metric numbers, tags, buttons, and all functional chrome.

Type scale (use exactly these sizes):
- Display: 40px / 1.1 / 700 weight (page headlines)
- H1: 32px / 1.2 / 600
- H2: 24px / 1.3 / 600
- H3: 20px / 1.3 / 600
- Body large: 18px / 1.5 (narrative paragraphs, serif)
- Body: 15px / 1.55 (standard text)
- Small: 13px / 1.5 (secondary text)
- Tiny: 11px / 1.4 (labels)
- Micro: 10px / 1.3 / 600 / uppercase / letter-spacing 0.14em (eyebrows)

### Spacing and structure

- 12-column responsive grid not required. Use fixed-width layout (1440px minimum viewport).
- Card border radius: **4px** (not 8, not 12, not rounded). Subtle, editorial, not playful.
- Card borders: **1px solid var(--border)**.
- Card padding: **24px** standard, **32px** for hero cards.
- Card accent stripe: 3px tall, top of card, in the relevant accent colour.
- Section spacing: 24px vertical between cards in a column.
- **No drop shadows.** Borders only. This is editorial, not glassmorphic.
- **No gradients** except the one acceptable use: subtle confidence band fills.
- **No rounded buttons**. Buttons are 32px tall, 4px corners, sharp.

### Iconography

Use Lucide React icons throughout. Always 18px or 20px, with `stroke-width: 1.5`. Match icon colour to the text or accent colour next to them. Never use emoji.

### Anti-patterns (do not produce any of these)

- Black or dark mode backgrounds.
- Neon, purple-pink gradients, holographic effects.
- Glass morphism, blur effects, glow.
- Cartoonish icons, illustrations, or 3D elements.
- Stock photography.
- Tooltips on every element. Use sparingly.
- "Generated by AI" badges or sparkle icons except where contextually meaningful.
- Animation that draws attention to itself.
- Tables with zebra stripes brighter than 5% opacity.
- More than two font weights per element.
- More than three colours per chart.

---

## CONTENT MODEL

### The ten intelligence layers (in order, with their guiding question)

The left navigation is grouped under three headers: **Executive**, **Market-facing**, **Operational**.

**Executive**
1. `business-performance` | "How is the business performing against plan?"

**Market-facing**
2. `demand-intelligence` | "Where is demand strong, weak, or moving?"
3. `competitive-intelligence` | "How is our market position shifting?"
4. `customer-intelligence` | "Which customers are growing, churning, or worth defending?"
5. `brand-social` | "How is the brand performing in the market's mind?"

**Operational**
6. `supply-chain` | "Where is the supply chain failing, and what is it costing?"
7. `pricing-margin` | "Where is margin leaking, and which actions recover it?"
8. `sales-pipeline` | "Is the pipeline healthy enough to make the forecast?"
9. `marketing-performance` | "What is marketing actually returning?"
10. `people-operations` | "Where is the workforce productive, stretched, or at risk?"

Plus one meta layer:
11. `intelligence-architecture` | "How does the system actually reason?"

### The narrator co-pilot

A persistent right-hand panel (320px wide) titled **Intelligence narrator**. It does three things:

1. **Speaks the current layer** at the top in serif italic, in a paragraph of 3-5 sentences. The voice is a thoughtful senior analyst, not a chatbot. Example tone: *"Demand finished Q3 $2.8M behind plan. Three causes compound, and two of them are reversible by mid-November. The pricing layer holds the most leverage right now."*

2. **Surfaces cross-layer insights** below the layer summary. These are pre-populated cards showing connections the user might otherwise miss. Each card has a small icon, a one-line title in sans bold, and a two-line description. Example: *"Margin pressure in Pricing correlates with the stockout pattern in Supply. Root cause likely shared. View pricing-margin →"* Clicking a cross-layer card navigates to that layer.

3. **Suggests next steps** at the bottom. A compact list of 2-3 things the user should investigate next, ranked by analyst priority.

The narrator content **changes per layer**. Do not show the same narrator content on every page.

### The Mercer Group fictional context

Use this context across all layers:
- US diversified retail and trade business, headquartered in Dallas, Texas
- Q3 2026 reporting period (1 Jul – 30 Sep 2026)
- Revenue scale: ~$500M annual, ~$130M quarterly
- Channels: Retail (own stores), DIY (third-party), Trade (B2B / contractor), e-commerce
- Categories: Home Improvement, Garden, Hardware, Outdoor Living, Tools
- Regional footprint: Southeast US (40%), Texas and South Central (30%), Mountain West (20%), Mid-Atlantic (10%)
- Distribution centres: Dallas (primary), Phoenix (secondary), Atlanta (tertiary)
- Key competitors named in narratives: Home Depot, Lowe's, Ace Hardware, Harbor Freight, Tractor Supply

---

## AI ARCHITECTURE (section 11)

The architecture page explains the AI stack behind the intelligence layers. It must visually convince a technical reviewer that genuine reasoning is happening, not just LLM summarisation.

The stack consists of five named components. Build the section as a horizontal flow diagram with each component as a card, plus a live "sample query" panel showing each component's contribution on a real question.

### Component definitions (use exactly these descriptions, do not paraphrase)

1. **Cortex Lens** — *The perception layer.* Ingests, normalises, and joins data across the client's systems and our products. Identifies anomalies, patterns, and statistical signals worth investigating. Outputs a structured "observation set" for the downstream models. Without Cortex Lens, the system cannot see.

2. **Confounder** — *The hidden variable model.* Asks "what else could explain this?" on every diagnostic hypothesis. Searches for confounding variables, alternative causes, and statistical artefacts. Outputs a ranked list of confounding factors that the primary diagnosis must rule out before being accepted.

3. **Challenger** — *The adversarial reasoner.* Generates competing hypotheses to the primary diagnosis and stress-tests them. Constructs the strongest counter-argument. Forces the system to defend its conclusions rather than accept the first plausible answer.

4. **Synthesist** — *The narrative composer.* Takes outputs from Cortex Lens, Confounder, and Challenger and composes the final diagnostic narrative, prescription, and gap detection. This is the layer that "speaks" to the user.

5. **Evaluator** — *The confidence and gap scoring layer.* Scores the final diagnosis on confidence, identifies where the reasoning chain hit dead ends, and routes those dead ends into the gap detection pipeline. Evaluator is also responsible for the confidence score visible in every layer header.

### Sample query panel

On the architecture page, include a panel titled **"Watch a question flow through the stack"**. It shows the question *"Why is Q3 demand $2.8M behind plan?"* at the top, then four expandable cards showing each component's contribution:

- Cortex Lens output: "Observed 41 OOS days, competitor promo intensity 1.8x baseline, forecast error 13pp..."
- Confounder output: "Possible confounders: weather (ruled out, +0.1M only), seasonal shift in DIY (partial, -0.3M), supplier price change (none in period)..."
- Challenger output: "Counter-hypothesis A: macro contraction in trade segment. Tested against trade segment performance, rejected at 91% confidence. Counter-hypothesis B: brand event..."
- Synthesist output: The diagnostic narrative the user sees on the Demand layer.
- Evaluator output: "Confidence 87%. Three gaps logged for pipeline."

This panel makes the reasoning chain visible. It is the single most important "wow" moment on the architecture page.

---

## PHASE PLAN

You will deliver this build in seven phases. After each phase, output a brief summary and **wait for explicit confirmation before continuing**.

---

### PHASE 0 — Foundation

**Deliverables:**
- Create the Vite + React project.
- Install only the dependencies listed in the stack section. No others.
- Set up the design system: `src/styles/tokens.css` containing CSS variables for the full palette, plus the Google Fonts import.
- Set up `tailwind.config.js` with custom colours mapped to the CSS variables, custom font families, and the type scale.
- Create the folder structure:
  ```
  src/
    components/      Shared components
    layers/          One file per intelligence layer
    data/            Hard-coded data modules
    narrator/        Narrator panel and its content
    architecture/    Architecture page components
    styles/          Tokens and global CSS
  ```
- Create a minimal "Hello, Different Day" screen confirming the fonts, colours, and Tailwind classes work.

**Acceptance criteria:** The dev server runs. The hello screen displays Crimson Pro and Inter correctly. The cream background and navy text are visible. No console errors.

**Stop and confirm before Phase 1.**

---

### PHASE 1 — Application shell

**Deliverables:**
- Top bar (60px tall, full width): Different Day wordmark on the left with a small gold dot, period selector and client context in the centre ("Q3 2026 · Mercer Group · All channels"), user avatar (initials "KB" in a gold circle) on the right. Background: navy. Text: cream.
- Left navigation rail (240px wide): grouped under "Executive", "Market-facing", "Operational", "System". Each item has its Lucide icon, a label, and a small confidence dot on the right (small filled circle in coral, amber, or teal depending on layer status). Active state: navy left border 3px, navy text, gold dot indicator. Hover: cream-dark background.
- Main canvas area: flexible width, cream background, 32px padding.
- Right narrator panel (320px wide): paper background, navy header strip with title "Intelligence narrator" in eyebrow style, body area below with scrollable content. Placeholder content only at this phase.
- Routing: use React state to switch between layers (no React Router needed). Active layer key is held in app-level state and passed to children.

**Acceptance criteria:** All four chrome regions visible and proportioned. Clicking a nav item visibly changes the active state and the canvas title (placeholder content fine). Layout holds at 1440px and above. No horizontal scroll.

**Stop and confirm before Phase 2.**

---

### PHASE 2 — Business performance layer

This is the flagship layer. Build it first so it sets the bar for the others.

**Layer structure (use this template for all subsequent layers):**

1. **Header strip:** Layer title in serif 32px, the guiding question in serif italic 18px slate-light, a status row showing "Diagnosed [timestamp] · Confidence [%] · Sources [n]" in sans 12px slate-light. On the right, a "Challenge this" button (sans 12px, navy border, no fill, white background).

2. **Metric strip:** Three to four key metrics in cards across the top, each showing a metric label (micro eyebrow), the value (sans 32px), and a sub-line (sans 11px italic). Tone (good/bad/warn) drives the value colour.

3. **Executive narrative card:** Single wide card, serif body text 18px, 3 to 5 sentences. The opening line states the headline finding. The closing line states the recommended priority. This card has a 3px coral accent stripe on top.

4. **Diagnostic detail card:** Title "Variance diagnosis" in sans bold 16px, plus a coral pill showing "[n] root causes". Body shows numbered root causes, each with a title (sans bold 13px), a one-line impact figure (sans 12px coral), and a 2-sentence explanation (sans 12px slate, italic).

5. **Visualisation card:** A real Recharts chart sized to the card. Use line charts with two series (plan, actual), composed charts, or stacked bars where appropriate. Chart styling: navy and coral lines, no grid lines on the X axis, faint grey grid on Y, no chart title (title is on the card header), legend below chart in sans 11px.

6. **Recommended actions card:** Title "Recommended actions" in sans bold 16px, plus a teal pill showing total predicted recovery in USD. Below, a list of actions. Each row: a gold dot, action title (sans bold 13px), action detail (sans 11px slate italic), predicted impact on the right (sans bold 14px teal).

7. **Gaps surfaced card:** Title "Architectural gaps surfaced" in sans bold 16px, plus a coral pill showing indicative pipeline value. Below, a list of gaps. Each row: a category tag (sans micro, in the category's faint background, category-coloured text), gap title (sans bold 12px), gap detail (sans 11px slate italic), and a "Route to pipeline" link on the right.

**Business performance content (use this content verbatim):**

- Metrics:
  - Revenue: $127M, sub "vs $138M plan", tone bad
  - Operating margin: 11.4%, sub "vs 15.2% target", tone bad
  - Cash position: $42M, sub "vs $38M plan", tone good
  - Customer NPS: 38, sub "vs 41 prior quarter", tone warn

- Narrative: "Mercer ended Q3 8% behind revenue plan and 380 basis points behind margin target, with the cash position holding up only because working capital tightening offset trading shortfalls. The variance is not diffuse. Three layers of the business account for almost the entire gap: demand softness in DIY and Home Improvement, supply disruption that compounded the demand issue rather than offsetting it, and pricing decisions that protected volume at the expense of margin. The fastest reversible lever this quarter is in pricing, not demand or supply."

- Diagnostic root causes:
  1. **Demand variance concentrated in two channels** | Impact: -$6.2M | "DIY channel underperformed by 23% and Home Improvement category by 18%, jointly accounting for 60% of the revenue gap."
  2. **Supply disruption compounded rather than absorbed** | Impact: -$3.1M | "Top SKU stockouts during peak weeks meant demand softness was not partially offset by tighter inventory, and inventory days lengthened anyway."
  3. **Margin protection via promotion deepened erosion** | Impact: -$1.8M | "Promotional response to competitor activity defended unit volume but compressed margin by 240bps, with no recovery in share."

- Visualisation: Composed chart showing monthly revenue (bars) against plan (line) across Jul, Aug, Sep with the gap widening in August.

- Actions:
  - "Reset pricing on top 50 SKUs" | Detail: "Targeted price corrections, not blanket increases" | Impact: $1.2M
  - "Activate alternative supplier for DIY range" | Detail: "Supplier B already qualified, contract ready" | Impact: $0.9M Q4
  - "Pull Q4 marketing forward to defend share" | Detail: "Mid-October rather than late November" | Impact: $0.6M Q4
  - "Hold price discipline through end of October" | Detail: "Cease promotional matching on margin-protected lines" | Impact: $0.4M margin

- Gaps surfaced:
  - [DATA] "Real-time competitor pricing absent" | "4-7 day lag prevents responsive pricing decisions"
  - [INTEG] "Trade segment EPOS not consolidated" | "23% of trade volume reports manually"
  - [MODEL] "Margin elasticity model out of date" | "Last refresh March 2025, pre-supply shock"
  - [WORKFLOW] "No automated stock-out to PO trigger" | "Manual reorder process in DIY channel"
  - [SIGNAL] "Macro consumer sentiment signal absent" | "Regional confidence not in any model"

**Stop and confirm before Phase 3.**

---

### PHASE 3 — Market-facing layers

Build the four market-facing layers using the same template established in Phase 2. Content for each:

#### 3.1 Demand intelligence

- Metrics: Variance vs plan ($2.8M / 12.4% below / bad), Period actual ($19.8M / vs $22.6M plan / neutral), Forecast accuracy (71% / vs 84% Q2 / warn), Stockout days top 5 SKUs (41 / target 5 / bad).
- Narrative: "Q3 demand finished $2.8M behind plan, with the variance concentrated in the DIY channel and Home Improvement category. Three compounding causes account for almost all of it: competitor promotional intensity, a portfolio stockout pattern in Dallas and Phoenix distribution centres, and forecast model degradation that has not been retrained since March. Of the three, the pricing response is the fastest to reverse."
- Diagnostic causes: competitor intensity (-$1.2M), stockout pattern (-$0.9M), forecast degradation (-$0.7M). Use the detail already drafted in the strategy deck.
- Chart: 13-week line chart of plan vs actual demand across Q3.
- Actions: Reset DIY pricing ($0.42M), Re-balance Dallas/Phoenix inventory ($0.55M), Retrain forecast ($0.30M Q4), Reduce promo depth ($0.18M).
- Gaps: Competitor pricing latency (DATA), Regional weather signal absent (SIGNAL), Store-level POS missing (INTEG), Marketing attribution to demand (MODEL), OOS-to-PO trigger missing (WORKFLOW).

#### 3.2 Competitive intelligence

- Metrics: Market share (14.3% / down 2.1pp / bad), Share of voice (11.8% / down 4pp / bad), Win rate vs Home Depot (32% / down from 41% / bad), Competitor promo depth (32% / vs 18% baseline / warn).
- Narrative: "Mercer's market position eroded materially in Q3. Share fell 2.1pp to 14.3%, driven primarily by Home Depot's private-label expansion in the Southeast and Lowe's price aggression in Texas and the South Central region. The story is asymmetric: in volume terms the loss is concentrated in three product families and three regions. Sustained position recovery requires either matched pricing in those segments or rapid product differentiation, not both."
- Diagnostic causes: Home Depot private-label expansion (-1.1pp share), Lowe's promotional intensity (-0.7pp share), Ace Hardware supply availability advantage during our stockouts (-0.3pp share).
- Chart: Stacked bar showing share by competitor over 4 quarters.
- Actions: Targeted private-label response in Outdoor Living range ($1.4M share defence), Match competitive prices on top 12 SKUs ($0.9M revenue defence), Accelerate two product launches into November ($1.1M Q4), Trade-only loyalty programme expansion ($0.7M Q4).
- Gaps: Real-time competitor SKU coverage (DATA), Customer switching pattern signal (SIGNAL), Pricing intelligence integration (INTEG), Share elasticity model (MODEL), Competitive intel to category manager workflow (WORKFLOW).

#### 3.3 Customer intelligence

- Metrics: Trade customer churn (18% / vs 11% baseline / bad), LTV ($8,400 / down 12% / bad), 12-month repeat rate (62% / down 4pp / warn), Trade account growth (+71 / vs +180 plan / bad).
- Narrative: "The trade customer base is the leading indicator that worries us most. Churn ran at 18% in Q3, up from 11% baseline, and lifetime value fell 12%. The pattern is service-driven, not price-driven. Customers leaving had 2.3x the average rate of OOS incidents and 1.8x the average delivery slippage. The supply chain layer holds most of the diagnostic, and customer recovery depends on supply chain recovery being visible to those customers within 30 days."
- Diagnostic causes: Service quality decline post stockout pattern (60% of churn), Aggressive competitor account acquisition (25% of churn), Price perception erosion in regional markets (15% of churn).
- Chart: Cohort retention by quarter, showing recent cohorts dropping below historical line.
- Actions: Service recovery contact programme top 200 trade accounts ($0.8M LTV defence), Restore delivery SLA in 4 regions ($0.6M), Targeted loyalty bonus on at-risk accounts ($0.4M), Account manager workload rebalance ($0.3M).
- Gaps: Customer health score real-time (MODEL), CRM-to-supply chain integration (INTEG), Customer service interaction logging (DATA), Churn early warning (SIGNAL), At-risk customer to AM workflow (WORKFLOW).

#### 3.4 Brand and social

- Metrics: Brand sentiment (62% positive / down 8pp / bad), Share of voice (11.8% / down 4pp / bad), Search visibility index (84 / down 11pts / bad), Earned media mentions (1,247 / down 19% / warn).
- Narrative: "Brand health softened across every measure that matters in Q3. The headline finding is not the decline itself but its concentration: 73% of the negative sentiment cluster relates to product availability and delivery, not brand affinity. This is the supply chain story showing up in the brand layer. Recovery here lags supply chain recovery by 4-6 weeks based on historic patterns, so investment in PR alongside operational recovery is justified now, not later."
- Diagnostic causes: Stockout coverage in regional press (-4pp sentiment), Search ranking erosion on key category terms (-11pts SOV), Competitor share-of-voice expansion via paid placement (-2pp SOV).
- Chart: Sentiment trend line with overlay markers for stockout events.
- Actions: PR programme on supply recovery ($0.4M brand defence), SEO content refresh on top 30 category pages ($0.3M), Targeted paid search in regional markets ($0.5M), Influencer programme in DIY and Garden categories ($0.3M).
- Gaps: Regional sentiment granularity (DATA), Owned content to demand signal link (SIGNAL), Brand health to operational KPI (MODEL), Search ranking integration into CMS (INTEG), Sentiment alert to comms team (WORKFLOW).

**Stop and confirm before Phase 4.**

---

### PHASE 4 — Operational layers

Build the five operational layers. Content briefs:

#### 4.1 Supply chain
- Metrics: OOS days top 5 SKUs (41 / target 5 / bad), Supplier OTD (78% / was 91% / bad), DC throughput (88% / vs 95% target / warn), Inventory days (54 / target 42 / bad).
- Narrative: Supply chain is the operational source of most of the customer and brand decline. Supplier B delays compounded by Dallas DC capacity constraint during peak weeks 28-34. The story is not a single failure but two simultaneous constraints.
- Causes: Supplier B production delay (-$1.4M), Dallas DC labour shortage (-$0.9M), Forecast accuracy degradation upstream (-$0.6M).
- Actions: Activate qualified Supplier C ($0.8M Q4), Dallas DC labour augmentation ($0.5M), Forecast inputs upgrade ($0.4M), Top SKU safety stock review ($0.3M).
- Gaps: Supplier production data (DATA), DC capacity forecasting (MODEL), POS to replenishment trigger (WORKFLOW), Weather signal in forecast (SIGNAL), Multi-supplier orchestration (INTEG).

#### 4.2 Pricing and margin
- Metrics: Gross margin (38.2% / down 240bps / bad), Promo intensity (32% of sales / +14pp / warn), Price index vs Home Depot (102 / vs target 105 / warn), Margin contribution top 50 SKUs ($18M / down $4M / bad).
- Narrative: Promotional response defended volume at material margin cost. Pricing reset is the highest-leverage Q4 intervention identified across all layers.
- Causes: Competitive matching depth (-180bps), Mix shift to lower margin (-40bps), Supplier cost inflation passed only partially (-20bps).
- Actions: Targeted reset top 50 SKUs ($1.2M margin), Suspend matching on margin-protected lines ($0.4M), Mix optimisation in trade channel ($0.5M Q4), Cost-pass discipline on next 30 SKUs ($0.3M Q4).
- Gaps: Real-time competitor pricing (DATA), Margin elasticity model (MODEL), Pricing decision audit trail (WORKFLOW), Cost signal from suppliers (SIGNAL), Pricing to ERP propagation (INTEG).

#### 4.3 Sales pipeline
- Metrics: Pipeline coverage (1.8x / need 2.5x / bad), Win rate (24% / vs 31% / bad), Sales cycle (84 days / +18 days / warn), Forecast accuracy (61% / vs 78% / bad).
- Narrative: B2B pipeline is undercovered for Q4 forecast. Mid-funnel stall in deals over $100k. Enterprise approval cycles materially lengthened post-budget season.
- Causes: Mid-funnel stall in enterprise segment (-$3.4M Q4 risk), Deal slippage on 12 large deals ($2.1M Q4 risk), Competitive losses in 4 key accounts (-$1.6M).
- Actions: Pipeline acceleration on top 20 stalled deals ($1.4M Q4), Executive sponsorship on 8 large deals ($1.0M), Competitive defence in 4 named accounts ($0.7M), New-business motion in trade segment ($0.5M).
- Gaps: Stage progression data quality (DATA), Buyer signal monitoring (SIGNAL), CRM to pricing integration (INTEG), Forecast model recalibration (MODEL), Deal review automation (WORKFLOW).

#### 4.4 Marketing performance
- Metrics: CAC ($186 / +31% / bad), Marketing-influenced revenue ($12.4M / -8% / warn), Attribution coverage (67% / target 90% / warn), MROI (3.1x / vs 4.2x / bad).
- Narrative: Marketing efficiency deteriorated in Q3 with channel saturation in paid social and search, and attribution gaps preventing reallocation decisions.
- Causes: Channel saturation in paid social (-$0.4M efficiency), Creative fatigue across key formats (-$0.3M), Attribution gaps blocking optimisation (-$0.2M).
- Actions: Channel rebalance from social to retention ($0.6M efficiency), Creative refresh sprint ($0.4M), Attribution layer build ($0.5M Q4), Cohort-based investment model ($0.3M Q4).
- Gaps: Multi-touch attribution (MODEL), Retention to acquisition link (DATA), Creative performance signal (SIGNAL), MMM to channel team workflow (WORKFLOW), Marketing tech to BI integration (INTEG).

#### 4.5 People and operations
- Metrics: Voluntary attrition (19% / target 12% / bad), Productivity index (92 / vs 100 baseline / warn), Engagement score (68 / vs 74 / bad), Open critical roles (24 / target 8 / bad).
- Narrative: Workforce stretch in operations roles correlates with service quality issues. Attrition concentrated in DC and customer service functions. Recovery needs investment, not exhortation.
- Causes: DC role attrition (-$0.4M productivity), Customer service team attrition (-$0.3M service), Engineering retention in critical roles (-$0.2M).
- Actions: Retention plan for top 50 critical roles ($0.5M retained productivity), Compensation review in 2 DC regions ($0.4M), Training investment in customer service ($0.3M), Span of control review ($0.2M).
- Gaps: Engagement signal real-time (SIGNAL), Workforce-to-output model (MODEL), HRIS to ops integration (INTEG), Exit reason coding (DATA), Manager intervention workflow (WORKFLOW).

**Stop and confirm before Phase 5.**

---

### PHASE 5 — Narrator co-pilot

Make the narrator panel fully functional. Per-layer content:

For each of the 11 layers, write:
1. A 3-5 sentence serif italic summary in the senior-analyst voice. Open with the headline finding. Close with the recommended next focus.
2. Two cross-layer insight cards. Each card connects the current layer to another layer with a specific observation, not generic. Clicking the card navigates.
3. A "What to look at next" list of 2-3 items. Each item is a specific question the analyst would ask next.

Sample cross-layer insights to seed the narrator:
- From Business performance: "60% of the revenue gap traces to Demand variance in two channels. View demand-intelligence →"
- From Demand: "Stockout pattern in this layer is the upstream cause of customer churn surfacing in Customer intelligence. View customer-intelligence →"
- From Customer: "73% of the negative brand sentiment cluster correlates with the service issues in this layer. View brand-social →"
- From Supply chain: "The 41 OOS days here drive the variance you see in Demand. The same root cause appears in three layers. View business-performance →"
- From Pricing: "Margin protection via promo here directly drove the EBITDA gap on Business performance. View business-performance →"

Style the narrator panel:
- Background: paper white
- Header: navy strip with title in eyebrow style and a small live indicator (filled teal dot + "Live")
- Body: 24px padding, vertical scroll if needed
- Each section divided by a thin border-line
- "What to look at next" items appear as small navy-bordered tiles with a chevron right at the end of each

**Stop and confirm before Phase 6.**

---

### PHASE 6 — Intelligence architecture section

Build the architecture page as described in the AI Architecture section above.

Page structure:
1. Header: "Intelligence architecture" in serif 32px, guiding question "How does the system actually reason?" in serif italic 18px.
2. Hero card: One-paragraph explanation of the stack, in serif 18px body. State that the stack has five components that work together on every diagnostic question, and that the user can see them working below.
3. Stack flow diagram: Five component cards arranged horizontally, connected by gold arrow icons. Each card shows the component name (sans bold 16px), a one-line role (sans 12px italic), a Lucide icon (Eye for Cortex Lens, Search for Confounder, ShieldAlert for Challenger, BookOpen for Synthesist, Gauge for Evaluator), and a "View output" button.
4. Sample query panel: Title "Watch a question flow through the stack" in serif 24px. Below, the sample question in serif italic 18px. Then five expandable cards (default expanded) showing each component's contribution on this question. Each card has the component name as header, the output as scrollable text, and a small "[n] tokens · [m]ms" footer in micro sans for credibility.
5. Below the sample query: a "What this means" card explaining that the user-facing narrative is the synthesis of all five components, and that confidence and gap detection are emergent properties of the chain working correctly.

**Stop and confirm before Phase 7.**

---

### PHASE 7 — Polish and wow

Final pass focused on three wow moments and overall polish:

1. **Confidence band visualisation.** On every layer's header, replace the plain "Confidence 87%" text with a small visual: a 60px wide horizontal bar with three zones (red, amber, teal) and a marker positioned by the confidence value, plus the number to the right. On hover, a small popover shows "What would change this confidence?" with two bullets describing the inputs that most affect it.

2. **Challenge this conclusion.** The "Challenge this" button on each layer header opens a modal (cream background, navy border) showing the system's own counter-arguments to the primary diagnosis, plus the confidence intervals on each, plus a "Force re-diagnosis" button that displays a small loading spinner and updates the confidence (no actual re-diagnosis required for the prototype; this is theatre that demonstrates the principle).

3. **Cross-layer connection animation.** When a user clicks a cross-layer card in the narrator, the new layer's header briefly highlights with a soft gold underline (1.5s fade) and the specific element being referenced (e.g., a metric, a cause, a gap) has a 2-second pulsing border in coral.

Also in this phase:
- Verify every chart renders cleanly.
- Verify every layer has a unique narrative, unique metrics, and unique chart.
- Verify no console errors.
- Verify the architecture page renders all five components and the sample query panel.
- Verify keyboard navigation works (tab through nav items, enter to select).
- Run through every layer and read the narrator content. It should never feel templated.

**Stop and confirm. Build complete.**

---

## QUALITY CONTROLS

Before declaring any phase complete, verify:

1. **Visual fidelity.** Does this look like an enterprise intelligence product, or does it look like a hackathon project? If the latter, fix it.
2. **Content depth.** Is the narrative on this layer real, specific, and analyst-quality? Or is it placeholder?
3. **Cross-layer coherence.** Do the narratives reference each other in ways that make sense for a single client (Mercer)?
4. **Typographic discipline.** Is serif used only for narrative, sans for everything else?
5. **Colour discipline.** No black backgrounds, no gradients, no neon.
6. **No animation overuse.** Transitions should be subtle and editorial.
7. **No icons used decoratively.** Every icon should reinforce meaning.

---

## SHIPPING CHECKLIST

When all phases are confirmed complete:

- [ ] All 10 intelligence layers render with unique content
- [ ] Architecture page renders with all five components and the sample query panel
- [ ] Narrator panel content is unique per layer
- [ ] Cross-layer insights navigate correctly
- [ ] Challenge-this modal opens on every layer
- [ ] Confidence band renders on every layer header
- [ ] All charts render without errors
- [ ] No console warnings or errors
- [ ] Fonts load correctly (Crimson Pro and Inter)
- [ ] Layout holds at 1440px viewport
- [ ] README documents the structure and how to extend it

---

## CLOSING NOTE

This is not a typical project. It is a proof of category. Every decision should be made through the lens of "would a CFO at a $500M company believe this is a real product they want to buy?" If the answer is "yes, with caveats", the build is on track. If the answer is "this looks like a demo", reset and try again.

Build with care. Build in phases. Confirm at every checkpoint. Push for elevated, not loud.

End of master prompt.
