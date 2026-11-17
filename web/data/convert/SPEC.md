# Convert AZ-900 image questions into interactive, auto-gradable questions

Each input item is an AZ-900 exam question whose question and/or answer is an image
(HOTSPOT or DRAG DROP). Look at the images with the Read tool (absolute paths given)
and produce a structured, selectable version.

## Input (one JSON array per batch file)
- `n`: question number
- `text`: question text (`//IMG//` marks where the question image goes)
- `explanation`: the site's explanation (often "Box 1: Yes ..."), may be empty
- `question_images`: absolute paths — the question / answer area
- `answer_images`: absolute paths — the official answer (selected options highlighted)
- `top_comments`: top community comments with upvotes `u` (use to judge correctness)

## Output: a JSON array, one object per input question, same order

```json
{
  "n": 3,
  "domain": "concepts | architecture | management",
  "kind": "yesno | dropdown | match | multiselect | unsupported",
  "prompt": "One-line instruction, e.g. 'For each statement, select Yes if true.'",
  "items": [
    { "label": "Full statement / sentence with ___ for the blank / target box", "options": ["Yes", "No"], "answer": "No" }
  ],
  "options": [], "answers": [],
  "confidence": "high | medium | low",
  "note": "Short reason when official answer is disputed/outdated or confidence is not high, else empty"
}
```

### Kinds
- **yesno** — "select Yes if the statement is true". One item per statement; `options` = `["Yes","No"]`.
- **dropdown** — complete-the-sentence / select from a drop-down list. One item per box; `label` is the
  sentence with `___` at the blank (include the surrounding words), `options` = every choice in that box.
- **match** — drag & drop where each target slot gets one value (or "match service to description").
  One item per target slot; `label` = the slot/description; `options` = the full value list.
- **multiselect** — drag the correct ones into the answer area, order doesn't matter (e.g. "which support
  plans allow X"). Leave `items` empty; fill top-level `options` (all choices) and `answers` (correct ones).
- **unsupported** — cannot be represented faithfully (e.g. ordered sequence with ambiguous slots, image
  unreadable). Leave items/options empty and explain in `note`.
  For an ordered sequence, use **match** with labels "Step 1", "Step 2", … instead.

### Rules
- Transcribe option and statement text exactly as shown in the image (fix obvious OCR-level typos only).
- `answer` / `answers` values must be copied exactly from the corresponding `options`.
- Correct answer: start from the answer image + explanation. If highly upvoted comments convincingly show the
  official answer is wrong or outdated (e.g. Azure AD renamed, Premier support retired, current Azure behavior),
  use the community-correct answer, set confidence `medium`, and say so in `note`.
- Base everything on current (2026) Azure facts; Azure AD is now Microsoft Entra ID — keep the question's
  wording but judge correctness against current behavior.
- `domain` per the official AZ-900 outline:
  - concepts: cloud computing, shared responsibility, public/private/hybrid, consumption/pricing models,
    serverless, HA/scalability/reliability/predictability/security/governance/manageability benefits, IaaS/PaaS/SaaS
  - architecture: regions/AZs/datacenters, resources/RGs/subscriptions/management groups, compute, networking,
    storage, identity (Entra ID, SSO, MFA, Conditional Access, RBAC, Zero Trust, defense in depth, Defender for Cloud)
  - management: cost (factors, pricing calculator, TCO, Cost Management, tags), Purview, Azure Policy, locks,
    Service Trust Portal, portal/Cloud Shell/CLI/PowerShell, Arc, IaC/ARM/Bicep, Advisor, Service Health, Monitor,
    SLAs, support plans, service lifecycle
- Write ONLY valid JSON (UTF-8, no comments, no trailing commas) to the output file.
