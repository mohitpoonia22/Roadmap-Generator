'use strict';

require('dotenv').config();
const Groq = require('groq-sdk');
const { SYSTEM_PROMPT } = require('./prompt');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

function extractJSON(text) {
  const trimmed = text.trim();

  try { return JSON.parse(trimmed); } catch {}

  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    try { return JSON.parse(fenceMatch[1].trim()); } catch {}
  }

  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start !== -1 && end > start) {
    try { return JSON.parse(trimmed.slice(start, end + 1)); } catch {}
  }

  throw new Error(`Cannot parse JSON from model response.\nRaw output:\n${trimmed.slice(0, 500)}`);
}

async function generateRoadmap(userProfile) {
  const completion = await groq.chat.completions.create({
    model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
    temperature: 0.7,
    max_tokens: 4096,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user',   content: JSON.stringify(userProfile, null, 2) }
    ]
  });

  const raw = completion.choices[0].message.content;
  const parsed = extractJSON(raw);

  // Hard-enforce blur_level spec regardless of what the model returned
  const BLUR_MAP = [0, 0, 1, 2, 3, 3, 3];
  if (parsed.milestones && Array.isArray(parsed.milestones)) {
    parsed.milestones.forEach((m, i) => {
      if (i < BLUR_MAP.length) m.blur_level = BLUR_MAP[i];
    });
  }

  return parsed;
}

// CLI: node index.js test_cases/icp_a_1.json   or   node index.js < file.json
if (require.main === module) {
  const fs = require('fs');
  const filePath = process.argv[2];

  if (filePath) {
    const input = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    generateRoadmap(input)
      .then(out => console.log(JSON.stringify(out, null, 2)))
      .catch(err => { console.error(err.message); process.exit(1); });
  } else {
    const chunks = [];
    process.stdin.on('data', c => chunks.push(c));
    process.stdin.on('end', () => {
      const input = JSON.parse(Buffer.concat(chunks).toString('utf8'));
      generateRoadmap(input)
        .then(out => console.log(JSON.stringify(out, null, 2)))
        .catch(err => { console.error(err.message); process.exit(1); });
    });
  }
}

module.exports = { generateRoadmap };
