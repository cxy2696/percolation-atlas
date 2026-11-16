#!/usr/bin/env python3
"""Fail on a small set of generated-prose tells.

This is a floor, not a style guide. The editorial guide in
`docs/EDITORIAL.md` is the full rule set; this script only catches phrases
that are easy to reintroduce and that no technical writer needs.

    python3 scripts/check_style.py
"""
from __future__ import annotations

import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
FILES = [
    *sorted((ROOT / "content" / "en").glob("*.md")),
    ROOT / "README.md",
    ROOT / "docs" / "ALGORITHMS.md",
    ROOT / "docs" / "API.md",
    ROOT / "docs" / "DATA.md",
    ROOT / "docs" / "DESIGN.md" if (ROOT / "docs" / "DESIGN.md").exists() else ROOT / "docs" / "design.md",
    ROOT / "docs" / "SCALING.md",
    ROOT / "docs" / "VERIFICATION.md",
]
BANNED = {
    "it is important to note": "state the point directly",
    "in today's world": "delete the frame and give the fact",
    "delve into": "use 'read', 'examine' or 'measure'",
    "rich tapestry": "name the actual structure",
    "a testament to": "say what it demonstrates",
    "mission control": "name the page",
    "the site is an instrument": "describe what the page contains",
    "not a feed": "describe what the page contains",
}
MAX = {"not just": 4, "not only": 4, "not merely": 2, "it is worth": 2}


def main() -> int:
    failures: list[str] = []
    text_by_path: list[tuple[pathlib.Path, str]] = []
    for path in FILES:
        if path.exists():
            text_by_path.append((path, path.read_text(encoding="utf-8")))

    for phrase, advice in BANNED.items():
        for path, text in text_by_path:
            for match in re.finditer(re.escape(phrase), text, re.I):
                line = text.count("\n", 0, match.start()) + 1
                failures.append(f"{path.relative_to(ROOT)}:{line}: '{phrase}' — {advice}")

    for phrase, limit in MAX.items():
        count = sum(len(re.findall(rf"\b{re.escape(phrase)}\b", text, re.I)) for _, text in text_by_path)
        if count > limit:
            failures.append(f"'{phrase}' appears {count} times; use a direct construction (limit {limit})")

    if failures:
        for failure in failures:
            print(f"FAIL {failure}")
        print(f"\n{len(failures)} style check(s) failed", file=sys.stderr)
        return 1
    print(f"ok   style: {len(text_by_path)} files, no banned generated-prose phrases")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
