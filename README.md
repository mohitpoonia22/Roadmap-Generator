# Roadmap Generator — Group 1

Generates a personalised 7-milestone career roadmap JSON from a user profile using an LLM.
Works for both **ICP-A** (high_wage, English) and **ICP-B** (low_wage, Hindi).

---

## Setup (under 2 minutes)

**1. Clone / download the repo**

**2. Install dependencies**
```bash
npm install
```

**3. Create a `.env` file in the project root**
```
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile
```

Get a free Groq API key at: **console.groq.com** → API Keys → Create API Key

**4. Run all 10 test cases**
```bash
node test.js
```

---

## Single input usage

```bash
# From a file
node index.js test_cases/icp_a_1.json

# From stdin
node index.js < test_cases/icp_b_1.json
```

---

## Input schema

```json
{
  "icp_type": "high_wage | low_wage",
  "name": "User's name",
  "current_role": "What they do now",
  "target_role": "Where they want to go",
  "urgency_months": 6,
  "skills": ["skill1", "skill2"],
  "language": "en | hi",
  "vision_profile": {
    "current_life": "Their day-to-day reality",
    "main_blocker": "What's stopping them",
    "vision_12mo": "Where they want to be in 12 months",
    "top_motivation": "Why this matters to them"
  }
}
```

---

## Output schema

```json
{
  "milestones": [
    {
      "code": "M01",
      "title": "Milestone name",
      "salary_tier": "₹6–8 LPA",
      "unlock_statement": "Vivid, personal statement of what the user can do at this stage",
      "blur_level": 0,
      "scenario_count": 4,
      "assessment_count": 3,
      "mock_interview_count": 2
    }
  ]
}
```

**blur_level** is always fixed: M01=`0`, M02=`0`, M03=`1`, M04=`2`, M05=`3`, M06=`3`, M07=`3`

**salary_tier** format:
- `high_wage` → annual LPA bands (₹0–6 LPA … ₹40+ LPA)
- `low_wage` → monthly bands (₹0–12k/month … ₹35k+/month)

---

## Project structure

```
index.js           — generateRoadmap(profile) → JSON  (main function + CLI)
prompt.js          — System prompt
test.js            — Runs all 10 test cases with schema validation
test_cases/        — 10 input JSONs (icp_a_1–icp_a_5, icp_b_1–icp_b_5)
outputs/           — 10 generated output JSONs (auto-created on test run)
prompt_defense.md  — Prompt design decisions and what was tried
```

---

## Test cases

| # | Type | Name | Route | Urgency |
|---|---|---|---|---|
| icp_a_1 | ICP-A | Riya Sharma | CS student → SWE | 6 months |
| icp_a_2 | ICP-A | Aryan Kapoor | Mech Engg → Backend Dev | 12 months |
| icp_a_3 | ICP-A | Sneha Reddy | BCA grad → Frontend Dev | 4 months |
| icp_a_4 | ICP-A | Kabir Shah | Marketing → Product Manager | 9 months |
| icp_a_5 | ICP-A | Tanvir Ahmed | Fresher → Data Engineer | 3 months |
| icp_b_1 | ICP-B | Arjun Yadav | Delivery → Data Entry | 3 months |
| icp_b_2 | ICP-B | Sunita Devi | Domestic worker → Cust Support | 6 months |
| icp_b_3 | ICP-B | Ramesh Kumar | Auto driver → Office Admin | 4 months |
| icp_b_4 | ICP-B | Kavita Singh | Factory worker → Cashier | 3 months |
| icp_b_5 | ICP-B | Deepak Sharma | Security guard → BPO Agent | 5 months |
