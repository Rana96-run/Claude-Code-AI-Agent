/**
 * Qoyod brand context — single source of truth, loaded into every
 * design / copy / persona prompt.
 *
 * Sourced from:
 *  - "Qoyod Creative OS — Playbook" (Drive)
 *  - "Qoyod_Creative_Ads_Guideline_GoogleSheetReady.xlsx" (Drive)
 *  - "qoyod Design headlines.xlsx" — sector-specific approved headlines
 *  - "AI Creative" folder — past production designs (Bookkeeping, Invoice, F&B)
 *  - "Qoyod_Campaign_Brief.pptx" — channel size / copy spec
 *  - "01.Qoyod Logo" folder — official transparent PNG logos
 */

export const QOYOD_BRAND_PLAYBOOK = `BRAND IDENTITY
- Qoyod (قيود) — Saudi cloud accounting & financial management SaaS, ZATCA-certified.
- Built specifically for the Saudi market, in Arabic, around local compliance.
- Part of the Saudi Vision 2030 SME digital transformation push.

AUDIENCE
- Primary: Saudi SME owners and finance managers (10–200 employees) in retail, F&B, services, construction, professional services.
- Cities: Riyadh, Jeddah, Dammam. Age 28–50.
- Pain: hours wasted on manual accounting/VAT, fear of ZATCA penalties, software that doesn't work in Arabic.
- Secondary: Saudi accountants/CPAs, startup founders needing investor-ready financials.

POSITIONING
- The ONLY ZATCA-certified cloud accounting platform built from the ground up for Saudi SMEs — not a global tool retrofitted for the market.
- Edge vs competitors:
   • Daftra — desktop-first legacy. Qoyod is fully cloud, mobile-first, modern.
   • Wafeq — for accountants/CFOs. Qoyod is for business owners.
   • Rewaa — retail POS focus. Qoyod is full accounting + ZATCA + VAT.
   • Foodics — F&B POS. Qoyod is sector-agnostic full accounting (Qoyod Flavours = our F&B-specific product).

VOICE
- Direct, no-fluff, professional, confident. Authoritative on compliance. Warm on SME pain points.
- Arabic primary. MSA (Modern Standard Arabic) for ad headlines / landing pages / email / formal content. Saudi dialect ONLY for short-form social (Snapchat, casual Reels). NEVER Egyptian Arabic.
- Always lead with: ZATCA compliance credibility. Outcome-first language.
- NEVER use: leverage, synergy, disruptive, game-changer or Arabic equivalents. No exaggerated claims like "#1 in Saudi Arabia" without data.

CONTENT PILLARS
1. ZATCA & Compliance — demystifying e-invoicing, VAT, ZATCA updates.
2. Product Education — how-to demos, feature spotlights.
3. SME Pain Points — relatable manual-accounting chaos stories.
4. Social Proof — customer stories, before/after with Qoyod.
5. Saudi Market Moments — Ramadan, National Day (Sept 23), Founding Day (Feb 22), White Friday, year-end.

WHAT WORKS
- Question hooks ("وين تروح مصاريف المشروع؟" / "ضايع في حساباتك؟" / "حاسبك متأخر؟")
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
3. ONE TRUST ELEMENT ONLY — pick ONE: ZATCA badge / SOCPA / a single hard number / actual product UI. NEVER stack multiple trust badges.
4. ONE CTA — ONE direct button. Default: "اشترك الآن". Alternates: "احجز ديمو" / "ابدأ تجربتك" / "اطلب عرض".
5. STATIC ADS — clean, simple, ONE message. Real Saudi person OR real product UI. NEVER stock photos. NEVER cluttered.
6. FLAT DESIGN OR EDITORIAL PHOTO — flat geometric, editorial photography, or real product UI. NO 3D mockups. NO heavy drop shadows. NO over-rendered illustrations.
7. CALM PROFESSIONALISM — light formality, direct, confident. NEVER hype, NEVER unsupported promises. Calm tone increases trust in financial products.
8. ONE AUDIENCE PAIN — pick ONE concern (protect me / give me peace / make my life easier) and address it.

CANONICAL ASSETS THAT MUST APPEAR (per real production examples)

LOGO (top-right or bottom-right of the design)
- Bilingual lockup: "قيود" (Arabic) + "QOYOD" (Latin)
- Cyan #17A3A4 wordmark over navy backgrounds, navy #021544 over light backgrounds
- Don't distort, rotate, recolor outside palette, or place in a box
- Maintain at least 4× the cap-height as clear space around the mark

WEBSITE
- "qoyod.com" subtle in the footer (bottom-left), 16-18px, low-opacity body color, letter-spacing 1

ZATCA TRUST BADGE (when applicable — most ads)
- Full bilingual stack:
  Arabic line:  "هيئة الزكاة والضريبة والجمارك"
  Latin line:   "Zakat, Tax and Customs Authority"
- Rendered as a single pill-shaped badge with subtle border or solid teal fill

CTA BUTTON
- Default: "اشترك الآن"
- Cyan #1FCACB fill, navy #021544 text, fully rounded (pill), 16-22px padding
- ONE button only — never paired

FORBIDDEN
- Egyptian Arabic markers: مش / ايه / ازاي / بتاع / يلا. Use Saudi/MSA: مو / وش / ليش.
- Stacking trust elements (logos + numbers + badges)
- Multiple CTAs
- Stock photography
- 3D mockups, heavy shadows, over-styled illustrations
- Any direct attack on competitors (be respectful — show OUR strength, not their weakness)
- Emojis anywhere

PALETTE
- Primary: Navy #021544
- Deep turquoise: #01355A
- Accent teal: #17A3A4
- Brighter cyan for CTAs: #1FCACB / #01BFFF
- Keep palette tight. No off-brand accents unless seasonal (National Day green, Ramadan warm gold, Founding Day blue).

TYPOGRAPHY
- Display / headlines: Lama Sans (brand font) — fall back to IBM Plex Sans Arabic when Lama Sans isn't available.
- Latin: Lama Sans Latin or Space Grotesk for accent.
- Bold weight (700) for headlines, SemiBold (600) for sub-heads, Regular (400) for body.
- Arabic always right-aligned (RTL).`;

export const QOYOD_HEADLINE_PATTERNS = `HEADLINE FORMULAS (proven — from the qoyod Design headlines library)

PATTERN 1 — Question hook → Qoyod answer
- "وين تروح مصاريف المشروع؟ تابعها أول بأول مع قيود"
- "ضايع في حساباتك؟ خلّها علينا"
- "حاسبك متأخر؟ خلّك مرتاح معنا"
- "تضيع الفواتير بين المشاريع؟ رتبها مع قيود"
- "حسابات المقاولات متعبة؟ خلّها أسهل مع قيود"

PATTERN 2 — Direct authoritative command
- "سيطر على حساباتك"
- "خلي أرقامك دايمًا واضحة"
- "كل حساباتك في مكان واحد"
- "نظّم شغلك المالي بسهولة"
- "ودّع العشوائية في الحسابات"

PATTERN 3 — Outcome promise
- "اعرف تكاليف مشروعك بالتفصيل مع نظام قيود المحاسبي"
- "كل فواتيرك في مكان واحد بضغطة واحدة من جوالك"
- "إدارة حسابات مشاريعك تبدأ من قيود"
- "تقارير فورية وتفاصيل دقيقة تعطيك تصور مالي واضح لشركتك"

PATTERN 4 — Sector-specific (Construction/Contractors)
- "اعرف التكاليف الحقيقية لكل مشروع مع قيود"
- "من المناقصة إلى التسليم… حساباتك في قيود"
- "برنامج محاسبي صممناه لخدمات المقاولات"
- "كثرة المشاريع وتعدد الحسابات تلخبط محاسبتك، رتبها مع قيود"

PATTERN 5 — Sector-specific (F&B / Q.Flavours)
- "بيانات لحظية لقرارات دقيقة"
- "كل إدارة مطعمك في مكان واحد"
- "نظام واحد يدير مطعمك"
- "اعرف مبيعات كل منتج لتبني عليها قرارك"

PATTERN 6 — Bookkeeping-specific
- "الحسابات معقّدة؟ نبسّطها لك"
- "مو فاضي للحسابات؟ إحنا نهتم فيها"
- "تعبت من اللخبطة؟ نرتّبها لك"
- "مو عارف أرباحك؟ نوضحها لك"

When Claude writes a headline, it MUST follow one of these formulas. Length: 5–7 Arabic words (ads guideline rule).`;

export const QOYOD_REFERENCE_PROMPT_EXAMPLE = `EXAMPLE OF AN EXCELLENT SCENE-ONLY PROMPT (mimic the photographer-level detail, hex colors, lens, lighting, composition, BUT do NOT instruct the model to render Arabic text in the image — text is added by typography compositor in post)

"Editorial product photography. Premium tablet device on a clean dark navy #021544 surface, screen displaying the Qoyod cloud accounting dashboard interface in soft glowing detail — clean rows of financial data, subtle cyan #17A3A4 UI accents, navy chrome. Tablet tilted 15 degrees toward camera, partial Saudi business owner's hand resting beside it (modest professional dress, sleeve visible). Background: deep navy #021544 with soft cyan #1FCACB rim light from upper-left, gentle volumetric haze. Right two-thirds of frame intentionally empty for typography overlay in post. NO text on the screen. NO logos. NO watermarks. Cinematic 8K, Canon 50mm at f/2.0, photorealistic."

KEY NOTES:
- Specific lens (Canon 50mm f/2.0)
- Specific hex colors throughout (#021544 navy, #17A3A4 teal, #1FCACB cyan)
- Empty composition zone for typography
- Saudi business context (modest dress, professional)
- "NO text" / "NO logos" repeated to prevent the model rendering its own text`;
