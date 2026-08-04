# Documentation conventions

This repository owns the public documentation site for Modal Computer Use.

## Canonical sources

- Treat `ashtonchew/modal-computer-use` as the source for code and API contracts.
- Treat its OpenAPI file as the source for daemon routes.
- Treat its benchmark reports and JSON artifacts as the source for benchmark claims.
- Link benchmark evidence at an exact commit SHA.
- Do not copy raw benchmark JSON into this repository.
- Do not create a second benchmark evidence policy.
- Do not add unpublished article source or article-only assets.

## Writing

- Use active voice and second person.
- Use short sentences.
- Put one instruction in each sentence.
- Use sentence case for headings.
- Use one term for each concept.
- Use `Modal Computer Use` for the product.
- Use `modal-computer-use` for the distribution.
- Use `modal_computer_use` for the Python package.
- Do not use em dashes or en dashes.
- Do not use promotional claims or filler.
- Put a runnable example before optional variants.

## Components

- Use cards only for destination choices.
- Use steps only for a real sequence.
- Use tabs only for alternatives.
- Use warnings only for security, billing, destructive actions, or lifecycle risks.
- Prefer built-in Mintlify presentation.
- Do not add custom CSS or JavaScript without a documented need.

## Verification

Run these commands before handoff:

```bash
npm ci
npm run check
python3 scripts/check_python_examples.py
```

Verify light and dark modes on desktop and mobile.
