/**
 * Qoyod brand context — single source of truth, loaded into every
 * design / copy / persona prompt. Sourced from the official Playbook
 * and Ads Guideline in the team's "Qoyod Creative OS — Project Assets"
 * Drive folder.
 */

export const QOYOD_BRAND_PLAYBOOK = `BRAND IDENTITY
- Qoyod (قيود) — Saudi cloud accounting & financial management SaaS, ZATCA-certified.
- Built specifically for the Saudi market, in Arabic, around local compliance.
- Part of the Saudi Vision 2030 SME digital transformation push.

AUDIENCE
- Primary: Saudi SME owners and finance managers (10–200 employees) in retail, F&B, services, professional services.
- Cities: Riyadh, Jeddah, Dammam. Age 28–50.
- Pain: hours wasted on manual accounting/VAT, fear of ZATCA penalties, software that doesn't work in Arabic.
- Secondary: Saudi accountants/CPAs, startup founders needing investor-ready financials.

POSITIONING
- The ONLY ZATCA-certified cloud accounting platform built from the ground up for Saudi SMEs — not a global tool retrofitted for the market.
- Edge vs competitors:
   • Daftra — desktop-first legacy. Qoyod is fully cloud, mobile-first, modern.
   • Wafeq — for accountants/CFOs. Qoyod is for business owners.
   • Rewaa — retail POS focus. Qoyod is full accounting + ZATCA + VAT.
   • Foodics — F&B POS. Qoyod is sector-agnostic full accounting.

VOICE
- Direct, no-fluff, professional, confident. Authoritative on compliance. Warm on SME pain points.
- Arabic primary. MSA (Modern Standard Arabic) for all written ad copy / landing pages / email / formal content. Saudi dialect ONLY for short-form social (Snapchat, casual Reels). NEVER Egyptian Arabic.
- Always lead with: "ZATCA-معتمد" credibility. Outcome-first language.
- NEVER use: "leverage", "synergy", "disruptive", "game-changer" or Arabic equivalents. No exaggerated claims like "#1 in Saudi Arabia" without data.

CONTENT PILLARS
1. ZATCA & Compliance — demystifying e-invoicing, VAT, ZATCA updates.
2. Product Education — how-to demos, feature spotlights.
3. SME Pain Points — relatable manual-accounting chaos stories.
4. Social Proof — customer stories, before/after with Qoyod.
5. Saudi Market Moments — Ramadan, National Day (Sept 23), Founding Day (Feb 22), White Friday, year-end.

WHAT WORKS
- Hooks with a pain point ("كل شهر تتأخر في الفاتورة الإلكترونية؟")
- Lead with the ZATCA compliance angle
- Before/after framing
- Urgency tied to ZATCA deadlines
- Real Saudi people / real product UI screenshots

WHAT DOES NOT WORK
- Generic "cloud accounting" with no Saudi angle
- Long-form Instagram explainers
- Western case studies translated
- Stock photos
- Heavy 3D mockups`;

export const QOYOD_CREATIVE_RULES = `CREATIVE CHECKLIST — HAVE TO HAVE (every design must pass these)

1. ONE MESSAGE — one ad = one message. One value proposition. NEVER mix multiple features or benefits.
2. HIERARCHY — title (5–7 words MAX) → visual → ONE trust element → ONE CTA. Visual scanning in 3 seconds.
3. ONE TRUST ELEMENT ONLY — pick ONE: ZATCA-معتمد / SOCPA / a single hard number / actual product UI. NEVER stack multiple trust badges (over-justification kills credibility).
4. ONE CTA — ONE direct button: "اشترك الآن" / "اطلب عرض" / "ابدأ" / "احجز ديمو". Never multiple CTAs.
5. STATIC ADS — clean, simple, ONE message. Real Saudi person OR real product UI. NEVER stock photos. NEVER cluttered.
6. FLAT DESIGN — flat geometric / editorial photography. NO 3D mockups. NO heavy drop shadows. NO over-rendered illustrations.
7. CALM PROFESSIONALISM — light formality, direct, confident. NEVER hype, NEVER unsupported promises. Calm tone increases trust in financial products.
8. ONE AUDIENCE PAIN — pick ONE concern (protect me / give me peace / make my life easier) and address it.

FORBIDDEN
- Egyptian Arabic markers: مش / ايه / ازاي / بتاع / يلا. Use Saudi/MSA: مو / وش / ليش.
- Stacking trust elements (logos + numbers + badges)
- Multiple CTAs
- Stock photography
- 3D mockups, heavy shadows, over-styled illustrations
- Any claim about competitors (be respectful — show OUR strength, not their weakness)
- Emojis anywhere in the output

PALETTE
- Primary: Navy #021544
- Deep turquoise: #01355A
- Accent teal: #17A3A4
- Brighter cyan for CTAs: #1FCACB / #01BFFF (use the brighter one for high-contrast CTAs over navy)
- Keep palette tight. No gold, no purple, no off-brand accents unless it's a special seasonal moment (National Day green, Ramadan warm gold, etc.)`;

export const QOYOD_REFERENCE_PROMPT_EXAMPLE = `EXAMPLE OF AN EXCELLENT IMAGE PROMPT (mimic this style — photographer-level detail, hex colors, exact text in quotes, lens, lighting, mood):

"Extreme close-up macro photo, phone screen fills 70% of frame, partial hand visible at bottom edge only, screen dominates entire composition. Arabic SMS interface crystal sharp, formal message bubble glowing bright with Arabic text: 'موعد موجتك يقرب — جهّز الربط مع فاتورة قبل 31/03/2026 على qoyod.com'. Every Arabic letter razor sharp, background barely visible — deep navy #021544 with cyan #01BFFF bokeh glow at edges, screen light reflecting on phone bezels in cyan tint, dramatic side rim light in cyan hitting phone edge, background navy vignette dark, screen is only light source in scene. Cinematic macro photography, photorealistic, 8K, Canon 100mm macro lens look. No watermarks, no extra text, no logos other than Qoyod brand mark 'قيود' rendered subtly in cyan #17A3A4 lower-right corner."

Notice: explicit lens, hex colors, exact verbatim Arabic text in quotes, lighting setup, composition framing, mood descriptors, photographic style.`;
