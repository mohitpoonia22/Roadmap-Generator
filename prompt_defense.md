# Prompt Defense — Group 1: Roadmap Generator

## What the system prompt does and why

### 1. Role definition
The model is told it is a "career roadmap architect" with a "sole function" — not a general assistant.
This narrows its behaviour and stops it from adding explanations, preambles, or apologies.

### 2. JSON-only output enforcement
Three layers of enforcement:
- System prompt says "output ONLY a valid JSON object — no markdown code fences, no prose"
- A final self-check list before output explicitly says "no markdown, no commentary"
- The `extractJSON()` function in `index.js` strips markdown fences and finds the JSON object even if the model misbehaves

Why all three: Claude sometimes wraps JSON in ```json blocks despite instructions. Belt-and-suspenders extraction means the POC never hard-fails on formatting.

### 3. blur_level hardcoding
The `generateRoadmap()` function in `index.js` **post-processes** the output and forces `blur_level` to `[0,0,1,2,3,3,3]` regardless of what the model returned.

Why: The blur_level spec is non-negotiable for the product. If the model hallucinates a different value (it rarely does, but it can), the output schema would break downstream. Programmatic enforcement is safer than prompt-only enforcement.

### 4. unlock_statement — the hardest field

**First attempt:** Just saying "make it personal" produced generic outputs like "You will be ready to apply for jobs."

**What broke:** Claude defaults to safe, template-sounding language unless forced to use specific user data.

**Fix:** The prompt explicitly lists which fields to pull from (`name`, `current_role`, `target_role`, `skills[]`, `vision_profile.*`) and gives 4 "BAD" examples alongside 4 "GOOD" examples with the exact style expected.

**Final rule in prompt:** "At least 3 unlock_statements must directly reference the user's name or a specific detail from their input."

This forces Claude to read the input deeply, not pattern-match to a generic template.

### 5. ICP fork

**What broke without it:** ICP-B users got software engineering language ("open a terminal", "push a PR") which is irrelevant and demotivating for a delivery partner.

**Fix:** Explicit fork rules. high_wage → technical vocabulary (GitHub, DSA, system design). low_wage → workplace vocabulary (typing speed, Excel rows, office communication). The fork is baked into the prompt, not inferred.

### 6. Hindi output

`language: "hi"` triggers Hindi (Devanagari) for `title` and `unlock_statement`. Salary tiers, codes, and counts stay in standard format because those are rendered as data, not read as prose.

The good example in the prompt includes a Hindi unlock_statement so Claude has a reference point.

### 7. urgency_months

**What broke without explicit rules:** Urgency had no effect — M01 milestones said "in 2 months" regardless of whether urgency was 3 or 12 months.

**Fix:** Three explicit tiers (≤3, 4–6, >6) with concrete framing ("achievable in 3 days", "this week", etc.). This makes urgency visible in the unlock_statement and milestone titles.

### 8. count rules

`scenario_count`, `assessment_count`, `mock_interview_count` decrease as `blur_level` increases. This reflects the product reality: blurred milestones have less detail because the user hasn't earned them yet.

---

## What I tried first that didn't work

| Attempt | Problem |
|---|---|
| Single-sentence "make it personal" | Generic, safe outputs |
| No BAD/GOOD examples | Claude didn't understand the quality bar |
| No ICP fork rules | ICP-B got SWE language |
| No urgency rules | urgency_months was ignored |
| No post-processing on blur_level | Occasional off-by-one errors in blur values |
| Asking model to output markdown then parsing it | Fragile — sometimes extra text broke JSON.parse |

---


