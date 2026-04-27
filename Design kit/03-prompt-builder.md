# Image Prompt Builder

The agent assembles every image-generation prompt using this skeleton. Every section must be present.

---

## Master skeleton

```
[FORMAT_SPEC]
Professional Saudi Arabic [social media post / advertisement / banner], 
[ASPECT_RATIO] aspect ratio, [DIMENSIONS]px.

[LAYOUT_BLOCK]
Layout follows the [TEMPLATE_NAME] pattern:
[detailed zone-by-zone description from template]

[ARABIC_TEXT_BLOCK]
Render the following Arabic text INSIDE the image, with proper 
right-to-left flow, naturally connected letters, normal word 
spacing (no excessive gaps), and no broken or disconnected 
characters:

- HEADLINE (top, large, [color], [weight] Arabic display 
  typeface like 29LT Bukra ExtraBold): "[ARABIC_HEADLINE]"
- SUBHEADLINE ([position], medium size, [color], medium-weight 
  Arabic typeface like Tajawal Medium): "[ARABIC_SUBHEAD]"
- CTA BUTTON ([position], pill-shaped, [bg color], white 
  Arabic text, medium weight): "[ARABIC_CTA]"

[VISUAL_BLOCK]
Main subject: [detailed description of person / device / 
illustration including pose, lighting, expression, clothing]

[BACKGROUND_BLOCK]
Background: [color spec / gradient / texture]. [Any decorative 
elements like circles, waves, glows].

[BRANDING_BLOCK]
- Bottom-left corner: small white text "qoyod.com" 
  in clean sans-serif
- Bottom-right corner: white "QOYOD" wordmark logo, 
  modern geometric sans-serif
- [Bottom-center: ZATCA Authority logo if compliance-related]

[STYLE_BLOCK]
Style: Premium fintech advertisement, photorealistic where 
applicable, sharp focus, professional studio lighting, clean 
modern composition, Saudi Arabian cultural context. 
Color palette strictly: navy #0A1F44, cyan #00D4C8, 
orange #FF6B35, white #FFFFFF, light blue #B8E0F0.

[NEGATIVE_BLOCK]
Avoid: broken Arabic letters, disconnected characters, 
left-to-right Arabic, romanized text, excessive word spacing, 
generic stock photo look, AI artifacts on faces or hands, 
incorrect typography, low-quality rendering.
```

---

## Rules for filling the skeleton

**1. Always quote Arabic text exactly**
Use double quotes around every Arabic string. The model copies what's inside the quotes literally — this is how you prevent it from "interpreting" or paraphrasing your copy.

**2. Always specify text properties explicitly**
For each text element, state: position, size (small/medium/large/huge), color (hex), weight (bold/medium/regular), and typeface family (descriptive — the model can't load fonts but understands "29LT Bukra style").

**3. Always include the negative block**
Image models for Arabic frequently break letters when they're uncertain. The negative block is your insurance.

**4. Aspect ratio + dimensions go together**
- 1:1 → 1080×1080
- 9:16 → 1080×1920
- 16:9 → 1920×1080
- 4:5 → 1080×1350

**5. Reference real Arabic typefaces by name**
The image model has seen these names during training and will produce closer-matching results:
- Display/Headlines: "29LT Bukra", "GE SS Two Bold", "Tajawal Black", "IBM Plex Sans Arabic Bold"
- Body/Subhead: "Tajawal Medium", "IBM Plex Sans Arabic Regular", "Cairo Medium"
- Avoid: "Arial", "Helvetica" (generic, low-quality output)

---

## Worked example 1: Trust-building post

**User brief:** "Make me an Instagram post about how QOYOD helps you manage all your accounts. Show a Saudi businessman. Square format."

**Agent's plan:**
- Template: 1 (`hero_person_right`)
- Aspect ratio: 1:1
- Headline: "حساباتك تحت السيطرة" (Your accounts under control)
- Subheadline: "كل أرقامك في مكان واحد، واضحة ومرتبة" (All your numbers in one place, clear and organized)
- CTA: "اشترك الآن" (Subscribe now)

**Final image prompt:**

```
Professional Saudi Arabic social media post, 1:1 aspect ratio, 
1080x1080 pixels.

Layout follows the hero_person_right pattern:
- Top 40% of image: Arabic text zone, right-aligned
- Bottom 60%: Saudi businessman, centered, looking directly 
  at camera with confident expression
- Bottom-left corner: qoyod.com text
- Bottom-right corner: QOYOD wordmark logo

Render the following Arabic text INSIDE the image, with proper 
right-to-left flow, naturally connected letters, normal word 
spacing (no excessive gaps), and no broken or disconnected 
characters:

- HEADLINE (top-right, very large, cyan #00D4C8, extra-bold 
  Arabic display typeface like 29LT Bukra ExtraBold): 
  "حساباتك تحت السيطرة"
- SUBHEADLINE (below headline, medium size, white #FFFFFF, 
  medium-weight Arabic typeface like Tajawal Medium): 
  "كل أرقامك في مكان واحد، واضحة ومرتبة"
- CTA BUTTON (below subheadline, pill-shaped, cyan #00D4C8 
  background, white Arabic text, medium weight): "اشترك الآن"
- Small ZATCA partnership pill above CTA: dark navy background, 
  white text "معتمد ZATCA-"

Main subject: Saudi businessman in his early 30s wearing 
traditional white thobe and red-checkered shumagh with black 
agal, clean trimmed beard, calm confident expression, looking 
directly at camera, hands resting on a closed laptop on a 
wooden desk, soft warm rim lighting on his face from the right.

Background: Deep navy gradient #0A1F44 fading slightly darker 
toward the edges, subtle warm cyan glow behind the subject's 
head suggesting an out-of-focus office window.

Branding:
- Bottom-left corner: small white text "qoyod.com" in clean 
  sans-serif
- Bottom-right corner: white "QOYOD" wordmark logo

Style: Premium fintech advertisement, photorealistic, sharp 
focus on the subject's face, professional studio lighting, 
clean modern composition, Saudi Arabian cultural context. 
Color palette strictly: navy #0A1F44, cyan #00D4C8, 
white #FFFFFF.

Avoid: broken Arabic letters, disconnected characters, 
left-to-right Arabic, romanized text, excessive word spacing 
between words, generic stock photo look, AI artifacts on the 
face or hands, incorrect Arabic typography, justified text 
alignment, words separated by huge gaps.
```

---

## Worked example 2: Product feature post

**User brief:** "Show our e-invoicing feature. Square format."

**Agent's plan:**
- Template: 2 (`device_showcase_split`)
- Aspect ratio: 1:1
- Headline: "فاتورتك الإلكترونية بضغطة زر" (Your e-invoice with one click)
- Subheadline: "أصدر فواتيرك وارفعها لزاتكا في ثواني" (Issue and submit invoices to ZATCA in seconds)
- CTA: "ابدأ تجربتك المجانية" (Start your free trial)

**Final image prompt:**

```
Professional Saudi Arabic product advertisement, 1:1 aspect 
ratio, 1080x1080 pixels.

Layout follows the device_showcase_split pattern:
- Right 50%: Realistic iPhone 15 Pro mockup floating at slight 
  angle, screen showing QOYOD invoice app with green checkmark 
  "تم اصدار الفاتورة بنجاح" success state
- Left 50% (text zone, right-aligned for RTL): Headline at top, 
  subheadline below, CTA button at bottom
- Bottom-left corner: qoyod.com
- Bottom-right corner: QOYOD logo

Render the following Arabic text INSIDE the image, with proper 
right-to-left flow, naturally connected letters, normal word 
spacing, no broken characters:

- HEADLINE (left-zone top, very large, white #FFFFFF, extra-bold 
  Arabic display typeface like 29LT Bukra ExtraBold, 2 lines):
  "فاتورتك الإلكترونية" / "بضغطة زر"
- SUBHEADLINE (below headline, medium, light blue #B8E0F0, 
  medium-weight Tajawal Medium style):
  "أصدر فواتيرك وارفعها لزاتكا في ثواني"
- CTA BUTTON (below subheadline, pill-shaped, cyan #00D4C8 
  background, navy #0A1F44 Arabic text, medium-bold weight):
  "ابدأ تجربتك المجانية"

Main subject: Photorealistic iPhone 15 Pro held at slight angle, 
screen showing a clean QOYOD invoicing app interface with a 
green circular checkmark icon, success message in Arabic, and 
an invoice receipt with QR code. Subtle drop shadow under phone.

Background: Deep navy #0A1F44 with concentric circle pattern in 
slightly lighter navy emanating from the phone, creating a 
focal-point effect.

Branding:
- Bottom-left corner: small white text "qoyod.com"
- Bottom-right corner: white "QOYOD" wordmark logo

Style: Premium fintech product showcase, photorealistic device 
rendering, sharp UI screen detail, professional studio lighting, 
modern clean composition. Color palette: navy #0A1F44, cyan 
#00D4C8, light blue #B8E0F0, white #FFFFFF.

Avoid: broken Arabic letters, disconnected characters, 
left-to-right Arabic, romanized text, excessive word spacing, 
fake-looking phone mockup, AI artifacts, justified text, 
illegible UI elements.
```

---

## Worked example 3: Discount offer

**User brief:** "End-of-year offer, 2,211 SAR for 3 years instead of 3,300. Use a Saudi person holding a phone."

**Agent's plan:**
- Template: 6 (`pricing_offer`)
- Aspect ratio: 1:1
- Headline: "أفضل برنامج سعودي" (Best Saudi software)
- Subheadline: "في إدارة مهامك المحاسبية" (For managing your accounting tasks)
- Pricing: New 2,211 ﷼ / Old 3,300 strikethrough
- Note: pricing numbers should be PNG-overlaid for accuracy, but include in prompt as guide

**Final image prompt:**

```
Professional Saudi Arabic promotional advertisement, 1:1 aspect 
ratio, 1080x1080 pixels.

Layout follows the pricing_offer pattern:
- Top 30%: Cyan headline + white subheadline, right-aligned
- Middle-left 40%: Rounded pricing card with new price prominent 
  and old price strikethrough
- Right 50%: Saudi businessman in traditional dress holding 
  phone showing dashboard
- Bottom: qoyod.com + ZATCA logo + QOYOD logo

Render the following Arabic text INSIDE the image, properly 
connected RTL letters, normal word spacing, no broken characters:

- HEADLINE (top-right, very large 2 lines, cyan #00D4C8, 
  extra-bold Arabic display, 29LT Bukra ExtraBold style):
  "أفضل برنامج سعودي"
- SUBHEADLINE (below, medium, white #FFFFFF, Tajawal Medium): 
  "في إدارة مهامك المحاسبية"
- PRICING CARD (middle-left, rounded rectangle with subtle navy 
  border on transparent dark background):
    * Top line, medium white text: "الآن بـ"
    * Massive bold white number with riyal symbol: "2,211 ﷼"
    * Below in smaller white: "للسنة للباقة المتقدمة لمدة 3 سنوات"
    * Bottom line, small grey + red strikethrough: 
      "بدلاً من 3,300"

Main subject: Smiling Saudi businessman, early 30s, traditional 
white thobe, red-and-white shumagh with black agal, holding 
modern smartphone in his right hand displaying QOYOD finance 
dashboard with charts and numbers. Friendly direct gaze at 
camera, warm lighting.

Background: Deep navy #0A1F44 with subtle radial cyan glow 
behind subject. Slight texture suggesting depth without 
distraction.

Branding:
- Bottom-left corner: small white "qoyod.com"
- Bottom-center: ZATCA Authority official logo (dark/light 
  version on navy)
- Bottom-right corner: white "QOYOD" wordmark logo

Style: Premium Saudi fintech promotional ad, photorealistic, 
high-end studio lighting, polished commercial look, sharp 
focus throughout. Strict palette: #0A1F44, #00D4C8, #FFFFFF.

Avoid: broken Arabic letters, disconnected characters, 
left-to-right Arabic, romanized text, justified spacing, 
generic stock photo aesthetic, blurry numbers, AI artifacts 
on face/hands/phone, illegible pricing, wrong currency symbol.
```

> **Post-processing step for example 3:** After generation, 
> overlay the exact pricing numbers ("2,211 ﷼" and "3,300") as 
> PNG layers using Pillow/Sharp, in case the image model 
> renders them imprecisely. The ZATCA official logo should also 
> be PNG-overlaid since image models often misrender it.
