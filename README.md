# Modal Computer Use documentation

This repository builds the public documentation for [Modal Computer Use](https://github.com/ashtonchew/modal-computer-use).

The application repository owns code, API contracts, OpenAPI, and benchmark evidence. This repository owns the public documentation structure and presentation.

## Local preview

Install the pinned dependencies.

```bash
npm ci
```

Start the local site.

```bash
npm run dev
```

Open `http://localhost:3000`.

## Checks

Run the complete local documentation gate.

```bash
npm run check
python3 scripts/check_python_examples.py
```

The workflow also runs Vale with the repository rules in `.github/styles`.

## Publishing

Mintlify deploys the `main` branch through its GitHub integration.

The live site is [modal-computer-use.mintlify.app](https://modal-computer-use.mintlify.app).
