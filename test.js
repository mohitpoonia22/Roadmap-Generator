'use strict';

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { generateRoadmap } = require('./index');

const REQUIRED_FIELDS = [
  'code', 'title', 'salary_tier', 'unlock_statement',
  'blur_level', 'scenario_count', 'assessment_count', 'mock_interview_count'
];
const EXPECTED_CODES   = ['M01','M02','M03','M04','M05','M06','M07'];
const EXPECTED_BLURS   = [0, 0, 1, 2, 3, 3, 3];

function validate(output, label) {
  const errors = [];

  if (!output || typeof output !== 'object') {
    return { valid: false, errors: ['Output is not an object'] };
  }
  if (!Array.isArray(output.milestones)) {
    return { valid: false, errors: ['Missing milestones array'] };
  }
  if (output.milestones.length !== 7) {
    errors.push(`Expected 7 milestones, got ${output.milestones.length}`);
  }

  output.milestones.forEach((m, i) => {
    const tag = `M${String(i + 1).padStart(2, '0')}`;

    REQUIRED_FIELDS.forEach(f => {
      if (m[f] === undefined || m[f] === null || m[f] === '') {
        errors.push(`${tag}: missing or empty field "${f}"`);
      }
    });

    if (m.code !== EXPECTED_CODES[i]) {
      errors.push(`${tag}: expected code "${EXPECTED_CODES[i]}", got "${m.code}"`);
    }

    if (m.blur_level !== EXPECTED_BLURS[i]) {
      errors.push(`${tag}: expected blur_level ${EXPECTED_BLURS[i]}, got ${m.blur_level}`);
    }

    ['scenario_count','assessment_count','mock_interview_count'].forEach(f => {
      if (typeof m[f] !== 'number') {
        errors.push(`${tag}: "${f}" must be a number, got ${typeof m[f]}`);
      }
    });

    const generic = [
      'you will have completed the milestone',
      'you will have learned the required skills',
      'you will be ready for the next stage',
      'you will have mastered the fundamentals'
    ];
    const stmt = (m.unlock_statement || '').toLowerCase();
    generic.forEach(g => {
      if (stmt.includes(g)) {
        errors.push(`${tag}: unlock_statement is too generic ("${g}")`);
      }
    });
  });

  // Check unlock_statement uniqueness
  const stmts = output.milestones.map(m => (m.unlock_statement || '').slice(0, 60).toLowerCase());
  const dupes = stmts.filter((s, i) => stmts.indexOf(s) !== i);
  if (dupes.length > 0) {
    errors.push(`Duplicate unlock_statements detected`);
  }

  return { valid: errors.length === 0, errors };
}

async function runTest(inputPath, outputPath, label, index, total) {
  const input = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  process.stdout.write(`[${index}/${total}] ${label} ... `);

  const start = Date.now();
  let output;
  try {
    output = await generateRoadmap(input);
  } catch (err) {
    console.log(`FAIL — API error: ${err.message}`);
    return false;
  }
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);

  const { valid, errors } = validate(output, label);

  if (valid) {
    console.log(`PASS (${elapsed}s)`);
  } else {
    console.log(`FAIL (${elapsed}s)`);
    errors.forEach(e => console.log(`       ✗ ${e}`));
  }

  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf8');
  console.log(`       → saved to ${path.relative(process.cwd(), outputPath)}`);

  return valid;
}

async function main() {
  if (!process.env.GROQ_API_KEY) {
    console.error('ERROR: GROQ_API_KEY is not set. Create a .env file with GROQ_API_KEY=your_key');
    process.exit(1);
  }

  const cases = [
    // ICP-A
    { file: 'icp_a_1', label: 'ICP-A | Riya Sharma — CS student → SWE (6mo)' },
    { file: 'icp_a_2', label: 'ICP-A | Aryan Kapoor — Mech Engg → Backend Dev (12mo)' },
    { file: 'icp_a_3', label: 'ICP-A | Sneha Reddy — BCA grad → Frontend Dev (4mo)' },
    { file: 'icp_a_4', label: 'ICP-A | Kabir Shah — Marketing → Product Manager (9mo)' },
    { file: 'icp_a_5', label: 'ICP-A | Tanvir Ahmed — Fresher → Data Engineer (3mo)' },
    // ICP-B
    { file: 'icp_b_1', label: 'ICP-B | Arjun Yadav — Delivery → Data Entry (3mo)' },
    { file: 'icp_b_2', label: 'ICP-B | Sunita Devi — Domestic worker → Cust Support (6mo)' },
    { file: 'icp_b_3', label: 'ICP-B | Ramesh Kumar — Auto driver → Office Admin (4mo)' },
    { file: 'icp_b_4', label: 'ICP-B | Kavita Singh — Factory worker → Cashier (3mo)' },
    { file: 'icp_b_5', label: 'ICP-B | Deepak Sharma — Security guard → BPO Agent (5mo)' },
  ];

  const total = cases.length;
  console.log(`\nRoadmap Generator — running ${total} test cases\n${'─'.repeat(60)}\n`);

  let passed = 0;
  for (let i = 0; i < cases.length; i++) {
    const { file, label } = cases[i];
    const inputPath  = path.join(__dirname, 'test_cases', `${file}.json`);
    const outputPath = path.join(__dirname, 'outputs',    `${file}_output.json`);

    if (!fs.existsSync(inputPath)) {
      console.log(`[${i + 1}/${total}] ${label} — SKIP (input file not found: ${inputPath})`);
      continue;
    }

    const ok = await runTest(inputPath, outputPath, label, i + 1, total);
    if (ok) passed++;
    console.log();

    // Free tier: 15 requests/min — wait 5s between calls to stay safe
    if (i < cases.length - 1) {
      process.stdout.write('   (waiting 5s for rate limit...)\n\n');
      await new Promise(r => setTimeout(r, 5000));
    }
  }

  console.log('─'.repeat(60));
  console.log(`Results: ${passed}/${total} passed`);

  if (passed < total) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
