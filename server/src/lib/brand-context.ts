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

export const QOYOD_PERSONAS = `BUYER PERSONAS — pick ONE and design specifically for them
Sourced from the team's buyer-persona research in Drive. Each persona drives
visual style, channel format, hook tone, and trust angle.

P1 — Ahmed · صاحب بقالة / محل صغير
  Age 30-60 · vocational · Riyadh/Jeddah/Dammam · Snapchat + IG + WhatsApp
  Decision maker. Traditional. Bargain-oriented. Cash-flow focused.
  Visual style: bold simple direct, big readable text, real shop interior or hand-held POS.
  Hook tone: practical, no-nonsense ("ودّع الأخطاء", "كل حساباتك في مكان واحد").
  Pain: manual receipts, late VAT, no time to learn complex software.

P2 — Fatima · مديرة مطعم / صاحبة كوفي
  Age 30-40 · bachelor's · F&B · Instagram + TikTok + Snapchat + Sahl
  Consults with owner but final operational say.
  Visual style: editorial restaurant scene, real Saudi server, kitchen/cashier UI.
  Hook tone: speed-of-service, organized chaos solved ("نظام واحد يدير مطعمك").
  Pain: app overload (Hungerstation/Jahez/Mrsool), inventory leakage, peak-hour stress.

P3 — Khalid · مقاول / صاحب شركة مقاولات
  Age 50-60 · bachelor's/engineering · construction · Facebook + LinkedIn + IG + Google
  Decision maker. Independent. Experience-driven.
  Visual style: project site or blueprint close-up, formal product UI, hard hat optional.
  Hook tone: control over costs, warranty letters, project tracking ("من المناقصة إلى التسليم").
  Pain: cost leakage between projects, retention bonds, ZATCA on staged invoicing.

P4 — Sarah · مؤسسة متجر إلكتروني
  Age 25-35 · bachelor's · E-commerce · Instagram + TikTok + Sahl + Facebook
  Decision maker, may consult with marketing team. Highly social-active.
  Visual style: clean modern flat-lay, mobile-first composition, dynamic.
  Hook tone: growth-data-driven ("تابع أرقامك أول بأول"), fits investor reporting.
  Pain: sales-to-accounting integration, VAT on cross-border, returns/refunds tracking.

P5 — Omar · طبيب أسنان / صاحب عيادة
  Age 40-55 · doctorate · healthcare · LinkedIn + IG + Google + TikTok
  Decision maker, may consult admin.
  Visual style: clean clinical aesthetic, ZATCA badge prominent, no human portrait.
  Hook tone: professional, compliance-first, peace of mind ("التزامك الضريبي بدون تعقيد").
  Pain: medical billing, insurance reconciliation, ZATCA Phase 2 readiness.

P6 — Ali · CFO / Finance Director (mid-large company)
  Age 45-55 · MBA · service/tech · LinkedIn + Twitter + Email + YouTube
  Influencer (recommends), not always sole decision maker.
  Visual style: corporate editorial, dashboard close-up, integration diagrams.
  Hook tone: enterprise-grade ("تحكم مالي شامل", "تكامل مع أنظمتك التشغيلية").
  Pain: multi-entity consolidation, audit-readiness, API integration.

PICK BY PERSONA → CHANNEL
  Snapchat / TikTok ⇒ P1, P2, P4
  Instagram         ⇒ P2, P4, P5 (and P1 in Saudi dialect mode)
  LinkedIn          ⇒ P3, P5, P6 (and P2 for restaurant chains)
  Google Search     ⇒ P3, P5, P6
  Twitter / X       ⇒ P6, P3
  Facebook          ⇒ P1, P3, P5`;

export const QOYOD_SECTOR_CONTEXT = `SECTOR-SPECIFIC DESIGN DIRECTIVES — use the sector input to pick visual subject + hook angle

RETAIL (P1 grocery / supermarket / mobile shop)
  Visual: real shop interior, cashier counter, real POS device, products on shelves.
  Hook: "كل حساباتك في مكان واحد", "ودّع العشوائية", "نظّم شغلك المالي".
  Avoid: stock photo people smiling at laptops.

F&B (P2 restaurants / coffee shops / food trucks — uses QFlavours product)
  Visual: kitchen ticket display, cashier screen, table-management UI, real server.
  Hook: "نظام واحد يدير مطعمك", "بيانات لحظية لقرارات دقيقة", "كل طلباتك في شاشة وحدة".
  Avoid: foreign-style restaurant clichés. Show local Saudi/Khaleeji F&B context.

CONSTRUCTION (P3 contractors / mid-large projects)
  Visual: blueprint close-up, project site, retention bond document, dashboard with project KPIs.
  Hook: "من المناقصة إلى التسليم", "اعرف التكاليف الحقيقية لكل مشروع", "تابع محجوز ضمان حسن التنفيذ".
  Avoid: hard-hat-stock-photo cliché. Lead with documents/UI, not workers.

E-COMMERCE (P4 founders / online stores)
  Visual: phone showing checkout, product flat-lay, clean dashboard with revenue chart.
  Hook: "كل فواتيرك في مكان واحد بضغطة من جوالك", "تابع أرقامك أول بأول".
  Avoid: shopping-cart icon clichés. Show real product photography aesthetic.

HEALTHCARE (P5 clinics / dental / specialists)
  Visual: clean clinical UI, document close-up, ZATCA compliance badge prominent.
  Hook: "التزامك الضريبي بدون تعقيد", calm-professional outcome promise.
  Avoid: stock medical imagery. Use product UI or document macro.

ENTERPRISE / FINANCE (P6 CFO / large-company finance)
  Visual: corporate editorial, integration diagram (Systems → Qoyod), dashboard close-up.
  Hook: "تحكم مالي شامل لأعمالك الكبيرة", "تكامل وربط الأنظمة".
  Avoid: SME messaging. This is enterprise-tier — formal, integrated, audit-ready.

BOOKKEEPING SERVICE (cross-sector — outsourced)
  Visual: SOCPA-certified accountant working remotely, bookkeeper dashboard, deliverables list.
  Hook: "خلّ فريق قيود يمسك الدفاتر", "محاسبون متخصصون + منصة قيود".
  Avoid: claims like "100% no errors". Lead with trust + transparency.`;

export const QOYOD_REFERENCE_PROMPT_EXAMPLE = `EXAMPLE OF AN EXCELLENT SCENE-ONLY PROMPT (mimic the photographer-level detail, hex colors, lens, lighting, composition, BUT do NOT instruct the model to render Arabic text in the image — text is added by typography compositor in post)

"Editorial product photography. Premium tablet device on a clean dark navy #021544 surface, screen displaying the Qoyod cloud accounting dashboard interface in soft glowing detail — clean rows of financial data, subtle cyan #17A3A4 UI accents, navy chrome. Tablet tilted 15 degrees toward camera, partial Saudi business owner's hand resting beside it (modest professional dress, sleeve visible). Background: deep navy #021544 with soft cyan #1FCACB rim light from upper-left, gentle volumetric haze. Right two-thirds of frame intentionally empty for typography overlay in post. NO text on the screen. NO logos. NO watermarks. Cinematic 8K, Canon 50mm at f/2.0, photorealistic."

KEY NOTES:
- Specific lens (Canon 50mm f/2.0)
- Specific hex colors throughout (#021544 navy, #17A3A4 teal, #1FCACB cyan)
- Empty composition zone for typography
- Saudi business context (modest dress, professional)
- "NO text" / "NO logos" repeated to prevent the model rendering its own text`;

/**
 * Gold-standard design brief — Q-Flavours POS (1080×1080).
 * Added by the team as a reference for the IDEAL level of scene direction,
 * cinematic framing, crowd-blur technique, and tech-glow lighting.
 * Use this as the bar to aim for in every generated design.
 */
export const IDEAL_DESIGN_REFERENCE = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GOLD-STANDARD DESIGN BRIEF — Q-FLAVOURS POS (1080×1080)
(Reference for scene quality, framing, lighting, crowd-blur, emotion)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

BRAND COLORS: Dark navy #0B1B3A · Electric blue #5B9FFF · White

LOGO PLACEMENT: Top-right, small — brand name #5B9FFF + English sub #FFFFFF + navy circle mark

MAIN VISUAL:
A packed Saudi restaurant during dinner rush hour — full tables, busy atmosphere.
FOREGROUND: sharp, focused Saudi restaurant manager/cashier (male or female,
professional uniform) confidently operating a POS tablet.
Face is clear, confident, calm. Eye contact with camera or screen.

CROWD RULE ★: ALL background customers and staff intentionally blurred —
soft gaussian blur, no recognizable faces, only ambient motion and warm light.
This is mandatory — the blur creates depth and keeps focus on the operator.

OVERLAY EFFECT:
- Subtle dark navy vignette from bottom and sides (draws eye to person + device)
- Electric blue glow (#5B9FFF) emitting from tablet screen onto operator's face
- Warm golden restaurant lights in background contrast the cool blue tech glow

TABLET SCREEN: POS dashboard with Arabic KPI cards + green "order accepted"
notification popup in Arabic. No readable text — abstract UI only.

LIGHTING RECIPE: Warm golden ambient (restaurant) vs cool electric blue (tech glow).
Cinematic contrast. High drama. Canon 85mm f/1.4 shallow depth of field.

TEXT OVERLAY (added in post by compositor, NOT in the image):
- Small pill badge: "⚡ يشتغل بدون إنترنت"
- Bold headline: "وقت الذروة ما يرحم"
- Sub-headline: "نظامك يلازم يكون جاهز دايماً"
- CTA pill: "اطلب عرضك الحين ←"

STYLE KEYWORDS: Cinematic · High-contrast drama · Saudi restaurant ambiance ·
Emotional tension + confident resolution · RTL layout · 8K photorealistic

WHY THIS WORKS:
1. Gaussian crowd blur = professional depth, no privacy issues
2. Dual lighting (warm/cool) = visual tension that sells "reliability under pressure"
3. Confident foreground subject = the user sees themselves in the ad
4. Clean screen glow = tech credibility without showing actual text
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

/**
 * Classic Qoyod brand style — a reference layout, not a hard template.
 * Use this as one valid direction among many. Mix, evolve, and subvert
 * as the concept calls for — just keep brand colors and RTL intact.
 */
export const QOYOD_CLASSIC_STYLE = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
QOYOD CLASSIC STYLE REFERENCE — Gradient Background Ad
(A known good starting point — feel free to evolve beyond this)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

FORMAT: Square (1:1) · Vertical (9:16) · Horizontal (16:9) — all work
DIRECTION: RTL Arabic throughout

BACKGROUND:
Gradient at 45° — navy #021544 top-right → teal #01355A bottom-left.
Clean, no texture, no noise. The gradient IS the atmosphere.

LAYOUT (RTL):
- Large bold Arabic headline → top-right, anchored, dominant
- Supporting line / hook → below headline, lighter weight
- Trust badge (ZATCA / +25,000 شركة) → mid area, pill shape
- CTA button → bottom-center, electric blue #1FCACB fill, navy text
  Label: "اشترك الآن" or "ابدأ تجربتك" (2–3 words max)
- QOYOD white logo → bottom-right, small, dignified

TYPOGRAPHY:
- Headline: 700 weight, white #FFFFFF, 60–80px
- Hook: 400 weight, light teal #9FE5E6, 28–34px
- CTA: 700 weight, navy #021544 on cyan #1FCACB pill

WHY THIS WORKS:
- Zero visual noise — the message IS the design
- Gradient creates depth without a photo
- Works for any product, any sector, any ratio
- Fast to produce, reliable across placements

WHEN TO USE THIS vs a cinematic photo style:
- Use gradient when the message is the hero (strong copy-led ads)
- Use cinematic photo when the scene emotion sells the product
- Mix: gradient background + product UI floating in it = best of both
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
