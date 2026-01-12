<!--
applyTo: '**'
description: 'Generate a pull request message based on the provided template.'

Instructions for the author:
- Keep the PR description concise and conversational.
- Fill each section below; delete this comment when you're done.
- To gather the diff summary for this PR, run:
  git --no-pager log --oneline -p main..HEAD
- If this PR is large or complex, consider splitting it into smaller PRs.
-->

## What?

- One-line summary of the change:
  - e.g. "Add user export endpoint and CSV writer"
- Detailed description of what changed (be specific about the net effect — what
  will be different after merging):
  - - Modified files/modules:
  - - New behaviors or removed behaviors:
- Tickets / references (optional): #JIRA-123, #456 — but do not rely on them
  alone; describe the change here.

## Why?

- What problem does this solve or what goal does it achieve?
- Why was this approach chosen over alternatives?
- Business or engineering context (impact, customer-facing effects, performance,
  migrations, etc.).

## How?

- High-level summary of the implementation:
  - Key design decisions and trade-offs
  - Important algorithms, data-model changes, or architecture notes
- Libraries, frameworks, or patterns used and why
- Non-obvious implementation details a reviewer should pay attention to

## Testing?

- How this change was tested:
  - Unit tests added/updated: yes/no (list test names)
  - Integration / end-to-end tests: yes/no (describe)
  - Manual steps to verify locally (step-by-step):
    1. ...
    2. ...
  - CI status: (link to build or short summary)
- Edge cases not covered and why (if any)

## Anything Else?

- Backwards compatibility or migration notes
- Performance or security considerations
- Known limitations or technical debt introduced
- Suggested follow-ups or future improvements

## Checklist

- [ ] I added/updated tests (unit/integration)
- [ ] I updated documentation where necessary
- [ ] I ran the full test suite locally and it passes
- [ ] I verified this change in a staging environment (if applicable)
- [ ] This change requires a migration and I updated migration docs (if
      applicable)

---

Quick tips for a good PR description:

- Lead with the short summary (the reviewer should understand the change within
  seconds).
- Use concrete examples where useful.
- Prefer active voice and short, complete sentences.
- Remove any sections that don't apply before submitting.
