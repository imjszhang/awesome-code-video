import awesomeLint from 'awesome-lint/index.js';

const files = await awesomeLint({ filename: 'README.md' });
let failures = 0;
let incubationFindings = 0;

for (const file of files) {
  for (const message of file.messages) {
    // Incubation is an upstream index admission condition, not a content defect.
    // Do not waive the same rule's invalid-Git-history error.
    const incubation = message.ruleId === 'awesome-git-repo-age'
      && /^Repository is \d+ days old, but must be at least 30 days old/.test(message.reason);
    const location = `${file.basename}:${message.line ?? 1}:${message.column ?? 1}`;
    if (incubation) {
      incubationFindings += 1;
      console.warn(`NOTICE ${location} [${message.ruleId}] ${message.reason}`);
    } else {
      failures += 1;
      console.error(`ERROR ${location} [${message.ruleId}] ${message.reason}`);
    }
  }
}

if (failures > 0) {
  console.error(`${failures} lint finding(s) must be fixed.`);
  process.exitCode = 1;
} else {
  console.log(`Awesome content checks passed${incubationFindings ? '; repository is still in its 30-day incubation period' : ''}.`);
}
