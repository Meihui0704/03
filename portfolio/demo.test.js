const test = require('node:test');
const assert = require('node:assert/strict');
const { analyze, nextPrice, catalog, PRESETS } = require('./demo.js');

function fromPreset(key, products) {
  const preset = PRESETS[key];
  return {
    lines: catalog.lines,
    products: products || catalog.products,
    subjects: catalog.subjects,
    selectedProductIds: preset.productIds,
    selectedSubjectIds: preset.subjectIds,
    adjustment: preset.adjustment,
    effectiveAt: preset.effectiveAt
  };
}

function baseInput(overrides) {
  return Object.assign({
    lines: catalog.lines,
    products: catalog.products,
    subjects: catalog.subjects,
    selectedProductIds: ['write-sys'],
    selectedSubjectIds: ['writing'],
    adjustment: { mode: 'percent', value: 20 },
    effectiveAt: '2026-04-01T09:00'
  }, overrides);
}

function codes(list) {
  return list.map((item) => item.code);
}

test('nextPrice uses round fictional amounts', () => {
  assert.equal(nextPrice(200, { mode: 'percent', value: 20 }), 160);
  assert.equal(nextPrice(100, { mode: 'percent', value: 40 }), 60);
  assert.equal(nextPrice(100, { mode: 'percent', value: 100 }), 0);
  assert.equal(nextPrice(200, { mode: 'reduce', value: 100 }), 100);
  assert.equal(nextPrice(100, { mode: 'reduce', value: 100 }), 0);
  assert.equal(nextPrice(200, { mode: 'reduce', value: 250 }), -50);
  assert.equal(nextPrice(200, { mode: 'fixed', value: 300 }), 300);
  assert.equal(Number.isNaN(nextPrice(200, { mode: 'percent', value: '' })), true);
});

test('catalog is an obvious round-number fiction', () => {
  const names = catalog.products.map((item) => item.name);
  assert.deepEqual(catalog.lines.map((item) => item.name), ['通识课程', '语言学习', '职业技能']);
  assert.ok(names.includes('写作系统课'));
  assert.ok(names.includes('阅读打卡'));
  catalog.products.forEach((item) => {
    assert.equal(item.price % 10, 0);
    assert.ok(item.price > 0);
  });
});

test('clean preset counts only covered product-subject pairs', () => {
  const result = analyze(fromPreset('clean'));
  assert.equal(result.counts.products, 2);
  assert.equal(result.counts.subjects, 2);
  assert.equal(result.counts.valid, 3);
  assert.deepEqual(
    result.validCombos.map((item) => [item.productName, item.subjectName, item.nextPrice]),
    [
      ['写作系统课', '写作', 160],
      ['写作系统课', '阅读', 160],
      ['阅读打卡', '阅读', 80]
    ]
  );
  assert.deepEqual(result.warnings, []);
  assert.deepEqual(result.blocks, []);
  assert.equal(result.canConfirm, true);
});

test('mismatch preset warns and can be cleared without blocking', () => {
  const result = analyze(fromPreset('mismatch'));
  assert.equal(result.counts.valid, 2);
  assert.deepEqual(result.mismatchedSubjects.map((item) => item.name), ['口语']);
  assert.ok(codes(result.warnings).includes('mismatch'));
  assert.equal(result.canConfirm, true);
  const kept = result.mismatchedSubjects.reduce((ids, item) => {
    return ids.filter((id) => id !== item.id);
  }, PRESETS.mismatch.subjectIds.slice());
  const cleared = analyze(baseInput({
    selectedProductIds: PRESETS.mismatch.productIds,
    selectedSubjectIds: kept
  }));
  assert.equal(cleared.mismatchedSubjects.length, 0);
  assert.equal(cleared.counts.valid, 2);
  assert.equal(codes(cleared.warnings).includes('mismatch'), false);
});

test('zero-price preset blocks confirmation', () => {
  const result = analyze(fromPreset('zero'));
  assert.equal(result.validCombos[0].nextPrice, 0);
  assert.ok(codes(result.blocks).includes('non-positive-price'));
  assert.equal(result.canConfirm, false);
});

test('cross-line selection and a 40% drop are warnings', () => {
  const crossed = analyze(baseInput({
    selectedProductIds: ['write-sys', 'speak-pack'],
    selectedSubjectIds: ['writing', 'speaking'],
    adjustment: { mode: 'percent', value: 10 }
  }));
  assert.equal(crossed.counts.valid, 2);
  assert.ok(codes(crossed.warnings).includes('cross-line'));
  assert.equal(codes(crossed.warnings).includes('mismatch'), false);
  assert.equal(crossed.canConfirm, true);

  const steep = analyze(baseInput({ adjustment: { mode: 'percent', value: 40 } }));
  assert.equal(steep.validCombos[0].nextPrice, 120);
  assert.ok(codes(steep.warnings).includes('steep-drop'));
  assert.equal(steep.canConfirm, true);

  const under = analyze(baseInput({ adjustment: { mode: 'percent', value: 39 } }));
  assert.equal(codes(under.warnings).includes('steep-drop'), false);
});

test('empty fields, percent at least 100, and no overlap block', () => {
  const empty = analyze(baseInput({
    selectedProductIds: [],
    selectedSubjectIds: [],
    adjustment: { mode: 'percent', value: '  ' },
    effectiveAt: ''
  }));
  assert.deepEqual(codes(empty.blocks).sort(), ['empty-effective', 'empty-products', 'empty-subjects', 'empty-value']);
  assert.equal(empty.canConfirm, false);

  const fullCut = analyze(baseInput({ adjustment: { mode: 'percent', value: 100 } }));
  assert.ok(codes(fullCut.blocks).includes('percent-too-high'));
  assert.ok(codes(fullCut.blocks).includes('non-positive-price'));
  assert.equal(fullCut.canConfirm, false);

  const none = analyze(baseInput({
    selectedProductIds: ['write-sys'],
    selectedSubjectIds: ['speaking']
  }));
  assert.equal(none.counts.valid, 0);
  assert.ok(codes(none.blocks).includes('no-valid-combos'));
  assert.ok(codes(none.warnings).includes('mismatch'));
  assert.equal(none.canConfirm, false);
});

test('a higher flat price warns, a flat zero blocks', () => {
  const raised = analyze(baseInput({ adjustment: { mode: 'fixed', value: 300 } }));
  assert.ok(codes(raised.warnings).includes('price-increase'));
  assert.equal(raised.canConfirm, true);

  const flatZero = analyze(baseInput({ adjustment: { mode: 'fixed', value: 0 } }));
  assert.ok(codes(flatZero.blocks).includes('non-positive-price'));
  assert.equal(flatZero.canConfirm, false);
});
