from __future__ import annotations

import ast
import pathlib
import re
import sys
import textwrap


ROOT = pathlib.Path(__file__).resolve().parents[1]
PYTHON_FENCE = re.compile(r"```(?:python|py)(?:[^\n]*)\n(.*?)```", re.DOTALL)


def main() -> int:
    failures: list[str] = []
    count = 0
    for path in sorted(ROOT.rglob("*.mdx")):
        source = path.read_text(encoding="utf-8")
        for index, match in enumerate(PYTHON_FENCE.finditer(source), start=1):
            count += 1
            try:
                compile(
                    textwrap.dedent(match.group(1)),
                    f"{path.relative_to(ROOT)}:python-block-{index}",
                    "exec",
                    flags=ast.PyCF_ALLOW_TOP_LEVEL_AWAIT,
                )
            except SyntaxError as error:
                failures.append(f"{path.relative_to(ROOT)} block {index}: {error.msg}")
    if failures:
        print("\n".join(f"- {failure}" for failure in failures), file=sys.stderr)
        return 1
    print(f"Compiled {count} Python examples.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
