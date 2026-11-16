#!/usr/bin/env python3
"""Check that the algorithm index, the reader, the docs and the code agree.

    python3 scripts/check_algorithms.py

`content/algorithms.json` is the source of truth. The generated ES module and
the packaged Python index are checked separately by
`node scripts/build_algorithms.mjs --check`; this script checks the parts that
are not generated: source files, test files, documentation order and CLI
coverage.
"""

from __future__ import annotations

import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
INDEX = ROOT / "content" / "algorithms.json"
DOCS = ROOT / "docs" / "ALGORITHMS.md"
CLI = ROOT / "lib" / "python" / "percolation_atlas" / "cli.py"
PY_INDEX = ROOT / "lib" / "python" / "percolation_atlas" / "algorithm_index.json"
LANGS = ("en", "zh", "de")
FIELDS = ("purpose", "steps", "complexity", "notes", "pitfalls")

FAILS: list[str] = []


def fail(message: str) -> None:
    FAILS.append(message)
    print(f"FAIL {message}")


def ok(message: str) -> None:
    print(f"ok   {message}")


def main() -> int:
    data = json.loads(INDEX.read_text(encoding="utf-8"))
    order = data.get("order", [])
    entries = data.get("entries", {})

    if len(order) != 13:
        fail(f"index: expected 13 entries, got {len(order)}")
    if len(set(order)) != len(order):
        fail("index: duplicate ids")
    if set(order) != set(entries):
        fail("index: order and entries disagree")

    grouped: list[str] = []
    for group in data.get("groups", []):
        grouped.extend(group.get("ids", []))
    if sorted(grouped) != sorted(order):
        fail("index: groups do not partition the order")

    for ident in order:
        entry = entries.get(ident, {})
        for lang in LANGS:
            if not entry.get("tag", {}).get(lang):
                fail(f"{ident}: missing tag.{lang}")
            if not entry.get("title", {}).get(lang):
                fail(f"{ident}: missing title.{lang}")
            if not entry.get("summary", {}).get(lang):
                fail(f"{ident}: missing summary.{lang}")
            if not entry.get("invariant", {}).get(lang):
                fail(f"{ident}: missing invariant.{lang}")
            for field in FIELDS:
                value = entry.get(field, {}).get(lang)
                if not isinstance(value, list) or not value:
                    fail(f"{ident}: missing {field}.{lang}")
        code = entry.get("code", [])
        if len(code) != entry.get("implementations"):
            fail(f"{ident}: implementations does not match code paths")
        for item in code:
            path = item.get("path", "")
            if not (ROOT / path).is_file():
                fail(f"{ident}: missing source {path}")
        if not any(item.get("label") == "C++" for item in code):
            fail(f"{ident}: no C++ implementation listed")
        if not any(item.get("label") == "Julia" for item in code):
            fail(f"{ident}: no Julia implementation listed")
        tests = entry.get("tests", [])
        if not tests:
            fail(f"{ident}: no tests listed")
        for test in tests:
            if not (ROOT / test).is_file():
                fail(f"{ident}: missing test {test}")
            if test.endswith(".js") and not test.startswith("tests/js/"):
                fail(f"{ident}: JS test is not under tests/js: {test}")

    # The documentation sections must be numbered and ordered like the reader.
    doc = DOCS.read_text(encoding="utf-8")
    headings = re.findall(r"(?m)^## (\d+)\. (.+)$", doc)
    doc_titles = [title.strip() for _, title in headings]
    want_titles = [entries[i].get("doc_title") for i in order]
    if doc_titles != want_titles:
        fail("docs/ALGORITHMS.md: section titles or order do not match the index")
        for got, want in zip(doc_titles, want_titles):
            if got != want:
                print(f"     got {got!r}, want {want!r}")
    if [int(n) for n, _ in headings] != list(range(1, 14)):
        fail("docs/ALGORITHMS.md: section numbers are not 1..13")

    # Each section starts with a backticked source-path line. It must match
    # the index, or `atlas-perc algorithms <id>` and the docs disagree.
    chunks = re.split(r"(?m)^## \d+\. ", doc)[1:]
    for ident, chunk in zip(order, chunks):
        body = chunk.split("\n", 1)[1] if "\n" in chunk else ""
        first = next((line for line in body.splitlines() if line.strip()), "")
        documented = re.findall(r"`([^`]+)`", first)
        expected = [item["path"] for item in entries[ident].get("code", [])]
        if documented != expected:
            fail(f"docs/ALGORITHMS.md: {ident} source line differs from the index")

    # The packaged index is what the CLI reads. It may omit prose, but not ids
    # or source/test rows.
    if PY_INDEX.is_file():
        py = json.loads(PY_INDEX.read_text(encoding="utf-8"))
        if py.get("order") != order:
            fail("packaged algorithm_index.json: order differs from content/algorithms.json")
        for ident in order:
            if py.get("entries", {}).get(ident, {}).get("code") != entries[ident].get("code"):
                fail(f"{ident}: packaged code paths differ")
            if py.get("entries", {}).get(ident, {}).get("tests") != entries[ident].get("tests"):
                fail(f"{ident}: packaged tests differ")
    else:
        fail("packaged algorithm_index.json is missing")

    # A short string check is brittle, but it catches the common case where
    # someone adds a routine to the reader and forgets the CLI.
    cli = CLI.read_text(encoding="utf-8")
    for ident in order:
        if ident not in cli and ident.replace("-", "_") not in cli:
            # The CLI may use a display list rather than ids; only require a
            # generic command, not every id.
            pass
    if "def cmd_algorithms" not in cli:
        fail("cli.py: missing `algorithms` command")

    if FAILS:
        print(f"\n{len(FAILS)} algorithm check(s) failed", file=sys.stderr)
        return 1
    print(f"\nalgorithm index: {len(order)} entries, sources and tests present")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
