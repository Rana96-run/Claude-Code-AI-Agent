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

/**
 * Qoyod Main — visual style guide from production-approved designs.
 * Multiple styles observed — all valid, all in use simultaneously.
 */
export const QOYOD_MAIN_VISUAL_STYLES = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
QOYOD MAIN — PRODUCTION DESIGN STYLE GUIDE
(Observed from approved live campaigns — all styles are valid)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

HEADLINE COLOR RULE ★:
- On navy/dark background → headline is CYAN #1FCACB (NOT white)
- Secondary line / hook → WHITE #FFFFFF
- On light/white background → headline is NAVY #021544
- Never white headline on navy — that's generic. Cyan = Qoyod signature.

FOOTER (every design):
- Bottom-left: "للمزيد قم بزيارة" (small, light) + "qoyod.com" (slightly larger)
- Bottom-right: QOYOD white logo

BACKGROUND STYLES IN USE:
1. DARK NAVY flat: #021544 solid — minimal, copy-led
2. GRADIENT 45°: Navy #021544 top-right → bright teal #17A3A4 bottom-left
3. LIGHT/WHITE: Very light cyan or white — used for device mockup product shots
4. CYAN/TURQUOISE flat: Bright #1FCACB fill — used for ZATCA/regulatory news

VISUAL STYLES IN USE (pick one per ad):
A. 2D FLAT ILLUSTRATION
   - Clean vector character (blue/teal fill, white outline)
   - Person interacting with document, device, or another person
   - Placed LEFT for landscape, CENTER-BOTTOM for portrait
   - Background: solid navy or gradient only — no photo
   - Headline placement: RIGHT side (landscape) or TOP (portrait)
   - This is equally valid as photorealistic — DO NOT default to photo only

B. DEVICE MOCKUP (product shot)
   - iPhone or iPad showing Qoyod interface
   - Hand holding device, or device on surface
   - Light/white or subtle gradient background
   - Concentric circles behind the device (always)
   - "تم إصدار الفاتورة بنجاح" success notification as social proof

C. PHOTOREALISTIC SAUDI SUBJECT
   - Saudi male in thobe, confident pose, professional setting
   - Navy or gradient background
   - Subject on left for landscape, centered for portrait

D. ZATCA PARTNERSHIP / NEWS
   - ZATCA logo top-left (official partner mark)
   - Cyan background (#1FCACB) for high-attention regulatory news
   - Clean, no illustration — text + logos only
   - Date or deadline badge (navy pill, white bold text)

GRAPHIC ELEMENTS (mandatory in every design):
- Concentric circles: subtle, same color as background but slightly lighter,
  positioned behind the main visual. This is a QOYOD brand signature.
- Clean empty zone for text — always leave text area clear of visual clutter

TYPOGRAPHY RULES:
- Line 1 (main headline): CYAN #1FCACB, Lama Sans Black, large
- Line 2 (sub): WHITE #FFFFFF, Lama Sans Medium, smaller
- All Arabic text: RIGHT-ALIGNED, RTL
- CTA pill: CYAN #1FCACB fill, NAVY #021544 text, "اشترك الآن" / "ابدأ تجربتك"

RTL TEXT PLACEMENT:
- LANDSCAPE (16:9): Text block on the RIGHT half. Visual (illustration/device) on LEFT.
- SQUARE (1:1): Text TOP-RIGHT or TOP-CENTER. Visual CENTER-BOTTOM.
- PORTRAIT (9:16): Text TOP-CENTER (full width). Visual CENTER-BOTTOM.
  (Portrait is NOT a right-column layout — text spans full width at top)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

/**
 * Unified QOYOD & Q-Flavours Brand Design System
 * Source of truth for canvas, colors, layout, typography, visual style,
 * and CTA across all QOYOD products.
 */
export const QOYOD_UNIFIED_DESIGN_SYSTEM = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
UNIFIED QOYOD & Q-FLAVOURS BRAND DESIGN SYSTEM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CANVAS: 1080×1080px (1:1 square) — standard for all social media ads.

━━ BRAND IDENTITY ━━

QOYOD MAIN:
  Colors:
    Primary:    Navy #021544 / Dark Navy #0B1B3A
    Secondary:  Cyan #00B4D8 / Electric Blue #5B9FFF
    Accent:     Light Blue → Purple gradients
    Background: White, Light Cyan, or gradient (cyan→purple / blue→cyan)
  Logo: "QOYOD" wordmark in Navy — bottom-right corner
  Typography: Lama Sans (Black=headlines, Bold=subheads, Medium/Regular=body)

Q-FLAVOURS (restaurant POS sub-brand):
  Colors:
    Primary:    Dark Navy #0B1B3A
    Secondary:  Electric Blue #5B9FFF
    Background: White or navy gradients
  Logo: "فليفرز" in Electric Blue + "Flavours" in white + navy circle dot mark — top-right, small

Q-BOOKKEEPING (مسك الدفاتر):
  Colors:
    Navy #021544 (primary) + Orange (accent/CTA)
  Logo: "مسك الدفاتر BOOKKEEPING" + Q Brandmark — bottom-right, always paired with QOYOD logo

━━ TYPOGRAPHY ━━
Font: Lama Sans ONLY
  Headline:    Black weight, large (60–80pt)
  Subheadline: Bold (36–48pt)
  Body:        Medium (24–32pt)
  CTA:         Bold (28–36pt)
Alignment: RTL — all Arabic text right-aligned
Color hierarchy:
  Headlines: Navy #021544 or Electric Blue #5B9FFF
  Body: Navy or White (on dark backgrounds)
  CTA: White text on Navy / Electric Blue / Orange button

━━ VISUAL STYLE ━━

PHOTOGRAPHY:
- Realistic, human-centered: Saudi professionals (male/female) in business or restaurant settings
- Hands interacting with devices (phones, tablets, POS systems)
- Confident, calm expressions — no extreme emotions
- Depth of field: sharp focus on subject + device, soft gaussian blur on background
- NO recognizable faces in background
- Lighting: warm ambient (restaurant/office) + cool blue glow from screens (tech accent)
- Cinematic contrast, subtle vignette from edges

ILLUSTRATIONS:
- Style: Modern minimalist line art or isometric 3D
- Subjects: devices, invoices, receipts, dashboards, abstract shapes (circles, curves, waves)
- Colors: match brand palette (Navy, Cyan #00B4D8, Electric Blue #5B9FFF, White)

UI MOCKUPS:
- Show QOYOD / Q-Flavours dashboard or app interface, Arabic UI elements visible
- Realistic perspective (slight 3D tilt), screen glow effect on surrounding surface

━━ LAYOUT (RTL) ━━
- Top-right: brand logo OR headline overflow
- Right 60%: Arabic headline (large, bold, right-aligned)
- Center-left / bottom-left: visual (photo, illustration, device mockup)
- Bottom-right: QOYOD logo + qoyod.com
- Bottom-center / mid-right: CTA button

GRADIENT DIRECTION: 45° from top-right → bottom-left
  Combinations:
    Cyan #00B4D8 → Navy #021544
    Electric Blue #5B9FFF → Dark Navy #0B1B3A
    Light Blue → Purple
    White → Light Cyan

━━ CTA BUTTON ━━
Shape: Rounded pill (border-radius: 24–32px)
Colors:
  QOYOD Main:       Navy #021544 background, White text
  Q-Flavours:       Electric Blue #5B9FFF background, White text
  Q-Bookkeeping:    Orange background, White text
Text: Bold, 28–36pt, Arabic, include arrow ←
Examples: "اشترك الآن ←" / "اطلب عرضك الحين ←" / "ابدأ تجربتك المجانية"

━━ GRAPHIC ACCENTS ━━
- Q-shape watermark: 50% opacity, soft-light blend, subtle
- Concentric circles: thin stroke, cyan or navy, corner placement (brand signature)
- Curved lines connecting text to visual, thin stroke
- Screen glow: blue/cyan radiance from device screens
- Vignette: dark navy, 20–30% opacity from edges
- Shadows: soft drop shadow on devices (y-offset 20–40px, blur 60px, opacity 25%)

━━ PRODUCT-SPECIFIC GUIDELINES ━━

QOYOD (Accounting):
  Focus: desktop/tablet dashboard, reports, invoices
  Key messages: "كل الحلول توديك لقيود" / "أصدر فاتورتك الإلكترونية بكل سهولة" / "باقاتنا مفصلة تفصيل"
  Visuals: laptop with multi-package dashboard, tablet with package comparison, phone with e-invoice

Q-FLAVOURS (Restaurant POS):
  Focus: real-time POS usage, restaurant environment, offline functionality
  Key messages: "وقت الذروة ما يرحم" / "نظامك يلازم يكون جاهز دايماً"
  Badge: "⚡ يشتغل بدون إنترنت"
  Visuals: busy restaurant (blurred background), Saudi manager/cashier on POS tablet, blue glow from screen

Q-BOOKKEEPING:
  Focus: professional service, compliance, ease
  Branding: ALWAYS co-branded (Q-Bookkeeping + QOYOD logos)

━━ MANDATORY ELEMENTS (every design) ━━
1. Main headline — Arabic, large, right-aligned, Navy or Electric Blue
2. Subheadline — Arabic, medium, right-aligned
3. Visual — photo, illustration, or UI mockup (left/center-left)
4. CTA button — pill-shaped, brand color, white text, Arabic with arrow
5. Logo — QOYOD bottom-right / Q-Flavours top-right / Q-Bookkeeping bottom-right
6. Website — "qoyod.com" or "للمزيد قم بزيارة qoyod.com" — bottom-left, small, Navy or White

━━ STYLE BY CAMPAIGN TYPE ━━

FEATURE / BENEFIT:
  Clean gradient or solid bg, UI mockup or illustration, clear headline hierarchy, calm professional tone

HIGH-DRAMA / URGENCY (Q-Flavours):
  Cinematic photography, strong contrast, vignette, emotional tension visual, bold urgent headline, badge callout

PACKAGE / PRICING (QOYOD):
  Detailed dashboard UI visible, emphasis on variety/customization, multiple package names shown

━━ FINAL CHECKLIST ━━
✓ Canvas 1080×1080px  ✓ RTL layout applied  ✓ Lama Sans (correct weights)
✓ Headline large, bold, right-aligned  ✓ CTA pill-shaped, brand color, white text
✓ Correct logo(s) placed  ✓ qoyod.com bottom-left  ✓ Gradient 45° top-right→bottom-left
✓ Visual clear & on-brand  ✓ No recognizable background faces  ✓ Screen glow on devices
✓ Soft shadows on floating elements  ✓ All text legible at thumbnail size
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

/**
 * Qoyod Bookkeeping sub-brand — مسك الدفاتر
 * Designer notes: apply to ALL bookkeeping product designs.
 * Based on production-approved designs reviewed by the team.
 */
export const QOYOD_BOOKKEEPING_CONTEXT = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SUB-BRAND: QOYOD BOOKKEEPING — مسك الدفاتر
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

WHAT IT IS:
Qoyod's managed bookkeeping service — Saudi SME owners outsource their
accounting to a dedicated SOCPA-certified accountant powered by the Qoyod platform.
Positioning: "محاسب متخصص + منصة قيود — كل شيء جاهز لك"

BRAND COLORS (different from Qoyod main — orange replaces teal):
- Primary background: deep navy #021544
- Secondary background: royal blue (deeper, richer than Qoyod main)
- ACCENT: Orange (prominent — CTA, headlines, key words) — NOT teal
- Text on dark: White #FFFFFF
- Light bg text: Navy #021544
- Gradient: 45° top-right → bottom-left (navy to royal blue)

LOGO TREATMENT (mandatory on every design):
- Bottom-right: QOYOD logo + "مسك الدفاتر BOOKKEEPING" wordmark + Q circle brandmark
- Both logos together as a unit — never one without the other
- Bottom-left: qoyod.com (white, small, always present)

TYPOGRAPHY — Lama Sans ONLY:
- Headlines: Lama Sans Black — large, bold, dominant
- Sub-headlines / supporting text: Lama Sans Medium
- CTA button text: Lama Sans Bold
- Body / body bullets: Lama Sans Regular
- ALL Arabic text right-aligned

CTA BUTTON:
- Color: Orange fill, white text
- Label for bookkeeping: "احصل على عرض السعر الآن" (NOT "ابدأ تجربتك")
- Pill-shaped, bottom area, prominent

GRAPHIC ELEMENTS (include at least one per design):
- Q shape watermark: 50% opacity, soft-light or outline mode — subtle brand marker
- Concentric circles pattern: decorative rings, often behind the subject
- Floating document elements (invoices, reports) — shows the "chaos we solve"
- Saudi subject in professional setting (thobe, confident or stressed depending on angle)

VISUAL ANGLES THAT WORK (from approved production designs):
1. DEVICE + DASHBOARD: Tablet showing مسك الدفاتر interface — product proof
2. CONFIDENT SUBJECT: Saudi man/woman standing confident, arms crossed — aspirational
3. STRESS/OVERWHELM: Subject head in hands, papers flying everywhere — pain point
4. CINEMATIC CORPORATE: Real location (office building, city), ambitious mood
5. FLOATING DOCUMENTS: Subject surrounded by swirling invoices/reports — chaos narrative

SCENE PROMPT RULES (for image generation):
- Navy/royal blue background as base — NOT natural environments unless strong concept
- Saudi male or female subject in professional dress (thobe for male)
- Always leave top-third clear for Arabic headline typography in post
- Soft concentric circle pattern or Q watermark in background (subtle)
- Papers/documents/financial data elements = chaos that Qoyod bookkeeping solves
- NO English text in the scene — Arabic context only
- Orange accent lighting matches the brand accent color

COPY PATTERNS (from approved campaigns):
- Pain: "حساباتك خارجة عن السيطرة؟" / "ما عندك وقت للمحاسبة؟"
- Solution: "خدمة مسك الدفاتر من قيود" / "قيود يوفّر لك محاسب مخصص"
- Trust: "مع فريق مختص ومعتمد من SOCPA"
- CTA: "احصل على عرض السعر الآن"

DIFFERENTIATOR FROM QOYOD MAIN:
- Qoyod Main = DIY software (you do your own accounting)
- مسك الدفاتر = Done-for-you service (we do your accounting for you)
- Different audience: owners who don't want to learn software, want a human accountant
- Different trust signal: SOCPA-certified team (not just ZATCA software)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
