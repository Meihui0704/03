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

test('shelf blocks an inverted window and skips an uncovered subject', () => {
  const { reviewShelf } = require('./demo.js');
  const bad = reviewShelf(Object.assign(baseInput(), {
    action: 'off',
    start: '2026-04-30T18:00',
    end: '2026-04-01T09:00',
    comboShelf: {}
  }));
  assert.ok(codes(bad.blocks).includes('bad-range'));
  assert.equal(bad.canConfirm, false);

  const mismatch = reviewShelf(Object.assign(baseInput(), {
    selectedProductIds: ['write-sys'],
    selectedSubjectIds: ['writing', 'speaking'],
    action: 'off',
    start: '2026-04-01T09:00',
    end: '2026-04-30T18:00',
    comboShelf: {}
  }));
  assert.equal(mismatch.changing.length, 1);
  assert.equal(mismatch.mismatched[0].name, '口语');
  assert.equal(mismatch.canConfirm, true);
});

test('coupon blocks a reduction that meets the threshold', () => {
  const { reviewCoupon } = require('./demo.js');
  const over = reviewCoupon(Object.assign(baseInput(), {
    kind: 'threshold',
    threshold: '100',
    amount: '100',
    start: '2026-04-01T00:00',
    end: '2026-04-30T00:00'
  }));
  assert.ok(codes(over.blocks).includes('amount-too-high'));
  assert.equal(over.canConfirm, false);
});

test('ads block a repeated sort and a non-https link', () => {
  const { reviewAd, reviewEntry } = require('./demo.js');
  const existing = [{ id: 'a1', placement: '开屏', lineId: 'general', sort: 1, status: 'on', start: '2026-03-01T00:00', end: '2026-04-30T23:59' }];
  const clash = reviewAd({
    id: '', name: '另一张', placement: '开屏', lineId: 'general', destType: 'page', dest: '课程列表',
    start: '2026-04-01T00:00', end: '2026-04-20T00:00', sort: '1', status: 'on'
  }, existing);
  assert.ok(codes(clash.blocks).includes('sort-clash'));

  const link = reviewAd({
    id: '', name: '临时', placement: '弹层', lineId: 'career', destType: 'link', dest: 'http://example.com/sale',
    start: '2026-06-01T00:00', end: '2026-06-20T00:00', sort: '1', status: 'on'
  }, []);
  assert.ok(codes(link.blocks).includes('bad-link'));

  const mini = reviewEntry({ id: '', name: '练习', env: 'mini', appId: 'wx-sample', path: '', status: 'on' }, []);
  assert.ok(codes(mini.blocks).includes('empty-mini'));
  const https = reviewEntry({ id: '', name: '开放日', env: 'web', target: 'https://example.com/open-day', status: 'on' }, []);
  assert.equal(https.canSave, true);
});

test('a higher flat price warns, a flat zero blocks', () => {
  const raised = analyze(baseInput({ adjustment: { mode: 'fixed', value: 300 } }));
  assert.ok(codes(raised.warnings).includes('price-increase'));
  assert.equal(raised.canConfirm, true);

  const flatZero = analyze(baseInput({ adjustment: { mode: 'fixed', value: 0 } }));
  assert.ok(codes(flatZero.blocks).includes('non-positive-price'));
  assert.equal(flatZero.canConfirm, false);
});
