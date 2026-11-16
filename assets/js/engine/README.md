# Browser runtime

This directory is the JavaScript runtime used by the interactive laboratories.
It exists because the site is a static, serverless page: the controls need a
fast local model to redraw a configuration while a slider moves.

It is **not** a reference algorithm edition and it is not listed in the code
browser's reference tabs. The reference implementations live in:

- `lib/cpp/`
- `lib/python/`
- `lib/julia/`
- `lib/java/`
- `lib/r/`

The browser runtime follows the same RNG, edge order and crossing definitions
so the displayed numbers can be checked against the reference editions. The
parity harness still runs it as a UI cross-check; that check does not turn it
into a sixth reference language.

If the browser runtime and a reference edition disagree, the reference edition
and its golden file win. Fix the runtime rather than editing the golden value.
