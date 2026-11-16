import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { ALGORITHM_ORDER, ALGORITHM_GROUPS, ALGORITHM_GUIDE, guideFor } from '../../assets/js/lib/algorithm-guide.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const LANGS = ['en', 'zh', 'de'];

test('algorithm reader has thirteen unique entries in a complete group partition', () => {
  assert.equal(ALGORITHM_ORDER.length, 13);
  assert.equal(new Set(ALGORITHM_ORDER).size, 13);
  const grouped = ALGORITHM_GROUPS.flatMap((group) => group.ids).sort();
  assert.deepEqual(grouped, [...ALGORITHM_ORDER].sort());
});

test('every algorithm has three authored languages and the core fields', () => {
  for (const id of ALGORITHM_ORDER) {
    const entry = ALGORITHM_GUIDE[id];
    for (const lang of LANGS) {
      assert.ok(entry.tag[lang], `${id}: tag.${lang}`);
      assert.ok(entry.title[lang], `${id}: title.${lang}`);
      assert.ok(entry.summary[lang], `${id}: summary.${lang}`);
      assert.ok(entry.invariant[lang], `${id}: invariant.${lang}`);
      for (const field of ['purpose', 'steps', 'complexity', 'notes', 'pitfalls']) {
        assert.ok(Array.isArray(entry[field][lang]) && entry[field][lang].length, `${id}: ${field}.${lang}`);
      }
    }
    assert.equal(entry.implementations, entry.code.length);
  }
});

test('every listed source and test path exists, and JS tests live under tests/js', () => {
  for (const id of ALGORITHM_ORDER) {
    const entry = ALGORITHM_GUIDE[id];
    for (const item of entry.code) {
      assert.ok(fs.existsSync(path.join(ROOT, item.path)), `${id}: missing source ${item.path}`);
    }
    for (const item of entry.tests) {
      assert.ok(fs.existsSync(path.join(ROOT, item)), `${id}: missing test ${item}`);
      if (item.endsWith('.js')) assert.ok(item.startsWith('tests/js/'), `${id}: JS test outside tests/js`);
    }
    assert.ok(entry.code.some((item) => item.label === 'C++'), `${id}: C++ source`);
    assert.ok(entry.code.some((item) => item.label === 'Julia'), `${id}: Julia source`);
  }
});

test('guideFor picks the requested language and falls back to English', () => {
  const zh = guideFor('nz', 'zh');
  assert.equal(zh.title, ALGORITHM_GUIDE.nz.title.zh);
  const de = guideFor('nz', 'de');
  assert.match(de.invariant, /Kanten|Bondperkolation|M₂/);
  assert.equal(guideFor('missing', 'en'), null);
});
