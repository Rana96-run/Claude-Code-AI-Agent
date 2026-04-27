# How to Copy This Into Your Existing Agent

Yes — this is designed to drop straight in. Here's exactly how, depending on how your current agent is built.

---

## Step 0: Remove SVG from your existing agent FIRST

Before adding anything new, delete this stuff from your current code:

**Delete from your codebase:**
- Any `<svg>` generation code
- Any `<text>` / `<tspan>` rendering for Arabic
- Any `text-align: justify` CSS
- Any `svgwrite`, `drawSvg`, or similar SVG library imports
- Any HTML→image conversion for text (html2canvas, Puppeteer with text layers)
- Any "fallback to SVG" logic when image gen fails

**Search your codebase for these and delete:**
```
grep -rn "svg\|<text\|svgwrite\|drawSvg\|html2canvas\|justify" .
```

If you keep ANY of these around, the bug comes back. Be ruthless.

---

## Step 1: Choose your integration path

### Path A — You're using Claude/GPT with a system prompt

1. Open your agent's system prompt file
2. Copy the entire contents of `01-system-prompt.md` and paste it into your system prompt
3. If you have other instructions, put the QOYOD agent prompt FIRST so the SVG-prohibition rule takes priority
4. Add `02-templates.md` as a knowledge file the agent can reference, OR paste the template list directly into the system prompt
5. Done. Your agent now plans designs but doesn't generate them yet — you need Path B for the generation code.

### Path B — You have a Python backend that calls image models

1. Copy `04-agent.py` into your project as `qoyod_agent.py`
2. Install dependencies:
   ```bash
   pip install pillow google-genai openai requests arabic-reshaper python-bidi
   ```
3. Set environment variables (`GOOGLE_API_KEY`, `FREEPIK_API_KEY`, `OPENAI_API_KEY`)
4. Replace your existing image-generation function with `create_design()`:

   **Before (your current broken code):**
   ```python
   def generate_design(brief):
       svg = build_svg_layout(brief)             # ← DELETE
       html = render_arabic_text(svg)            # ← DELETE
       image = html2canvas(html)                 # ← DELETE
       return image
   ```

   **After (using this agent):**
   ```python
   from qoyod_agent import create_design
   
   def generate_design(brief):
       return create_design(
           user_brief=brief,
           call_llm=my_existing_llm_function,
           output_path="/tmp/output.png",
           model="nano_banana_2",
       )
   ```

5. Your `my_existing_llm_function` should accept `(system, user, response_format)` and return a JSON string matching `DesignPlan`. If your current LLM wrapper has a different signature, write a 5-line adapter.

### Path C — You're using a Node.js / TypeScript agent

Port the prompt builder logic. The structure is dead simple — the whole `build_image_prompt()` function is just template-string assembly. Translation should take ~20 minutes.

The prompt-builder logic lives in three things:
- `BRAND_COLORS` constant
- `TEMPLATE_LAYOUTS` dict
- `build_image_prompt(plan)` function — pure string formatting

Then for image generation, use the Node SDKs:
- `@google/genai` for Nano Banana / Nano Banana 2
- `openai` for GPT Image-1
- `axios` or `fetch` for Freepik (their REST API is straightforward)

For PNG overlays use `sharp` (Node equivalent of Pillow). NEVER use any SVG library.

---

## Step 2: Test before going live

Run the agent's demo first to confirm prompt building works:

```bash
python qoyod_agent.py
```

This prints a sample image prompt without calling any API. Verify:
- ✅ The Arabic copy is included literally
- ✅ Brand colors are present (#0A1F44, #00D4C8)
- ✅ Layout description matches a template
- ✅ ZERO SVG mentions in the output

Then test ONE real generation:

```python
from qoyod_agent import create_design, DesignPlan, build_image_prompt, generate_image

# Skip the LLM, hand-build a plan to test image generation
plan = DesignPlan(
    template="hero_person_right",
    aspect_ratio="1:1",
    headline_ar="حساباتك تحت السيطرة",
    subheadline_ar="كل أرقامك في مكان واحد",
    cta_ar="اشترك الآن",
    main_subject="Saudi businessman in white thobe and red shumagh, confident expression, looking at camera",
    background_notes="Deep navy #0A1F44 with subtle cyan glow",
)
prompt = build_image_prompt(plan)
image_bytes = generate_image(prompt, "nano_banana_2", "1:1")
open("/tmp/test.png", "wb").write(image_bytes)
```

If `/tmp/test.png` looks like your reference designs → you're done.
If it doesn't → check the prompt looks right, try a different model.

---

## Step 3: Wire up the LLM planner

Your agent needs an LLM to convert user briefs → DesignPlans. Example with Anthropic SDK:

```python
import anthropic
import json

client = anthropic.Anthropic()

def my_llm(system, user, response_format):
    response = client.messages.create(
        model="claude-opus-4-7",
        max_tokens=2000,
        system=system,
        messages=[{"role": "user", "content": user}],
    )
    text = response.content[0].text
    # extract JSON if wrapped in markdown
    if "```json" in text:
        text = text.split("```json")[1].split("```")[0]
    return text.strip()
```

Or with OpenAI:

```python
from openai import OpenAI
client = OpenAI()

def my_llm(system, user, response_format):
    response = client.chat.completions.create(
        model="gpt-4o",
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
    )
    return response.choices[0].message.content
```

---

## Step 4: Pillow PNG overlays (when you need pixel precision)

For exact prices, ZATCA logos, QR codes — use the helpers in `04-agent.py`:

```python
from qoyod_agent import composite_overlays, render_arabic_to_png

# Generate the design without the precise pricing first
image = generate_image(prompt_without_price, "nano_banana_2", "1:1")

# Render the exact price as PNG using a real Arabic font
price_png = render_arabic_to_png(
    text="2,211 ﷼",
    font_path="./fonts/29LTBukra-Bold.ttf",
    font_size=120,
    color=(255, 255, 255, 255),
)
open("/tmp/price.png", "wb").write(price_png)

# Overlay it on the generated design
final = composite_overlays(image, [
    {"png_path": "/tmp/price.png", "x": 100, "y": 400, "width": 400},
    {"png_path": "./logos/zatca.png", "x": 800, "y": 50, "width": 200},
])

open("/tmp/final.png", "wb").write(final)
```

NEVER SVG. Pillow PNG only.

---

## Common questions

**Q: Can I keep my current SVG code as a fallback "in case image gen fails"?**

A: No. That's exactly the trap that got you here. If image gen fails, retry with a different model or prompt. SVG fallback = broken Arabic returning to your output.

**Q: What if I need the design to be perfectly editable later?**

A: Save the `DesignPlan` JSON. Re-running the agent with the same plan reproduces the design. The image itself is the final artifact.

**Q: Can I generate variations?**

A: Yes — call `create_design()` multiple times with the same plan. Each generation is slightly different. Or use Nano Banana 2's edit mode to tweak one specific element.

**Q: Do I need all 8 image models?**

A: No. Start with just Nano Banana 2. Add Freepik Seedance later when you want lifestyle photography variety. The router supports all of them but you only pay for what you use.

**Q: My team is attached to the SVG-based system. How do I justify the rewrite?**

A: Show them this side-by-side: your current broken Arabic vs. one Nano Banana 2 output of the same brief. The visual difference is the entire argument.
