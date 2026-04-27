# QOYOD AI Design Agent — Quick Start

A complete AI-native design agent for QOYOD that generates Saudi Arabic social media designs **purely with image-generation models**. Zero SVG. Zero HTML text overlay. Zero broken Arabic.

## Supported image models

- **Nano Banana 2** (Gemini 3 Pro Image) — DEFAULT, best Arabic
- **Nano Banana** (Gemini 2.5 Flash Image) — cheaper fallback
- **Freepik Seedance** — premium photorealism
- **Freepik Mystic** — artistic / illustrated
- **Freepik Flux Pro / Dev** — general purpose
- **Freepik Imagen 3** — photorealism via Freepik
- **GPT Image-1** — text-heavy designs
- **Imagen 4 Pro** — ultra photorealism

## What's in the box

| File | Purpose |
|---|---|
| `01-system-prompt.md` | Drop into your agent's system prompt. **Includes the explicit NO-SVG rule.** |
| `02-templates.md` | 10-template library — every design picks one |
| `03-prompt-builder.md` | Prompt-assembly skeleton + 3 worked examples |
| `04-agent.py` | Working Python code with all 4 model providers wired |
| `INTEGRATION.md` | How to copy this into your existing agent |

## Architecture (zero SVG)

```
USER BRIEF
    ↓
[Claude/GPT plans the design — picks template, writes Arabic copy]
    ↓
[Python builds the image prompt deterministically]
    ↓
[Nano Banana 2 / Freepik / GPT Image-1 generates the entire design 
 as ONE image — Arabic text rendered NATIVELY inside]
    ↓
[OPTIONAL: Pillow composites precise PNG overlays — exact prices, 
 ZATCA logos, QR codes. NEVER SVG.]
    ↓
FINAL DESIGN
```

## Setup

```bash
pip install pillow google-genai openai requests arabic-reshaper python-bidi
```

Environment variables:
```bash
export GOOGLE_API_KEY=...      # for Nano Banana 1 & 2, Imagen
export FREEPIK_API_KEY=...     # for Seedance, Mystic, Flux, Imagen3 (Freepik)
export OPENAI_API_KEY=...      # for GPT Image-1
```

## Try it

```python
from agent import create_design

def my_llm(system, user, response_format):
    # call Claude / GPT here, return a JSON string matching DesignPlan
    ...

create_design(
    user_brief="Square Instagram post about how QOYOD helps manage "
               "all your accounts. Show a confident Saudi businessman.",
    call_llm=my_llm,
    output_path="./output.png",
    model="nano_banana_2",   # or "freepik_seedance", "gpt_image_1", etc.
)
```

## Why this beats SVG-based generation

| SVG-based approach (broken) | AI-native (this agent) |
|---|---|
| Arabic letters disconnect | Native correct rendering |
| Words have huge gaps | Natural word spacing |
| Generic-looking layouts | Reference-quality composition |
| Code generates pixels | Image model generates pixels |
| Fonts depend on environment | Model knows Arabic typefaces |
| Fix attempts add more SVG | Fix via model edit mode |

## Iteration loop

When the first generation has a flaw:

1. **Don't fall back to SVG.** That's what created the original problem.
2. Use Nano Banana 2's multi-turn edit mode (best for fixing specific words/elements)
3. Or refine the prompt and regenerate
4. Or switch models (e.g., Nano Banana 2 → Freepik Seedance)
5. For pixel-exact elements (prices, logos, QR codes), use `composite_overlays()` with PNG — NOT SVG

## Where to put precision overlays

Some elements need pixel-perfect accuracy that even Nano Banana 2 can occasionally miss:

| Element | Recommended approach |
|---|---|
| Headline / subheadline / CTA text | Image model (native Arabic rendering) |
| Person / device / illustration | Image model |
| Background / colors / layout | Image model |
| Exact pricing numbers (e.g., "2,211 ﷼") | PNG overlay via `composite_overlays()` |
| ZATCA official logo | PNG overlay |
| QR codes | PNG overlay |
| QOYOD wordmark (if pixel-exact match needed) | PNG overlay |

The `render_arabic_to_png()` helper in `04-agent.py` rasterizes Arabic text from a real TTF/OTF font with proper shaping — for the rare cases the image model needs help.
