/* 虚构目录上的批量调价。规则在确认前算清，结果只留在这个页面的内存里。 */
(function () {
  'use strict';

  var LINES = [
    { id: 'general', name: '通识课程' },
    { id: 'language', name: '语言学习' },
    { id: 'career', name: '职业技能' }
  ];

  var SUBJECTS = [
    { id: 'writing', name: '写作', lineId: 'general' },
    { id: 'reading', name: '阅读', lineId: 'general' },
    { id: 'speaking', name: '口语', lineId: 'language' },
    { id: 'listening', name: '听力', lineId: 'language' },
    { id: 'sheets', name: '表格', lineId: 'career' },
    { id: 'slides', name: '演示', lineId: 'career' }
  ];

  var PRODUCTS = [
    { id: 'write-sys', name: '写作系统课', lineId: 'general', price: 200, covers: ['writing', 'reading'] },
    { id: 'read-check', name: '阅读打卡', lineId: 'general', price: 100, covers: ['reading'] },
    { id: 'speak-pack', name: '口语陪练包', lineId: 'language', price: 160, covers: ['speaking', 'listening'] },
    { id: 'listen-week', name: '听力周课', lineId: 'language', price: 120, covers: ['listening'] },
    { id: 'sheet-fast', name: '表格速成', lineId: 'career', price: 80, covers: ['sheets'] },
    { id: 'slide-lab', name: '演示工作坊', lineId: 'career', price: 240, covers: ['slides', 'sheets'] }
  ];

  var PRESETS = {
    clean: {
      id: 'clean',
      label: '干净的下调',
      blurb: '写作系统课和阅读打卡，方向都在覆盖里，下调 20%。',
      productIds: ['write-sys', 'read-check'],
      subjectIds: ['writing', 'reading'],
      adjustment: { mode: 'percent', value: 20 },
      effectiveAt: '2026-04-01T09:00'
    },
    mismatch: {
      id: 'mismatch',
      label: '含不适用方向',
      blurb: '写作系统课不覆盖口语。口语只作提醒，可以去掉。',
      productIds: ['write-sys'],
      subjectIds: ['writing', 'reading', 'speaking'],
      adjustment: { mode: 'percent', value: 20 },
      effectiveAt: '2026-04-01T09:00'
    },
    zero: {
      id: 'zero',
      label: '售价会被打到 0',
      blurb: '阅读打卡按初始价 100 减免 100，售价变成 0，必须停下。',
      productIds: ['read-check'],
      subjectIds: ['reading'],
      adjustment: { mode: 'reduce', value: 100 },
      effectiveAt: '2026-04-01T09:00'
    }
  };

  var catalog = { lines: LINES, subjects: SUBJECTS, products: PRODUCTS };

  function nextPrice(basePrice, adjustment) {
    var base = Number(basePrice);
    var raw = adjustment ? adjustment.value : undefined;
    if (raw === null || raw === undefined || String(raw).trim() === '') return NaN;
    var value = Number(raw);
    if (!Number.isFinite(base) || !Number.isFinite(value)) return NaN;
    if (adjustment.mode === 'percent') return Math.round(base * (1 - value / 100));
    if (adjustment.mode === 'reduce') return Math.round(base - value);
    if (adjustment.mode === 'fixed') return Math.round(value);
    return NaN;
  }

  function isBlank(value) {
    return value === null || value === undefined || String(value).trim() === '';
  }

  function lineName(lines, id) {
    var found = (lines || []).filter(function (line) { return line.id === id; })[0];
    return found ? found.name : id;
  }

  function analyze(input) {
    var data = input || {};
    var products = data.products || [];
    var subjects = data.subjects || [];
    var lines = data.lines || [];
    var selectedProductIds = data.selectedProductIds || [];
    var selectedSubjectIds = data.selectedSubjectIds || [];
    var adjustment = data.adjustment || { mode: 'percent', value: '' };
    var productSet = {};
    var subjectSet = {};
    selectedProductIds.forEach(function (id) { productSet[id] = true; });
    selectedSubjectIds.forEach(function (id) { subjectSet[id] = true; });

    var selectedProducts = products.filter(function (item) { return productSet[item.id]; });
    var selectedSubjects = subjects.filter(function (item) { return subjectSet[item.id]; });
    var warnings = [];
    var blocks = [];
    var valueBlank = isBlank(adjustment.value);
    var value = valueBlank ? NaN : Number(adjustment.value);

    if (selectedProducts.length === 0) {
      blocks.push({ code: 'empty-products', message: '还没有选择商品。' });
    }
    if (selectedSubjects.length === 0) {
      blocks.push({ code: 'empty-subjects', message: '还没有选择方向。' });
    }
    if (valueBlank || !Number.isFinite(value) || !adjustment.mode) {
      blocks.push({ code: 'empty-value', message: '调整数字还是空的。' });
    }
    if (isBlank(data.effectiveAt)) {
      blocks.push({ code: 'empty-effective', message: '生效时间还是空的。' });
    }
    if (adjustment.mode === 'percent' && Number.isFinite(value) && value >= 100) {
      blocks.push({ code: 'percent-too-high', message: '按比例下调不能大于或等于 100%。' });
    }

    var validCombos = [];
    var mismatchedSubjects = [];

    if (selectedProducts.length > 0 && selectedSubjects.length > 0) {
      selectedSubjects.forEach(function (subject) {
        var covers = selectedProducts.filter(function (product) {
          return product.covers.indexOf(subject.id) !== -1;
        });
        if (covers.length === 0) {
          mismatchedSubjects.push({ id: subject.id, name: subject.name });
          return;
        }
        covers.forEach(function (product) {
          var price = Number.isFinite(value) ? nextPrice(product.price, { mode: adjustment.mode, value: value }) : NaN;
          var dropRatio = product.price > 0 && Number.isFinite(price) ? (product.price - price) / product.price : null;
          validCombos.push({
            productId: product.id,
            productName: product.name,
            subjectId: subject.id,
            subjectName: subject.name,
            lineId: product.lineId,
            basePrice: product.price,
            nextPrice: price,
            dropRatio: dropRatio
          });
        });
      });
    }

    if (mismatchedSubjects.length > 0) {
      warnings.push({
        code: 'mismatch',
        message: '有 ' + mismatchedSubjects.length + ' 个方向不在已选商品的覆盖范围里，不会被改：' +
          mismatchedSubjects.map(function (item) { return item.name; }).join('、') + '。可以一键去掉。'
      });
    }

    var lineIds = [];
    selectedProducts.forEach(function (product) {
      if (lineIds.indexOf(product.lineId) === -1) lineIds.push(product.lineId);
    });
    if (lineIds.length > 1) {
      warnings.push({
        code: 'cross-line',
        message: '这次同时选了' + lineIds.map(function (id) { return '「' + lineName(lines, id) + '」'; }).join('和') +
          '。可以继续，请确认不是把不同目录放进同一次调价。'
      });
    }

    var steepCount = validCombos.filter(function (combo) {
      return combo.dropRatio !== null && combo.dropRatio >= 0.4 && combo.nextPrice > 0;
    }).length;
    if (steepCount > 0) {
      warnings.push({
        code: 'steep-drop',
        message: '有 ' + steepCount + ' 个组合的降幅达到或超过 40%。可以继续，建议再看一眼。'
      });
    }

    var raisedCount = validCombos.filter(function (combo) {
      return Number.isFinite(combo.nextPrice) && combo.nextPrice > combo.basePrice;
    }).length;
    if (raisedCount > 0) {
      warnings.push({
        code: 'price-increase',
        message: '统一售价高于其中 ' + raisedCount + ' 个组合的现价，这次其实是涨价。可以继续。'
      });
    }

    if (selectedProducts.length > 0 && selectedSubjects.length > 0 && validCombos.length === 0) {
      blocks.push({
        code: 'no-valid-combos',
        message: '已选方向都不在已选商品的覆盖范围内，这次不会改到任何组合。'
      });
    }

    var nonPositiveCount = validCombos.filter(function (combo) {
      return Number.isFinite(combo.nextPrice) && combo.nextPrice <= 0;
    }).length;
    if (nonPositiveCount > 0) {
      blocks.push({
        code: 'non-positive-price',
        message: '有 ' + nonPositiveCount + ' 个组合调整后的售价小于或等于 0，不能提交。'
      });
    }

    return {
      validCombos: validCombos,
      mismatchedSubjects: mismatchedSubjects,
      warnings: warnings,
      blocks: blocks,
      counts: {
        products: selectedProducts.length,
        subjects: selectedSubjects.length,
        valid: validCombos.length,
        mismatched: mismatchedSubjects.length
      },
      canConfirm: blocks.length === 0
    };
  }

  function money(amount) {
    if (!Number.isFinite(amount)) return '—';
    return '¥' + amount;
  }

  function esc(value) {
    return String(value).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }

  function formatWhen(value) {
    if (isBlank(value)) return '未填';
    return String(value).replace('T', ' ').slice(0, 16);
  }

  function describeAdjustment(adjustment) {
    var value = Number(adjustment.value);
    if (adjustment.mode === 'percent') return '统一下调 ' + value + '%';
    if (adjustment.mode === 'reduce') return '每件减免 ' + money(value);
    if (adjustment.mode === 'fixed') return '统一定为 ' + money(value);
    return '调整价格';
  }

  function coversLabel(product) {
    return product.covers.map(function (id) {
      var found = SUBJECTS.filter(function (subject) { return subject.id === id; })[0];
      return found ? found.name : id;
    }).join('、');
  }
  function coveredPairs(products, subjects, selectedProductIds, selectedSubjectIds) {
    var productSet = {};
    var subjectSet = {};
    (selectedProductIds || []).forEach(function (id) { productSet[id] = true; });
    (selectedSubjectIds || []).forEach(function (id) { subjectSet[id] = true; });
    var selectedProducts = (products || []).filter(function (item) { return productSet[item.id]; });
    var selectedSubjects = (subjects || []).filter(function (item) { return subjectSet[item.id]; });
    var valid = [];
    var mismatched = [];
    selectedSubjects.forEach(function (subject) {
      var covers = selectedProducts.filter(function (product) {
        return product.covers.indexOf(subject.id) !== -1;
      });
      if (!covers.length) {
        mismatched.push({ id: subject.id, name: subject.name });
        return;
      }
      covers.forEach(function (product) {
        valid.push({ product: product, subject: subject });
      });
    });
    return { selectedProducts: selectedProducts, selectedSubjects: selectedSubjects, valid: valid, mismatched: mismatched };
  }

  function crossLineWarning(lines, products) {
    var ids = [];
    products.forEach(function (product) {
      if (ids.indexOf(product.lineId) === -1) ids.push(product.lineId);
    });
    if (ids.length < 2) return null;
    return {
      code: 'cross-line',
      message: '这次同时选了' + ids.map(function (id) { return '「' + lineName(lines, id) + '」'; }).join('和') + '。可以继续。'
    };
  }

  function mismatchWarning(mismatched) {
    if (!mismatched.length) return null;
    return {
      code: 'mismatch',
      message: '有 ' + mismatched.length + ' 个方向不在覆盖范围内，不会生效：' +
        mismatched.map(function (item) { return item.name; }).join('、') + '。可以去掉。'
    };
  }

  function timeOrderBlock(start, end) {
    if (isBlank(start) || isBlank(end)) return { code: 'empty-time', message: '生效时间和截止时间都要填写。' };
    if (String(end) <= String(start)) return { code: 'bad-range', message: '截止时间必须晚于生效时间。' };
    return null;
  }

  function rangesOverlap(aStart, aEnd, bStart, bEnd) {
    if (isBlank(aStart) || isBlank(aEnd) || isBlank(bStart) || isBlank(bEnd)) return false;
    return String(aStart) < String(bEnd) && String(bStart) < String(aEnd);
  }

  function couponLabel(data) {
    if (!data) return '优惠';
    if (data.kind === 'percent') return '优惠 ' + Number(data.percent) + '%';
    return '满 ' + money(Number(data.threshold)) + ' 减 ' + money(Number(data.amount));
  }

  function reviewShelf(input) {
    var data = input || {};
    var pairs = coveredPairs(data.products, data.subjects, data.selectedProductIds, data.selectedSubjectIds);
    var warnings = [];
    var blocks = [];
    if (!pairs.selectedProducts.length) blocks.push({ code: 'empty-products', message: '还没有选择商品。' });
    if (!pairs.selectedSubjects.length) blocks.push({ code: 'empty-subjects', message: '还没有选择方向。' });
    var time = timeOrderBlock(data.start, data.end);
    if (time) blocks.push(time);
    var mismatch = mismatchWarning(pairs.mismatched);
    if (mismatch) warnings.push(mismatch);
    var cross = crossLineWarning(data.lines || [], pairs.selectedProducts);
    if (cross) warnings.push(cross);
    var shelf = data.comboShelf || {};
    var action = data.action === 'on' ? 'on' : 'off';
    var changing = [];
    var unchanged = [];
    pairs.valid.forEach(function (pair) {
      var key = pair.product.id + '|' + pair.subject.id;
      var current = shelf[key] || 'on';
      var row = { key: key, productName: pair.product.name, subjectName: pair.subject.name, from: current, to: action };
      if (current === action) unchanged.push(row);
      else changing.push(row);
    });
    if (pairs.selectedProducts.length && pairs.selectedSubjects.length && !pairs.valid.length) {
      blocks.push({ code: 'no-valid-combos', message: '已选方向都不在已选商品的覆盖范围内。' });
    }
    if (pairs.valid.length && !changing.length) {
      blocks.push({ code: 'no-change', message: '这些组合已经是目标状态，没有需要变更的内容。' });
    }
    if (unchanged.length && changing.length) {
      warnings.push({ code: 'already', message: '有 ' + unchanged.length + ' 个组合已经是目标状态，会跳过。' });
    }
    return {
      warnings: warnings,
      blocks: blocks,
      changing: changing,
      mismatched: pairs.mismatched,
      counts: { products: pairs.selectedProducts.length, subjects: pairs.selectedSubjects.length, valid: changing.length },
      canConfirm: blocks.length === 0
    };
  }

  function reviewCoupon(input) {
    var data = input || {};
    var pairs = coveredPairs(data.products, data.subjects, data.selectedProductIds, data.selectedSubjectIds);
    var warnings = [];
    var blocks = [];
    if (data.kind === 'percent') {
      var percent = Number(data.percent);
      if (isBlank(data.percent) || !Number.isFinite(percent) || percent <= 0) {
        blocks.push({ code: 'empty-rule', message: '优惠比例要填写大于 0 的数字。' });
      } else if (percent >= 100) {
        blocks.push({ code: 'percent-too-high', message: '优惠比例必须小于 100%。' });
      }
    } else {
      var threshold = Number(data.threshold);
      var amount = Number(data.amount);
      if (isBlank(data.threshold) || isBlank(data.amount) || !Number.isFinite(threshold) || !Number.isFinite(amount) || threshold <= 0 || amount <= 0) {
        blocks.push({ code: 'empty-rule', message: '门槛和减免都要填写大于 0 的数字。' });
      } else if (amount >= threshold) {
        blocks.push({ code: 'amount-too-high', message: '减免金额必须小于使用门槛。' });
      }
    }
    if (!pairs.selectedProducts.length) blocks.push({ code: 'empty-products', message: '还没有选择商品。' });
    if (!pairs.selectedSubjects.length) blocks.push({ code: 'empty-subjects', message: '还没有选择方向。' });
    var time = timeOrderBlock(data.start, data.end);
    if (time) blocks.push(time);
    var mismatch = mismatchWarning(pairs.mismatched);
    if (mismatch) warnings.push(mismatch);
    var cross = crossLineWarning(data.lines || [], pairs.selectedProducts);
    if (cross) warnings.push(cross);
    if (pairs.selectedProducts.length && pairs.selectedSubjects.length && !pairs.valid.length) {
      blocks.push({ code: 'no-valid-combos', message: '已选方向都不在已选商品的覆盖范围内，这张优惠不会作用到任何组合。' });
    }
    return {
      warnings: warnings,
      blocks: blocks,
      valid: pairs.valid,
      mismatched: pairs.mismatched,
      counts: { products: pairs.selectedProducts.length, subjects: pairs.selectedSubjects.length, valid: pairs.valid.length },
      canConfirm: blocks.length === 0,
      label: couponLabel(data)
    };
  }

  function reviewAd(draft, ads) {
    var item = draft || {};
    var warnings = [];
    var blocks = [];
    if (isBlank(item.name)) blocks.push({ code: 'empty-name', message: '要填写素材名称。' });
    if (isBlank(item.placement)) blocks.push({ code: 'empty-placement', message: '要选择投放位置。' });
    if (isBlank(item.lineId)) blocks.push({ code: 'empty-line', message: '要选择内容线。' });
    var time = timeOrderBlock(item.start, item.end);
    if (time) blocks.push(time);
    if (isBlank(item.sort) || !Number.isFinite(Number(item.sort))) blocks.push({ code: 'empty-sort', message: '排序要填写数字。' });
    if (item.destType === 'link') {
      if (!/^https:\/\/\S+$/.test(String(item.dest || ''))) {
        blocks.push({ code: 'bad-link', message: '外链必须是以 https:// 开头的完整地址。' });
      }
    } else if (item.destType !== 'none' && isBlank(item.dest)) {
      blocks.push({ code: 'empty-dest', message: '要选择点击后的去向。' });
    }
    if (item.status !== 'off') {
      var clash = (ads || []).some(function (other) {
        if (other.id === item.id || other.status === 'off') return false;
        if (other.placement !== item.placement || other.lineId !== item.lineId) return false;
        if (Number(other.sort) !== Number(item.sort)) return false;
        return rangesOverlap(item.start, item.end, other.start, other.end);
      });
      if (clash) blocks.push({ code: 'sort-clash', message: '同一位置、同一内容线、重叠的有效期内，排序不能重复。' });
    }
    var existing = (ads || []).filter(function (other) { return other.id === item.id; })[0];
    if (existing && existing.status !== 'off') {
      warnings.push({ code: 'live-edit', message: '这条素材正在使用。可以保存，请确认前台可以马上换成新内容。' });
    }
    return { warnings: warnings, blocks: blocks, canSave: blocks.length === 0 };
  }

  function reviewEntry(draft, entries) {
    var item = draft || {};
    var warnings = [];
    var blocks = [];
    if (isBlank(item.name)) blocks.push({ code: 'empty-name', message: '要填写入口名称。' });
    if (item.env === 'web') {
      if (!/^https:\/\/\S+$/.test(String(item.target || ''))) {
        blocks.push({ code: 'bad-link', message: '外链必须是以 https:// 开头的完整地址。' });
      }
    } else if (item.env === 'mini') {
      if (isBlank(item.appId) || isBlank(item.path)) blocks.push({ code: 'empty-mini', message: '小程序要同时填写标识和页面路径。' });
    } else if (isBlank(item.target)) {
      blocks.push({ code: 'empty-target', message: '要选择站内去向。' });
    }
    if (item.status !== 'off') {
      var shared = (entries || []).some(function (other) {
        if (other.id === item.id || other.status === 'off' || other.env !== item.env) return false;
        if (item.env === 'mini') return other.appId === item.appId && other.path === item.path && !isBlank(item.path);
        return !isBlank(item.target) && other.target === item.target;
      });
      if (shared) warnings.push({ code: 'shared-target', message: '已有使用中的入口指向同一去向。可以继续。' });
    }
    return { warnings: warnings, blocks: blocks, canSave: blocks.length === 0 };
  }

  var DIRECTORY = [
    { name: '通识课程', status: 'on', subjects: [
      { name: '写作', status: 'on' },
      { name: '阅读', status: 'on' },
      { name: '书法入门', status: 'off' }
    ]},
    { name: '语言学习', status: 'on', subjects: [
      { name: '口语', status: 'on' },
      { name: '听力', status: 'on' }
    ]},
    { name: '职业技能', status: 'on', subjects: [
      { name: '表格', status: 'on' },
      { name: '演示', status: 'on' }
    ]},
    { name: '归档专题', status: 'off', subjects: [
      { name: '旧版通识', status: 'off' }
    ]}
  ];

  var PAGES = [
    { id: 'lines', group: '基础资料', label: '内容线与方向' },
    { id: 'catalog', group: '商品与营销', label: '商品清单' },
    { id: 'price', group: '商品与营销', label: '批量调价' },
    { id: 'shelf', group: '商品与营销', label: '上下架' },
    { id: 'coupon', group: '商品与营销', label: '优惠' },
    { id: 'ads', group: '运营位', label: '广告素材' },
    { id: 'entries', group: '运营位', label: '首页图标' },
    { id: 'redaction', group: '这份预览', label: '脱敏对照' }
  ];

  var SHELF_PRESETS = {
    clean: { id: 'clean', label: '下架一个方向', blurb: '阅读打卡只覆盖阅读。下架这一组。', productIds: ['read-check'], subjectIds: ['reading'], action: 'off', start: '2026-04-01T09:00', end: '2026-04-30T18:00' },
    mismatch: { id: 'mismatch', label: '方向不适用', blurb: '写作系统课不覆盖口语。口语只提醒。', productIds: ['write-sys'], subjectIds: ['writing', 'speaking'], action: 'off', start: '2026-04-01T09:00', end: '2026-04-30T18:00' },
    bad: { id: 'bad', label: '时间倒挂', blurb: '截止早于生效，不能提交。', productIds: ['read-check'], subjectIds: ['reading'], action: 'off', start: '2026-04-30T18:00', end: '2026-04-01T09:00' }
  };

  var COUPON_PRESETS = {
    clean: { id: 'clean', label: '满 200 减 30', blurb: '写作系统课的写作和阅读都能用。', kind: 'threshold', threshold: '200', amount: '30', percent: '15', productIds: ['write-sys'], subjectIds: ['writing', 'reading'], start: '2026-04-01T00:00', end: '2026-04-30T23:59' },
    over: { id: 'over', label: '减免超过门槛', blurb: '满 100 减 100，必须停下。', kind: 'threshold', threshold: '100', amount: '100', percent: '15', productIds: ['read-check'], subjectIds: ['reading'], start: '2026-04-01T00:00', end: '2026-04-30T23:59' },
    mismatch: { id: 'mismatch', label: '含不适用方向', blurb: '口语陪练包不覆盖写作。', kind: 'percent', threshold: '200', amount: '30', percent: '15', productIds: ['speak-pack'], subjectIds: ['speaking', 'writing'], start: '2026-04-01T00:00', end: '2026-05-01T00:00' }
  };

  var PAGE_OPTIONS = ['课程列表', '课程详情', '活动页'];
  var PLACEMENTS = ['开屏', '横幅', '弹层'];

  function blankAd() {
    return { id: '', name: '', placement: '开屏', lineId: 'general', destType: 'page', dest: '课程列表', start: '', end: '', sort: '1', status: 'on' };
  }

  function blankEntry() {
    return { id: '', name: '', lineId: 'general', env: 'app', target: '课程列表', appId: '', path: '', status: 'on' };
  }

  function seedAds() {
    return [
      { id: 'a1', name: '写作营开场', placement: '开屏', lineId: 'general', destType: 'page', dest: '课程列表', start: '2026-03-01T00:00', end: '2026-04-30T23:59', sort: 1, status: 'on' },
      { id: 'a2', name: '口语周课', placement: '横幅', lineId: 'language', destType: 'product', dest: '口语陪练包', start: '2026-03-10T00:00', end: '2026-05-01T23:59', sort: 1, status: 'on' },
      { id: 'a3', name: '春季归档海报', placement: '弹层', lineId: 'general', destType: 'none', dest: '', start: '2026-01-01T00:00', end: '2026-02-01T00:00', sort: 1, status: 'off' }
    ];
  }

  function seedEntries() {
    return [
      { id: 'e1', name: '春季写作营', lineId: 'general', env: 'app', target: '课程列表', appId: '', path: '', status: 'on' },
      { id: 'e2', name: '口语开放日', lineId: 'language', env: 'web', target: 'https://example.com/open-day', appId: '', path: '', status: 'on' },
      { id: 'e3', name: '表格练习', lineId: 'career', env: 'mini', target: '', appId: 'wx-sample', path: 'pages/sheet/index', status: 'off' }
    ];
  }

  function mount(root) {
    var state = {
      page: 'lines',
      shelf: 'on',
      step: 0,
      preset: null,
      carryIds: new Set(),
      selectedProductIds: new Set(),
      selectedSubjectIds: new Set(),
      mode: 'percent',
      value: '',
      effectiveAt: '',
      prices: {},
      comboShelf: {},
      log: [],
      status: '先看内容线，再去做批量动作。',
      shelfStep: 0,
      shelfPreset: null,
      shelfProductIds: new Set(),
      shelfSubjectIds: new Set(),
      shelfAction: 'off',
      shelfStart: '',
      shelfEnd: '',
      shelfStatus: '选择下架或上架，再圈定会改到的组合。',
      couponStep: 0,
      couponPreset: null,
      couponProductIds: new Set(),
      couponSubjectIds: new Set(),
      couponKind: 'threshold',
      couponThreshold: '',
      couponAmount: '',
      couponPercent: '',
      couponStart: '',
      couponEnd: '',
      couponStatus: '先写规则，再圈定商品和方向。',
      ads: seedAds(),
      adFilter: 'on',
      adDraft: blankAd(),
      adStatus: '选择一条素材，或从示例填一份新的。',
      entries: seedEntries(),
      entryFilter: 'on',
      entryDraft: blankEntry(),
      entryStatus: '选择一个入口，或从示例看校验。'
    };
    PRODUCTS.forEach(function (product) {
      state.prices[product.id] = product.price;
      product.covers.forEach(function (subjectId) { state.comboShelf[product.id + '|' + subjectId] = 'on'; });
    });

    root.innerHTML = appHtml();
    var main = root.querySelector('main');
    var dialog = root.querySelector('#confirm-dialog');

    function productsNow() {
      return PRODUCTS.map(function (product) {
        return { id: product.id, name: product.name, lineId: product.lineId, price: state.prices[product.id], covers: product.covers.slice() };
      });
    }

    function priceInput() {
      return {
        lines: LINES, products: productsNow(), subjects: SUBJECTS,
        selectedProductIds: Array.from(state.selectedProductIds),
        selectedSubjectIds: Array.from(state.selectedSubjectIds),
        adjustment: { mode: state.mode, value: state.value },
        effectiveAt: state.effectiveAt
      };
    }

    function shelfInput() {
      return {
        lines: LINES, products: productsNow(), subjects: SUBJECTS,
        selectedProductIds: Array.from(state.shelfProductIds),
        selectedSubjectIds: Array.from(state.shelfSubjectIds),
        action: state.shelfAction, start: state.shelfStart, end: state.shelfEnd,
        comboShelf: state.comboShelf
      };
    }

    function couponInput() {
      return {
        lines: LINES, products: productsNow(), subjects: SUBJECTS,
        selectedProductIds: Array.from(state.couponProductIds),
        selectedSubjectIds: Array.from(state.couponSubjectIds),
        kind: state.couponKind, threshold: state.couponThreshold, amount: state.couponAmount, percent: state.couponPercent,
        start: state.couponStart, end: state.couponEnd
      };
    }

    function render() {
      root.querySelectorAll('.nav [data-page]').forEach(function (button) {
        if (button.getAttribute('data-page') === state.page) button.setAttribute('aria-current', 'page');
        else button.removeAttribute('aria-current');
      });
      if (state.page === 'lines') main.innerHTML = linesHtml();
      else if (state.page === 'catalog') main.innerHTML = catalogHtml();
      else if (state.page === 'price') main.innerHTML = priceHtml();
      else if (state.page === 'shelf') main.innerHTML = shelfHtml();
      else if (state.page === 'coupon') main.innerHTML = couponHtml();
      else if (state.page === 'ads') main.innerHTML = adsHtml();
      else if (state.page === 'entries') main.innerHTML = entriesHtml();
      else main.innerHTML = redactionHtml();
      bindPage();
    }

    function linesHtml() {
      var rows = [];
      var onLines = 0;
      var onSubjects = 0;
      var offCount = 0;
      DIRECTORY.forEach(function (line) {
        if (line.status === 'on') onLines += 1;
        else offCount += 1;
        line.subjects.forEach(function (subject) {
          if (subject.status === 'on') onSubjects += 1;
          else offCount += 1;
        });
        var showLine = state.shelf === 'all' || line.status === state.shelf;
        var subjects = line.subjects.filter(function (subject) {
          return state.shelf === 'all' || subject.status === state.shelf;
        });
        if (!showLine && !subjects.length) return;
        if (showLine) rows.push(rowHtml(line.name, '内容线', '—', line.status, false));
        subjects.forEach(function (subject) {
          rows.push(rowHtml(subject.name, '方向', line.name, subject.status, true));
        });
      });
      return pageHead('基础资料', '内容线与方向', '日常列表默认只看使用中。已下架单独打开，不混回主列表。名称是虚构的，编号不在这页出现。') +
        '<div class="stats"><div class="stat"><b>' + onLines + '</b><span>使用中的内容线</span></div><div class="stat"><b>' + onSubjects + '</b><span>使用中的方向</span></div><div class="stat"><b>' + offCount + '</b><span>已下架，要单独看</span></div></div>' +
        shelfSwitch(state.shelf) +
        '<div class="card table-wrap"><table><thead><tr><th>名称</th><th>类型</th><th>所属内容线</th><th>状态</th></tr></thead><tbody>' +
        (rows.join('') || '<tr><td colspan="4">这一栏是空的。</td></tr>') + '</tbody></table></div>';
    }

    function catalogHtml() {
      var body = productsNow().map(function (product) {
        var checked = state.carryIds.has(product.id) ? ' checked' : '';
        var shelfLabel = productShelfLabel(product, state.comboShelf);
        return '<tr><td><label><input type="checkbox" name="carry-product" value="' + esc(product.id) + '"' + checked + '> ' +
          esc(product.name) + '</label></td><td>' + esc(lineName(LINES, product.lineId)) + '</td><td>' + chips(coversLabel(product).split('、')) +
          '</td><td class="money">' + money(product.price) + '</td><td><span class="tag ' + shelfLabel.cls + '">' + shelfLabel.text + '</span></td></tr>';
      }).join('');
      return pageHead('商品与营销', '商品清单', '勾选后带到调价、上下架或优惠。一个商品只覆盖一部分方向，勾上不等于每个方向都会改。') +
        '<div class="toolbar"><p class="quiet">价格是整数示意，不是真实售价。</p><div class="actions">' +
        '<button type="button" class="primary" id="carry">带到批量调价</button>' +
        '<button type="button" class="ghost" id="carry-shelf">带到上下架</button>' +
        '<button type="button" class="ghost" id="carry-coupon">带到优惠</button></div></div>' +
        '<p class="quiet" id="carry-status"></p>' +
        '<div class="card table-wrap"><table><thead><tr><th>商品</th><th>内容线</th><th>覆盖方向</th><th>现价</th><th>状态</th></tr></thead><tbody>' +
        body + '</tbody></table></div>';
    }

    function priceHtml() {
      return pageHead('商品与营销', '批量调价', '数字一次填好。确认之前，先看见真正会改价的「商品 × 方向」。') +
        presetRow(PRESETS, 'data-preset') + stepsHtml(['调价方式', '商品', '方向', '确认'], state.step) +
        '<div class="workspace"><div class="panel" data-role="form">' + priceStep() +
        '<div class="actions"><button type="button" class="ghost" id="step-back">上一步</button>' +
        '<button type="button" class="primary" id="step-next">下一步</button>' +
        '<button type="button" class="primary" id="open-confirm">打开确认</button></div>' +
        '<p id="demo-status" role="status">' + esc(state.status) + '</p></div>' +
        '<aside class="impact" id="impact" aria-label="影响预览"></aside></div>';
    }

    function priceStep() {
      if (state.step === 0) {
        return '<fieldset class="field"><legend>怎么改</legend><div class="modes">' +
          modeRadio('percent', '按比例下调', state.mode) + modeRadio('reduce', '按金额减免', state.mode) + modeRadio('fixed', '统一售价', state.mode) +
          '</div><div class="stack-fields"><label>数字<input id="adj-value" type="number" step="1" value="' + esc(state.value) + '"></label>' +
          '<label>生效时间<input id="eff-at" type="datetime-local" value="' + esc(state.effectiveAt) + '"></label></div>' +
          '<p class="hint" id="value-hint"></p></fieldset>';
      }
      if (state.step === 1) return '<fieldset class="field"><legend>商品</legend>' + grouped('product', state.selectedProductIds) + '</fieldset>';
      if (state.step === 2) return '<fieldset class="field"><legend>方向</legend>' + grouped('subject', state.selectedSubjectIds) + '</fieldset>';
      return '<fieldset class="field"><legend>确认前再看一遍</legend><p class="quiet">右侧列出实际生效的组合。有阻断时，确认框不会打开。</p></fieldset>';
    }

    function shelfHtml() {
      return pageHead('商品与营销', '上下架', '一次圈定商品和方向。确认前只统计覆盖范围内、并且状态真的会变的组合。') +
        presetRow(SHELF_PRESETS, 'data-shelf-preset') + stepsHtml(['动作与时间', '商品', '方向', '确认'], state.shelfStep) +
        '<div class="workspace"><div class="panel">' + shelfStep() +
        '<div class="actions"><button type="button" class="ghost" id="shelf-back">上一步</button>' +
        '<button type="button" class="primary" id="shelf-next">下一步</button>' +
        '<button type="button" class="primary" id="shelf-confirm">打开确认</button></div>' +
        '<p class="status-line" id="shelf-status">' + esc(state.shelfStatus) + '</p></div>' +
        '<aside class="impact" id="shelf-impact"></aside></div>';
    }

    function shelfStep() {
      if (state.shelfStep === 0) {
        return '<fieldset class="field"><legend>做什么</legend><div class="modes">' +
          '<label><input type="radio" name="shelf-action" value="off"' + (state.shelfAction === 'off' ? ' checked' : '') + '> 批量下架</label>' +
          '<label><input type="radio" name="shelf-action" value="on"' + (state.shelfAction === 'on' ? ' checked' : '') + '> 批量上架</label></div>' +
          '<div class="stack-fields"><label>生效时间<input id="shelf-start" type="datetime-local" value="' + esc(state.shelfStart) + '"></label>' +
          '<label>截止时间<input id="shelf-end" type="datetime-local" value="' + esc(state.shelfEnd) + '"></label></div>' +
          '<p class="hint">下架从生效时间开始停售，到截止时间结束这次窗口。是否届时自动恢复，由正式后台决定。这里只演示窗口本身。</p></fieldset>';
      }
      if (state.shelfStep === 1) return '<fieldset class="field"><legend>商品</legend>' + grouped('shelf-product', state.shelfProductIds) + '</fieldset>';
      if (state.shelfStep === 2) return '<fieldset class="field"><legend>方向</legend>' + grouped('shelf-subject', state.shelfSubjectIds) + '</fieldset>';
      return '<fieldset class="field"><legend>确认前再看一遍</legend><p class="quiet">已经是目标状态的组合不会重复改。</p></fieldset>';
    }

    function couponHtml() {
      return pageHead('商品与营销', '优惠', '规则、商品、方向、有效期分四步。确认前展开真正能用这张优惠的组合。') +
        presetRow(COUPON_PRESETS, 'data-coupon-preset') + stepsHtml(['规则', '商品', '方向', '有效期'], state.couponStep) +
        '<div class="workspace"><div class="panel">' + couponStep() +
        '<div class="actions"><button type="button" class="ghost" id="coupon-back">上一步</button>' +
        '<button type="button" class="primary" id="coupon-next">下一步</button>' +
        '<button type="button" class="primary" id="coupon-confirm">打开确认</button></div>' +
        '<p class="status-line" id="coupon-status">' + esc(state.couponStatus) + '</p></div>' +
        '<aside class="impact" id="coupon-impact"></aside></div>';
    }

    function couponStep() {
      if (state.couponStep === 0) {
        return '<fieldset class="field"><legend>优惠规则</legend><div class="modes">' +
          '<label><input type="radio" name="coupon-kind" value="threshold"' + (state.couponKind === 'threshold' ? ' checked' : '') + '> 满减</label>' +
          '<label><input type="radio" name="coupon-kind" value="percent"' + (state.couponKind === 'percent' ? ' checked' : '') + '> 按比例优惠</label></div>' +
          (state.couponKind === 'percent'
            ? '<div class="stack-fields"><label>优惠比例 %<input id="coupon-percent" type="number" step="1" value="' + esc(state.couponPercent) + '"></label></div>'
            : '<div class="stack-fields"><label>满<input id="coupon-threshold" type="number" step="1" value="' + esc(state.couponThreshold) + '"></label>' +
              '<label>减<input id="coupon-amount" type="number" step="1" value="' + esc(state.couponAmount) + '"></label></div>') +
          '<p class="hint">减免必须小于门槛。比例必须小于 100%。这里的数字是示意。</p></fieldset>';
      }
      if (state.couponStep === 1) return '<fieldset class="field"><legend>适用商品</legend>' + grouped('coupon-product', state.couponProductIds) + '</fieldset>';
      if (state.couponStep === 2) return '<fieldset class="field"><legend>方向</legend>' + grouped('coupon-subject', state.couponSubjectIds) + '</fieldset>';
      return '<fieldset class="field"><legend>有效期</legend><div class="stack-fields">' +
        '<label>开始<input id="coupon-start" type="datetime-local" value="' + esc(state.couponStart) + '"></label>' +
        '<label>结束<input id="coupon-end" type="datetime-local" value="' + esc(state.couponEnd) + '"></label></div></fieldset>';
    }

    function adsHtml() {
      var rows = state.ads.filter(function (item) {
        return state.adFilter === 'all' || item.status === state.adFilter;
      }).map(function (item) {
        var selected = item.id === state.adDraft.id ? ' is-selected' : '';
        return '<tr class="' + selected + '"><td><button type="button" class="row-btn" data-ad="' + esc(item.id) + '">' + esc(item.name) +
          '</button></td><td>' + esc(item.placement) + '</td><td>' + esc(lineName(LINES, item.lineId)) + '</td><td>' + esc(destText(item)) +
          '</td><td class="money">' + esc(String(item.sort)) + '</td><td>' + statusTag(item.status) + '</td></tr>';
      }).join('');
      return pageHead('运营位', '广告素材', '按「放在哪里、点去哪里、何时投放」来写。同一位置和内容线里，重叠时间内的排序不能重复。') +
        '<div class="presets"><button type="button" class="preset" data-ad-example="full"><strong>示例 · 一份完整素材</strong><small>横幅，站内活动页，时间不和现有素材重叠。</small></button>' +
        '<button type="button" class="preset" data-ad-example="clash"><strong>示例 · 排序撞期</strong><small>和「写作营开场」占同一位置、同一排序。</small></button>' +
        '<button type="button" class="preset" data-ad-example="link"><strong>示例 · 外链不完整</strong><small>地址不是 https://，不能保存。</small></button></div>' +
        filterSwitch('ad-filter', state.adFilter) +
        '<div class="split-admin"><div class="list-card table-wrap"><table><thead><tr><th>名称</th><th>位置</th><th>内容线</th><th>点击去向</th><th>排序</th><th>状态</th></tr></thead><tbody>' +
        (rows || '<tr><td colspan="6">这一栏是空的。</td></tr>') + '</tbody></table></div>' + adEditor() + '</div>';
    }

    function adEditor() {
      var draft = state.adDraft;
      return '<form class="editor" id="ad-form"><h2>' + (draft.id ? '编辑素材' : '新素材') + '</h2><p class="quiet">保存后只留在本页。</p>' +
        fieldLine('名称', '<input name="name" type="text" value="' + esc(draft.name) + '">') +
        fieldLine('放在哪里', selectHtml('placement', PLACEMENTS, draft.placement)) +
        fieldLine('内容线', selectHtml('lineId', LINES.map(function (line) { return { value: line.id, label: line.name }; }), draft.lineId)) +
        fieldLine('点击后去哪里', selectHtml('destType', [
          { value: 'page', label: '站内页' }, { value: 'product', label: '商品' }, { value: 'link', label: '外链' }, { value: 'none', label: '无跳转' }
        ], draft.destType)) +
        destField(draft) +
        '<div class="pair"><label class="field-line">开始<input name="start" type="datetime-local" value="' + esc(draft.start) + '"></label>' +
        '<label class="field-line">结束<input name="end" type="datetime-local" value="' + esc(draft.end) + '"></label></div>' +
        '<div class="pair"><label class="field-line">排序<input name="sort" type="number" step="1" value="' + esc(draft.sort) + '"></label>' +
        '<label class="field-line">状态' + selectHtml('status', [{ value: 'on', label: '使用中' }, { value: 'off', label: '已下架' }], draft.status) + '</label></div>' +
        '<div id="ad-review"></div><div class="actions"><button type="button" class="ghost" id="ad-new">新建</button>' +
        '<button type="button" class="primary" id="ad-save">保存到本页</button></div><p class="status-line" id="ad-status">' + esc(state.adStatus) + '</p></form>';
    }

    function entriesHtml() {
      var rows = state.entries.filter(function (item) {
        return state.entryFilter === 'all' || item.status === state.entryFilter;
      }).map(function (item) {
        var selected = item.id === state.entryDraft.id ? ' is-selected' : '';
        return '<tr class="' + selected + '"><td><button type="button" class="row-btn" data-entry="' + esc(item.id) + '">' + esc(item.name) +
          '</button></td><td>' + esc(lineName(LINES, item.lineId)) + '</td><td>' + esc(envLabel(item.env)) + '</td><td>' + esc(entryTarget(item)) +
          '</td><td>' + statusTag(item.status) + '</td></tr>';
      }).join('');
      return pageHead('运营位', '首页图标', '每个入口都要有最终去向。站内页要选到具体页，外链必须是完整地址，小程序要有标识和路径。') +
        '<div class="presets"><button type="button" class="preset" data-entry-example="full"><strong>示例 · 站内入口</strong><small>去向是课程详情，字段齐全。</small></button>' +
        '<button type="button" class="preset" data-entry-example="link"><strong>示例 · 外链不是 https</strong><small>http 地址不能保存。</small></button>' +
        '<button type="button" class="preset" data-entry-example="mini"><strong>示例 · 小程序缺路径</strong><small>只有标识，没有页面路径。</small></button></div>' +
        filterSwitch('entry-filter', state.entryFilter) +
        '<div class="split-admin"><div class="list-card table-wrap"><table><thead><tr><th>名称</th><th>内容线</th><th>打开环境</th><th>最终去向</th><th>状态</th></tr></thead><tbody>' +
        (rows || '<tr><td colspan="5">这一栏是空的。</td></tr>') + '</tbody></table></div>' + entryEditor() + '</div>';
    }

    function entryEditor() {
      var draft = state.entryDraft;
      var target = '';
      if (draft.env === 'web') target = fieldLine('外链', '<input name="target" type="url" value="' + esc(draft.target) + '" placeholder="https://">');
      else if (draft.env === 'mini') {
        target = '<div class="pair"><label class="field-line">小程序标识<input name="appId" type="text" value="' + esc(draft.appId) + '"></label>' +
          '<label class="field-line">页面路径<input name="path" type="text" value="' + esc(draft.path) + '"></label></div>';
      } else target = fieldLine('站内去向', selectHtml('target', PAGE_OPTIONS, draft.target));
      return '<form class="editor" id="entry-form"><h2>' + (draft.id ? '编辑入口' : '新入口') + '</h2><p class="quiet">保存后只留在本页。</p>' +
        fieldLine('名称', '<input name="name" type="text" value="' + esc(draft.name) + '">') +
        fieldLine('展示在', selectHtml('lineId', LINES.map(function (line) { return { value: line.id, label: line.name }; }), draft.lineId)) +
        fieldLine('打开环境', selectHtml('env', [
          { value: 'app', label: '站内页' }, { value: 'web', label: '外链' }, { value: 'mini', label: '小程序' }
        ], draft.env)) + target +
        fieldLine('状态', selectHtml('status', [{ value: 'on', label: '使用中' }, { value: 'off', label: '已下架' }], draft.status)) +
        '<div id="entry-review"></div><div class="actions"><button type="button" class="ghost" id="entry-new">新建</button>' +
        '<button type="button" class="primary" id="entry-save">保存到本页</button></div><p class="status-line" id="entry-status">' + esc(state.entryStatus) + '</p></form>';
    }

    function bindPage() {
      root.querySelectorAll('[data-shelf]').forEach(function (button) {
        button.addEventListener('click', function () { state.shelf = button.getAttribute('data-shelf'); render(); });
      });
      root.querySelectorAll('[data-ad-filter]').forEach(function (button) {
        button.addEventListener('click', function () { state.adFilter = button.getAttribute('data-ad-filter'); render(); });
      });
      root.querySelectorAll('[data-entry-filter]').forEach(function (button) {
        button.addEventListener('click', function () { state.entryFilter = button.getAttribute('data-entry-filter'); render(); });
      });
      var carryNote = main.querySelector('#carry-status');
      function carryTo(page, bag, stepKey, status) {
        if (!state.carryIds.size) {
          if (carryNote) carryNote.textContent = '先勾选至少一个商品。';
          return;
        }
        bag.clear();
        state.carryIds.forEach(function (id) { bag.add(id); });
        state.page = page;
        state[stepKey] = 2;
        state.status = status;
        if (page === 'shelf') state.shelfStatus = status;
        if (page === 'coupon') state.couponStatus = status;
        render();
      }
      var carry = main.querySelector('#carry');
      if (carry) {
        main.querySelectorAll('input[name="carry-product"]').forEach(function (input) {
          input.addEventListener('change', function () {
            if (input.checked) state.carryIds.add(input.value);
            else state.carryIds.delete(input.value);
          });
        });
        carry.addEventListener('click', function () {
          carryTo('price', state.selectedProductIds, 'step', '商品已从清单带入。接着选方向。');
        });
        main.querySelector('#carry-shelf').addEventListener('click', function () {
          carryTo('shelf', state.shelfProductIds, 'shelfStep', '商品已从清单带入。接着选方向。');
        });
        main.querySelector('#carry-coupon').addEventListener('click', function () {
          carryTo('coupon', state.couponProductIds, 'couponStep', '商品已从清单带入。接着选方向。');
        });
      }
      if (state.page === 'price') bindPrice();
      if (state.page === 'shelf') bindShelf();
      if (state.page === 'coupon') bindCoupon();
      if (state.page === 'ads') bindAds();
      if (state.page === 'entries') bindEntries();
    }

    function bindPrice() {
      var form = main.querySelector('[data-role="form"]');
      var impact = main.querySelector('#impact');
      var statusNode = main.querySelector('#demo-status');
      markPresets('[data-preset]', state.preset);
      refresh();
      main.querySelectorAll('[data-preset]').forEach(function (button) {
        button.addEventListener('click', function () { applyPreset(button.getAttribute('data-preset')); });
      });
      main.querySelectorAll('[data-step]').forEach(function (button) {
        button.addEventListener('click', function () { state.step = Number(button.getAttribute('data-step')); render(); });
      });
      form.addEventListener('change', function (event) {
        var target = event.target;
        if (target.name === 'product' || target.name === 'subject') {
          var bag = target.name === 'product' ? state.selectedProductIds : state.selectedSubjectIds;
          if (target.checked) bag.add(target.value); else bag.delete(target.value);
          state.preset = null; state.status = '选择已改。右侧按覆盖范围重算组合。'; refresh();
        }
        if (target.name === 'adj-mode') { state.mode = target.value; state.preset = null; state.status = '调价方式已改。'; refresh(); }
      });
      var valueInput = form.querySelector('#adj-value');
      var whenInput = form.querySelector('#eff-at');
      if (valueInput) valueInput.addEventListener('input', function (event) { state.value = event.target.value; state.preset = null; state.status = '数字已改。'; refresh(); });
      if (whenInput) whenInput.addEventListener('input', function (event) { state.effectiveAt = event.target.value; state.preset = null; state.status = '生效时间已改。'; refresh(); });
      main.querySelector('#step-back').addEventListener('click', function () { state.step = Math.max(0, state.step - 1); render(); });
      main.querySelector('#step-next').addEventListener('click', function () { state.step = Math.min(3, state.step + 1); render(); });
      main.querySelector('#open-confirm').addEventListener('click', function () {
        var result = refresh();
        if (!result.canConfirm) { state.status = '还有必须先处理的问题，确认框不会打开。'; statusNode.textContent = state.status; return; }
        openDialog(result, function () {
          var names = [];
          result.validCombos.forEach(function (combo) {
            state.prices[combo.productId] = combo.nextPrice;
            if (names.indexOf(combo.productName) === -1) names.push(combo.productName);
          });
          var skipped = result.mismatchedSubjects.map(function (item) { return item.name; }).join('、');
          var entry = '批量调价「' + names.join('、') + '」，' + describeAdjustment(priceInput().adjustment) +
            '，生效时间 ' + formatWhen(state.effectiveAt) + '，覆盖 ' + result.counts.valid + ' 个「商品 × 方向」组合。';
          if (skipped) entry += '已跳过不适用的方向：' + skipped + '。';
          entry += '没有写入真实后台。';
          state.log.unshift({ at: '刚刚', text: entry });
          state.status = '已记在本页的操作记录里。没有写入真实后台。';
        });
      });

      function refresh() {
        var result = analyze(priceInput());
        impact.className = 'impact ' + tone(result);
        impact.innerHTML = priceImpact(result, state.log);
        statusNode.textContent = state.status;
        var hint = main.querySelector('#value-hint');
        if (hint && state.mode === 'percent') hint.textContent = '例如 20 表示下调 20%。大于或等于 100 不能提交。实际降幅达到 40% 会提醒。';
        if (hint && state.mode === 'reduce') hint.textContent = '从现价减去这个金额。结果小于或等于 0 不能提交。降幅达到 40% 会提醒。';
        if (hint && state.mode === 'fixed') hint.textContent = '把覆盖到的组合改成这个售价。高于现价会提醒这是涨价；小于或等于 0 不能提交。';
        main.querySelector('#step-back').hidden = state.step === 0;
        main.querySelector('#step-next').hidden = state.step === 3;
        main.querySelector('#open-confirm').hidden = state.step !== 3;
        markPresets('[data-preset]', state.preset);
        return result;
      }

      function applyPreset(key) {
        var preset = PRESETS[key];
        PRODUCTS.forEach(function (product) { state.prices[product.id] = product.price; });
        state.preset = preset.id;
        state.selectedProductIds = new Set(preset.productIds);
        state.selectedSubjectIds = new Set(preset.subjectIds);
        state.mode = preset.adjustment.mode;
        state.value = String(preset.adjustment.value);
        state.effectiveAt = preset.effectiveAt;
        state.step = 3;
        state.status = preset.blurb;
        render();
      }
    }

    function bindShelf() {
      var impact = main.querySelector('#shelf-impact');
      var statusNode = main.querySelector('#shelf-status');
      refresh();
      main.querySelectorAll('[data-shelf-preset]').forEach(function (button) {
        button.addEventListener('click', function () {
          var preset = SHELF_PRESETS[button.getAttribute('data-shelf-preset')];
          state.shelfPreset = preset.id;
          state.shelfProductIds = new Set(preset.productIds);
          state.shelfSubjectIds = new Set(preset.subjectIds);
          state.shelfAction = preset.action;
          state.shelfStart = preset.start;
          state.shelfEnd = preset.end;
          state.shelfStep = 3;
          state.shelfStatus = preset.blurb;
          render();
        });
      });
      main.querySelectorAll('[data-step]').forEach(function (button) {
        button.addEventListener('click', function () { state.shelfStep = Number(button.getAttribute('data-step')); render(); });
      });
      main.querySelector('.panel').addEventListener('change', onShelfChange);
      function onShelfChange(event) {
        if (state.page !== 'shelf') return;
        var target = event.target;
        if (target.name === 'shelf-product' || target.name === 'shelf-subject') {
          var bag = target.name === 'shelf-product' ? state.shelfProductIds : state.shelfSubjectIds;
          if (target.checked) bag.add(target.value); else bag.delete(target.value);
          state.shelfPreset = null; state.shelfStatus = '选择已改。'; refresh();
        }
        if (target.name === 'shelf-action') { state.shelfAction = target.value; state.shelfPreset = null; refresh(); }
      }
      var start = main.querySelector('#shelf-start');
      var end = main.querySelector('#shelf-end');
      if (start) start.addEventListener('input', function (event) { state.shelfStart = event.target.value; state.shelfPreset = null; refresh(); });
      if (end) end.addEventListener('input', function (event) { state.shelfEnd = event.target.value; state.shelfPreset = null; refresh(); });
      main.querySelector('#shelf-back').addEventListener('click', function () { state.shelfStep = Math.max(0, state.shelfStep - 1); render(); });
      main.querySelector('#shelf-next').addEventListener('click', function () { state.shelfStep = Math.min(3, state.shelfStep + 1); render(); });
      main.querySelector('#shelf-confirm').addEventListener('click', function () {
        var result = refresh();
        if (!result.canConfirm) { state.shelfStatus = '还有必须先处理的问题，确认框不会打开。'; statusNode.textContent = state.shelfStatus; return; }
        openDialog(result, function () {
          result.changing.forEach(function (row) { state.comboShelf[row.key] = row.to; });
          state.shelfStatus = '已记在本页。' + result.changing.length + ' 个组合改为' + (state.shelfAction === 'on' ? '使用中' : '已下架') + '。没有写入真实后台。';
        }, shelfDialog(result));
      });
      function refresh() {
        var result = reviewShelf(shelfInput());
        impact.className = 'impact ' + tone(result);
        impact.innerHTML = batchImpact('这次会改到哪里', result, result.changing.map(function (row) {
          return '<li class="combo"><span>' + esc(row.productName) + ' × ' + esc(row.subjectName) + '</span><span>' +
            statusWord(row.from) + ' → ' + statusWord(row.to) + '</span></li>';
        }).join(''), result.mismatched, 'clear-shelf-mismatch');
        statusNode.textContent = state.shelfStatus;
        main.querySelector('#shelf-back').hidden = state.shelfStep === 0;
        main.querySelector('#shelf-next').hidden = state.shelfStep === 3;
        main.querySelector('#shelf-confirm').hidden = state.shelfStep !== 3;
        markPresets('[data-shelf-preset]', state.shelfPreset);
        return result;
      }
    }

    function bindCoupon() {
      var impact = main.querySelector('#coupon-impact');
      var statusNode = main.querySelector('#coupon-status');
      refresh();
      main.querySelectorAll('[data-coupon-preset]').forEach(function (button) {
        button.addEventListener('click', function () {
          var preset = COUPON_PRESETS[button.getAttribute('data-coupon-preset')];
          state.couponPreset = preset.id;
          state.couponKind = preset.kind;
          state.couponThreshold = preset.threshold;
          state.couponAmount = preset.amount;
          state.couponPercent = preset.percent;
          state.couponProductIds = new Set(preset.productIds);
          state.couponSubjectIds = new Set(preset.subjectIds);
          state.couponStart = preset.start;
          state.couponEnd = preset.end;
          state.couponStep = 3;
          state.couponStatus = preset.blurb;
          render();
        });
      });
      main.querySelectorAll('[data-step]').forEach(function (button) {
        button.addEventListener('click', function () { state.couponStep = Number(button.getAttribute('data-step')); render(); });
      });
      main.querySelector('.panel').addEventListener('change', onCouponChange);
      function onCouponChange(event) {
        if (state.page !== 'coupon') return;
        var target = event.target;
        if (target.name === 'coupon-product' || target.name === 'coupon-subject') {
          var bag = target.name === 'coupon-product' ? state.couponProductIds : state.couponSubjectIds;
          if (target.checked) bag.add(target.value); else bag.delete(target.value);
          state.couponPreset = null; state.couponStatus = '选择已改。'; refresh();
        }
        if (target.name === 'coupon-kind') {
          state.couponKind = target.value;
          state.couponPreset = null;
          render();
        }
      }
      ['coupon-threshold', 'coupon-amount', 'coupon-percent', 'coupon-start', 'coupon-end'].forEach(function (id) {
        var node = main.querySelector('#' + id);
        if (!node) return;
        node.addEventListener('input', function (event) {
          if (id === 'coupon-threshold') state.couponThreshold = event.target.value;
          if (id === 'coupon-amount') state.couponAmount = event.target.value;
          if (id === 'coupon-percent') state.couponPercent = event.target.value;
          if (id === 'coupon-start') state.couponStart = event.target.value;
          if (id === 'coupon-end') state.couponEnd = event.target.value;
          state.couponPreset = null;
          refresh();
        });
      });
      main.querySelector('#coupon-back').addEventListener('click', function () { state.couponStep = Math.max(0, state.couponStep - 1); render(); });
      main.querySelector('#coupon-next').addEventListener('click', function () { state.couponStep = Math.min(3, state.couponStep + 1); render(); });
      main.querySelector('#coupon-confirm').addEventListener('click', function () {
        var result = refresh();
        if (!result.canConfirm) { state.couponStatus = '还有必须先处理的问题，确认框不会打开。'; statusNode.textContent = state.couponStatus; return; }
        openDialog(result, function () {
          state.couponStatus = '已记在本页。' + result.label + '，作用于 ' + result.counts.valid + ' 个组合。没有写入真实后台。';
        }, couponDialog(result));
      });
      function refresh() {
        var result = reviewCoupon(couponInput());
        impact.className = 'impact ' + tone(result);
        impact.innerHTML = batchImpact('这张优惠用在哪里', result, result.valid.map(function (pair) {
          return '<li class="combo"><span>' + esc(pair.product.name) + ' × ' + esc(pair.subject.name) + '</span><span>' + esc(result.label) + '</span></li>';
        }).join(''), result.mismatched, 'clear-coupon-mismatch');
        statusNode.textContent = state.couponStatus;
        main.querySelector('#coupon-back').hidden = state.couponStep === 0;
        main.querySelector('#coupon-next').hidden = state.couponStep === 3;
        main.querySelector('#coupon-confirm').hidden = state.couponStep !== 3;
        markPresets('[data-coupon-preset]', state.couponPreset);
        return result;
      }
    }

    function bindAds() {
      showDraftReview('#ad-review', reviewAd(state.adDraft, state.ads), state.adDraft.name || state.adDraft.start);
      var form = main.querySelector('#ad-form');
      form.addEventListener('input', readAd);
      form.addEventListener('change', function (event) {
        readAd();
        if (event.target.name === 'destType') render();
      });
      main.querySelectorAll('[data-ad]').forEach(function (button) {
        button.addEventListener('click', function () {
          var found = state.ads.filter(function (item) { return item.id === button.getAttribute('data-ad'); })[0];
          state.adDraft = Object.assign({}, found, { sort: String(found.sort) });
          state.adStatus = '正在编辑「' + found.name + '」。';
          render();
        });
      });
      main.querySelectorAll('[data-ad-example]').forEach(function (button) {
        button.addEventListener('click', function () { state.adDraft = adExample(button.getAttribute('data-ad-example')); state.adStatus = '示例已填进右侧。还没有保存。'; render(); });
      });
      main.querySelector('#ad-new').addEventListener('click', function () { state.adDraft = blankAd(); state.adStatus = '新素材。'; render(); });
      main.querySelector('#ad-save').addEventListener('click', function () {
        readAd();
        var result = reviewAd(state.adDraft, state.ads);
        paintReview('#ad-review', result);
        if (!result.canSave) { state.adStatus = '还有必须先处理的问题，没有保存。'; main.querySelector('#ad-status').textContent = state.adStatus; return; }
        if (!state.adDraft.id) state.adDraft.id = 'a' + Date.now();
        var next = Object.assign({}, state.adDraft, { sort: Number(state.adDraft.sort) });
        var exists = false;
        state.ads = state.ads.map(function (item) { if (item.id !== next.id) return item; exists = true; return next; });
        if (!exists) state.ads.unshift(next);
        state.adDraft = Object.assign({}, next, { sort: String(next.sort) });
        state.adStatus = '已记在本页。没有写入真实后台。';
        render();
      });
      function readAd() {
        var data = new FormData(form);
        ['name', 'placement', 'lineId', 'destType', 'dest', 'start', 'end', 'sort', 'status'].forEach(function (key) {
          if (data.has(key)) state.adDraft[key] = data.get(key);
        });
        if (state.adDraft.destType === 'none') state.adDraft.dest = '';
        paintReview('#ad-review', reviewAd(state.adDraft, state.ads));
      }
    }

    function bindEntries() {
      showDraftReview('#entry-review', reviewEntry(state.entryDraft, state.entries), state.entryDraft.name);
      var form = main.querySelector('#entry-form');
      form.addEventListener('input', readEntry);
      form.addEventListener('change', function (event) {
        readEntry();
        if (event.target.name === 'env') render();
      });
      main.querySelectorAll('[data-entry]').forEach(function (button) {
        button.addEventListener('click', function () {
          var found = state.entries.filter(function (item) { return item.id === button.getAttribute('data-entry'); })[0];
          state.entryDraft = Object.assign({}, found);
          state.entryStatus = '正在编辑「' + found.name + '」。';
          render();
        });
      });
      main.querySelectorAll('[data-entry-example]').forEach(function (button) {
        button.addEventListener('click', function () { state.entryDraft = entryExample(button.getAttribute('data-entry-example')); state.entryStatus = '示例已填进右侧。还没有保存。'; render(); });
      });
      main.querySelector('#entry-new').addEventListener('click', function () { state.entryDraft = blankEntry(); state.entryStatus = '新入口。'; render(); });
      main.querySelector('#entry-save').addEventListener('click', function () {
        readEntry();
        var result = reviewEntry(state.entryDraft, state.entries);
        paintReview('#entry-review', result);
        if (!result.canSave) { state.entryStatus = '还有必须先处理的问题，没有保存。'; main.querySelector('#entry-status').textContent = state.entryStatus; return; }
        if (!state.entryDraft.id) state.entryDraft.id = 'e' + Date.now();
        var next = Object.assign({}, state.entryDraft);
        var exists = false;
        state.entries = state.entries.map(function (item) { if (item.id !== next.id) return item; exists = true; return next; });
        if (!exists) state.entries.unshift(next);
        state.entryDraft = Object.assign({}, next);
        state.entryStatus = '已记在本页。没有写入真实后台。';
        render();
      });
      function readEntry() {
        var data = new FormData(form);
        ['name', 'lineId', 'env', 'target', 'appId', 'path', 'status'].forEach(function (key) {
          if (data.has(key)) state.entryDraft[key] = data.get(key);
        });
        paintReview('#entry-review', reviewEntry(state.entryDraft, state.entries));
      }
    }

    function openDialog(result, onAccept, html) {
      dialog.innerHTML = html || priceDialog(result);
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.setAttribute('open', '');
      dialog.querySelector('#dialog-cancel').addEventListener('click', function () { dialog.close(); });
      dialog.querySelector('#dialog-accept').addEventListener('click', function () {
        onAccept();
        dialog.close();
        render();
      });
      dialog.querySelector('#dialog-accept').focus();
    }

    root.querySelector('.nav').addEventListener('click', function (event) {
      var button = event.target.closest('[data-page]');
      if (!button) return;
      state.page = button.getAttribute('data-page');
      render();
    });

    main.addEventListener('click', function (event) {
      var button = event.target.closest('[data-action]');
      if (!button) return;
      var action = button.getAttribute('data-action');
      if (action === 'clear-mismatch') clearSet(state.selectedSubjectIds, analyze(priceInput()).mismatchedSubjects, 'status', '已去掉不适用的方向。');
      if (action === 'clear-shelf-mismatch') clearSet(state.shelfSubjectIds, reviewShelf(shelfInput()).mismatched, 'shelfStatus', '已去掉不适用的方向。');
      if (action === 'clear-coupon-mismatch') clearSet(state.couponSubjectIds, reviewCoupon(couponInput()).mismatched, 'couponStatus', '已去掉不适用的方向。');
    });

    function clearSet(bag, mismatched, statusKey, text) {
      mismatched.forEach(function (item) { bag.delete(item.id); });
      state.preset = null;
      state.shelfPreset = null;
      state.couponPreset = null;
      state[statusKey] = text;
      if (statusKey === 'status') state.status = text;
      render();
    }

    render();
  }

  function appHtml() {
    var groups = [];
    PAGES.forEach(function (page) { if (groups.indexOf(page.group) === -1) groups.push(page.group); });
    var nav = groups.map(function (group) {
      return '<p>' + esc(group) + '</p>' + PAGES.filter(function (page) { return page.group === group; }).map(function (page) {
        return '<button type="button" data-page="' + page.id + '">' + esc(page.label) + '</button>';
      }).join('');
    }).join('');
    return '<div class="app"><header class="topbar"><div class="brand"><span class="mark" aria-hidden="true">' +
      '<svg viewBox="0 0 24 24" width="16" height="16"><rect x="3" y="3" width="7" height="7" rx="1.5" fill="currentColor"></rect>' +
      '<rect x="14" y="3" width="7" height="7" rx="1.5" fill="currentColor" opacity=".55"></rect>' +
      '<rect x="3" y="14" width="7" height="7" rx="1.5" fill="currentColor" opacity=".55"></rect>' +
      '<rect x="14" y="14" width="7" height="7" rx="1.5" fill="currentColor"></rect></svg></span>' +
      '<span><strong>批量运营工作台</strong><small>示意工作台</small></span></div><span class="pill">脱敏预览</span>' +
      '<span class="who">当前操作人：示例账号</span></header><div class="body"><nav class="nav" aria-label="工作台">' + nav +
      '<p class="foot">目录、价格和名称都是虚构的。确认不会离开这页。</p></nav><main class="main"></main></div>' +
      '<dialog id="confirm-dialog" aria-labelledby="confirm-title"></dialog></div>';
  }

  function pageHead(kicker, title, text) {
    return '<header class="page-head"><p class="kicker">' + esc(kicker) + '</p><h1>' + esc(title) + '</h1><p>' + esc(text) + '</p></header>';
  }

  function shelfSwitch(current) {
    return '<div class="seg" role="group" aria-label="状态">' + segButton('data-shelf', 'on', '使用中', current) +
      segButton('data-shelf', 'off', '已下架', current) + segButton('data-shelf', 'all', '全部', current) + '</div>';
  }

  function filterSwitch(attr, current) {
    return '<div class="seg" role="group" aria-label="状态">' + segButton(attr, 'on', '使用中', current) +
      segButton(attr, 'off', '已下架', current) + segButton(attr, 'all', '全部', current) + '</div>';
  }

  function segButton(attr, id, label, current) {
    return '<button type="button" ' + attr + '="' + id + '" aria-pressed="' + (id === current ? 'true' : 'false') + '">' + label + '</button>';
  }

  function rowHtml(name, kind, parent, status, child) {
    return '<tr class="' + (child ? 'child' : 'parent') + '"><td>' + esc(name) + '</td><td>' + kind + '</td><td>' + esc(parent) + '</td><td>' + statusTag(status) + '</td></tr>';
  }

  function statusTag(status) {
    var on = status === 'on';
    return '<span class="tag ' + (on ? 'on' : 'off') + '">' + (on ? '使用中' : '已下架') + '</span>';
  }

  function statusWord(status) { return status === 'on' ? '使用中' : '已下架'; }

  function stepsHtml(labels, current) {
    return '<ol class="steps">' + labels.map(function (label, index) {
      var mark = index === current ? ' aria-current="step"' : '';
      var done = index < current ? ' class="is-done"' : '';
      return '<li><button type="button" data-step="' + index + '"' + mark + done + '><i>' + (index + 1) + '</i>' + esc(label) + '</button></li>';
    }).join('') + '</ol>';
  }

  function presetRow(map, attr) {
    return '<div class="presets" role="group">' + Object.keys(map).map(function (key) {
      var preset = map[key];
      return '<button type="button" class="preset" ' + attr + '="' + preset.id + '" aria-pressed="false"><strong>示例 · ' +
        esc(preset.label) + '</strong><small>' + esc(preset.blurb) + '</small></button>';
    }).join('') + '</div>';
  }

  function modeRadio(value, label, current) {
    return '<label><input type="radio" name="adj-mode" value="' + value + '"' + (value === current ? ' checked' : '') + '> ' + label + '</label>';
  }

  function grouped(kind, selected) {
    var isProduct = kind.indexOf('product') !== -1;
    var source = isProduct ? PRODUCTS : SUBJECTS;
    return LINES.map(function (line) {
      var items = source.filter(function (item) { return item.lineId === line.id; });
      var choices = items.map(function (item) {
        var meta = '';
        if (isProduct) {
          meta = '<small data-price-for="' + esc(item.id) + '">现价 ' + money(item.price) + '</small><small>覆盖 ' + esc(coversLabel(item)) + '</small>';
        }
        return '<label class="choice"><input type="checkbox" name="' + kind + '" value="' + esc(item.id) + '"' +
          (selected.has(item.id) ? ' checked' : '') + '><span><strong>' + esc(item.name) + '</strong>' + meta + '</span></label>';
      }).join('');
      return '<div class="line-group"><p class="line-name">' + esc(line.name) + '</p><div class="choices">' + choices + '</div></div>';
    }).join('');
  }

  function productShelfLabel(product, shelf) {
    var off = product.covers.filter(function (id) { return (shelf[product.id + '|' + id] || 'on') === 'off'; }).length;
    if (!off) return { cls: 'on', text: '使用中' };
    if (off === product.covers.length) return { cls: 'off', text: '已下架' };
    return { cls: 'part', text: '部分下架' };
  }

  function chips(names) {
    return '<span class="chips">' + names.filter(Boolean).map(function (name) { return '<span class="chip">' + esc(name) + '</span>'; }).join('') + '</span>';
  }

  function fieldLine(label, control) {
    return '<label class="field-line">' + esc(label) + control + '</label>';
  }

  function selectHtml(name, options, current) {
    var list = options.map(function (option) {
      if (typeof option === 'string') option = { value: option, label: option };
      return '<option value="' + esc(option.value) + '"' + (option.value === current ? ' selected' : '') + '>' + esc(option.label) + '</option>';
    }).join('');
    return '<select name="' + name + '">' + list + '</select>';
  }

  function destField(draft) {
    if (draft.destType === 'page') return fieldLine('站内页', selectHtml('dest', PAGE_OPTIONS, draft.dest));
    if (draft.destType === 'product') return fieldLine('商品', selectHtml('dest', PRODUCTS.map(function (item) { return item.name; }), draft.dest));
    if (draft.destType === 'link') return fieldLine('外链', '<input name="dest" type="url" value="' + esc(draft.dest) + '" placeholder="https://">');
    return '<p class="hint">无跳转。点开素材后留在当前页。</p>';
  }

  function destText(item) {
    if (item.destType === 'none') return '无跳转';
    if (item.destType === 'link') return item.dest;
    return item.dest;
  }

  function envLabel(env) {
    if (env === 'web') return '外链';
    if (env === 'mini') return '小程序';
    return '站内页';
  }

  function entryTarget(item) {
    if (item.env === 'mini') return (item.appId || '未填标识') + ' / ' + (item.path || '未填路径');
    return item.target || '未填';
  }

  function adExample(key) {
    if (key === 'clash') return { id: '', name: '另一张开屏', placement: '开屏', lineId: 'general', destType: 'page', dest: '课程详情', start: '2026-04-01T00:00', end: '2026-04-20T00:00', sort: '1', status: 'on' };
    if (key === 'link') return { id: '', name: '临时活动', placement: '弹层', lineId: 'career', destType: 'link', dest: 'http://example.com/sale', start: '2026-06-01T00:00', end: '2026-06-20T00:00', sort: '1', status: 'on' };
    return { id: '', name: '夏季写作营', placement: '横幅', lineId: 'general', destType: 'page', dest: '活动页', start: '2026-06-01T00:00', end: '2026-06-30T00:00', sort: '2', status: 'on' };
  }

  function entryExample(key) {
    if (key === 'link') return { id: '', name: '临时活动', lineId: 'general', env: 'web', target: 'http://example.com/sale', appId: '', path: '', status: 'on' };
    if (key === 'mini') return { id: '', name: '练习小程序', lineId: 'career', env: 'mini', target: '', appId: 'wx-sample', path: '', status: 'on' };
    return { id: '', name: '写作营详情', lineId: 'general', env: 'app', target: '课程详情', appId: '', path: '', status: 'on' };
  }

  function tone(result) {
    if (result.blocks && result.blocks.length) return 'is-block';
    if (result.warnings && result.warnings.length) return 'is-warn';
    if (result.counts && result.counts.valid) return 'is-ok';
    return '';
  }

  function markPresets(selector, current) {
    var root = document.getElementById('demo-root');
    if (!root) return;
    root.querySelectorAll(selector).forEach(function (button) {
      var on = button.getAttribute(selector.slice(1, -1)) === current || button.getAttribute(Object.keys(button.dataset)[0] || '') === current;
      var attr = button.hasAttribute('data-preset') ? 'data-preset' : button.hasAttribute('data-shelf-preset') ? 'data-shelf-preset' : 'data-coupon-preset';
      on = button.getAttribute(attr) === current;
      button.setAttribute('aria-pressed', on ? 'true' : 'false');
      button.classList.toggle('is-on', on);
    });
  }

  function flagList(items, kind, withId) {
    if (!items.length) return '';
    return '<ul class="flag-list"' + (withId ? ' id="block-list" tabindex="-1"' : '') + '>' + items.map(function (item) {
      return '<li class="flag ' + kind + '">' + esc(item.message) + '</li>';
    }).join('') + '</ul>';
  }

  function priceImpact(result, log) {
    var combos = result.validCombos.length ? '<ul class="combo-list">' + result.validCombos.map(function (combo) {
      var cls = 'combo';
      if (Number.isFinite(combo.nextPrice) && combo.nextPrice <= 0) cls += ' is-bad';
      else if (combo.dropRatio !== null && combo.dropRatio >= 0.4) cls += ' is-steep';
      return '<li class="' + cls + '"><span>' + esc(combo.productName) + ' × ' + esc(combo.subjectName) + '</span><span class="money">' +
        money(combo.basePrice) + ' → ' + money(combo.nextPrice) + '</span></li>';
    }).join('') + '</ul>' : '<p class="quiet">当前没有会生效的组合。</p>';
    var clear = result.mismatchedSubjects.length
      ? '<button type="button" class="ghost" data-action="clear-mismatch">去掉不适用的方向：' + esc(result.mismatchedSubjects.map(function (item) { return item.name; }).join('、')) + '</button>'
      : '';
    return '<h2>这次会改到哪里</h2><p class="count-line">已选 <b>' + result.counts.products + '</b> 个商品、<b>' + result.counts.subjects +
      '</b> 个方向，实际生效 <b>' + result.counts.valid + '</b> 个组合。</p>' + combos +
      '<div class="flag-block"><h3>提醒 · 可以继续</h3>' + (result.warnings.length ? flagList(result.warnings, 'warn') : '<p class="quiet">没有提醒。</p>') + clear + '</div>' +
      '<div class="flag-block"><h3>阻断 · 不能提交</h3>' + (result.blocks.length ? flagList(result.blocks, 'block', true) : '<p class="quiet">没有阻断。到第 4 步可以打开确认。</p>') + '</div>' +
      '<div class="flag-block"><h3>本页记录</h3>' + (log && log.length
        ? '<ol class="log-list" id="op-log">' + log.map(function (item) {
            return '<li><time>' + esc(item.at) + '</time><p>' + esc(item.text) + '</p></li>';
          }).join('') + '</ol>'
        : '<p class="quiet" id="op-log">还没有确认过。确认后只留在这个页面的内存里。</p>') + '</div>';
  }

  function batchImpact(title, result, rows, mismatched, clearAction) {
    var list = rows ? '<ul class="combo-list">' + rows + '</ul>' : '<p class="quiet">当前没有会生效的组合。</p>';
    var clear = mismatched && mismatched.length
      ? '<button type="button" class="ghost" data-action="' + clearAction + '">去掉不适用的方向：' + esc(mismatched.map(function (item) { return item.name; }).join('、')) + '</button>'
      : '';
    return '<h2>' + esc(title) + '</h2><p class="count-line">已选 <b>' + result.counts.products + '</b> 个商品、<b>' + result.counts.subjects +
      '</b> 个方向，实际生效 <b>' + result.counts.valid + '</b> 个组合。</p>' + (rows ? list : '<p class="quiet">当前没有会生效的组合。</p>') +
      '<div class="flag-block"><h3>提醒 · 可以继续</h3>' + (result.warnings.length ? flagList(result.warnings, 'warn') : '<p class="quiet">没有提醒。</p>') + clear + '</div>' +
      '<div class="flag-block"><h3>阻断 · 不能提交</h3>' + (result.blocks.length ? flagList(result.blocks, 'block', true) : '<p class="quiet">没有阻断。到第 4 步可以打开确认。</p>') + '</div>';
  }

  function showDraftReview(selector, result, ready) {
    var node = document.querySelector(selector);
    if (!node) return;
    if (!ready) {
      node.innerHTML = '<p class="quiet">填完再保存。缺字段、时间冲突或去向不完整，会停在这里。</p>';
      return;
    }
    paintReview(selector, result);
  }

  function paintReview(selector, result) {
    var node = document.querySelector(selector);
    if (!node) return;
    var warnings = result.warnings.length ? flagList(result.warnings, 'warn') : '';
    var blocks = result.blocks.length ? flagList(result.blocks, 'block') : '<p class="quiet">没有阻断，可以保存到本页。</p>';
    node.innerHTML = warnings + blocks;
  }

  function priceDialog(result) {
    var rows = result.validCombos.map(function (combo) {
      return '<li class="combo"><span>' + esc(combo.productName) + ' × ' + esc(combo.subjectName) + '</span><span class="money">' +
        money(combo.basePrice) + ' → ' + money(combo.nextPrice) + '</span></li>';
    }).join('');
    var extra = result.mismatchedSubjects.length ? '<p>不适用、不会改的方向：' + esc(result.mismatchedSubjects.map(function (item) { return item.name; }).join('、')) + '。</p>' : '';
    return dialogFrame('确认这次调价？', '<p>将改 <b>' + result.counts.valid + '</b> 个「商品 × 方向」组合。按下确认后，只写进本页内存。</p>' + extra +
      '<ul class="dialog-list">' + rows + '</ul><p>没有连接真实后台。刷新后，这次记录会消失。</p>');
  }

  function shelfDialog(result) {
    var rows = result.changing.map(function (row) {
      return '<li class="combo"><span>' + esc(row.productName) + ' × ' + esc(row.subjectName) + '</span><span>' + statusWord(row.from) + ' → ' + statusWord(row.to) + '</span></li>';
    }).join('');
    return dialogFrame('确认这次上下架？', '<p>将改 <b>' + result.changing.length + '</b> 个组合。只写进本页内存。</p><ul class="dialog-list">' + rows + '</ul><p>没有连接真实后台。</p>');
  }

  function couponDialog(result) {
    var rows = result.valid.map(function (pair) {
      return '<li class="combo"><span>' + esc(pair.product.name) + ' × ' + esc(pair.subject.name) + '</span><span>' + esc(result.label) + '</span></li>';
    }).join('');
    return dialogFrame('确认这张优惠？', '<p>' + esc(result.label) + '，作用于 <b>' + result.counts.valid + '</b> 个组合。</p><ul class="dialog-list">' + rows + '</ul><p>没有连接真实后台。</p>');
  }

  function dialogFrame(title, body) {
    return '<div class="dialog"><h3 id="confirm-title">' + esc(title) + '</h3>' + body +
      '<div class="actions"><button type="button" class="ghost" id="dialog-cancel">返回修改</button>' +
      '<button type="button" class="primary" id="dialog-accept">确认，只记在本页</button></div></div>';
  }

  function redactionHtml() {
    return pageHead('这份预览', '脱敏对照', '用来核对这页能不能单独外发。交互是从真实后台抽出来的，对象已经换掉。') +
      '<div class="notes"><article class="card"><h2>拿掉了</h2><ul>' +
      '<li>公司、品牌和内部产品名</li><li>人员真名，顶栏只留「示例账号」</li>' +
      '<li>真实内容线、商品、价格和业务编号</li><li>菜单原名、路由、字段编码、接口路径</li>' +
      '<li>能反推规模的精确条数</li><li>原后台的品牌色和截图</li>' +
      '</ul></article><article class="card"><h2>留着的做法</h2><ul>' +
      '<li>基础资料和运营动作分开</li><li>使用中和已下架分开看</li>' +
      '<li>调价、上下架、优惠都按「商品 × 方向」计数</li><li>首页图标和广告素材先写清去向与时间</li>' +
      '<li>提醒可以继续，阻断不能提交</li><li>确认只写在本页内存</li>' +
      '</ul></article></div>';
  }

  var api = {
    analyze: analyze,
    nextPrice: nextPrice,
    catalog: catalog,
    PRESETS: PRESETS,
    reviewShelf: reviewShelf,
    reviewCoupon: reviewCoupon,
    reviewAd: reviewAd,
    reviewEntry: reviewEntry,
    mount: mount
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;

  if (typeof document !== 'undefined') {
    var demoRoot = document.getElementById('demo-root');
    if (demoRoot) mount(demoRoot);
  }
})();
