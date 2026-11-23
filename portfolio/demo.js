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
    { id: 'catalog', group: '运营动作', label: '商品清单' },
    { id: 'price', group: '运营动作', label: '批量调价' },
    { id: 'redaction', group: '这份预览', label: '脱敏对照' }
  ];

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
      log: [],
      status: '先看内容线，再去商品清单或批量调价。'
    };
    PRODUCTS.forEach(function (product) { state.prices[product.id] = product.price; });

    root.innerHTML = appHtml();
    var main = root.querySelector('main');
    var dialog = root.querySelector('#confirm-dialog');

    function productsNow() {
      return PRODUCTS.map(function (product) {
        return {
          id: product.id,
          name: product.name,
          lineId: product.lineId,
          price: state.prices[product.id],
          covers: product.covers.slice()
        };
      });
    }

    function currentInput() {
      return {
        lines: LINES,
        products: productsNow(),
        subjects: SUBJECTS,
        selectedProductIds: Array.from(state.selectedProductIds),
        selectedSubjectIds: Array.from(state.selectedSubjectIds),
        adjustment: { mode: state.mode, value: state.value },
        effectiveAt: state.effectiveAt
      };
    }

    function go(page) {
      state.page = page;
      render();
    }

    function render() {
      root.querySelectorAll('[data-page]').forEach(function (button) {
        if (button.getAttribute('data-page') === state.page) button.setAttribute('aria-current', 'page');
        else button.removeAttribute('aria-current');
      });
      if (state.page === 'lines') main.innerHTML = linesHtml();
      else if (state.page === 'catalog') main.innerHTML = catalogHtml();
      else if (state.page === 'redaction') main.innerHTML = redactionHtml();
      else main.innerHTML = priceHtml();
      bindPage();
    }

    function linesHtml() {
      var rows = [];
      DIRECTORY.forEach(function (line) {
        var showLine = state.shelf === 'all' || line.status === state.shelf;
        var subjects = line.subjects.filter(function (subject) {
          return state.shelf === 'all' || subject.status === state.shelf;
        });
        if (!showLine && subjects.length === 0) return;
        if (showLine) rows.push(rowHtml(line.name, '内容线', '—', line.status, false));
        subjects.forEach(function (subject) {
          rows.push(rowHtml(subject.name, '方向', line.name, subject.status, true));
        });
      });
      return pageHead('内容线与方向', '日常列表默认只看使用中。已下架单独打开，不混回主列表。名称是虚构的，编号不在这页出现。') +
        shelfSwitch(state.shelf) +
        '<div class="table-wrap"><table><thead><tr><th>名称</th><th>类型</th><th>所属内容线</th><th>状态</th></tr></thead><tbody>' +
        (rows.join('') || '<tr><td colspan="4">这一栏是空的。</td></tr>') +
        '</tbody></table></div>';
    }

    function catalogHtml() {
      var body = productsNow().map(function (product) {
        var checked = state.carryIds.has(product.id) ? ' checked' : '';
        return '<tr><td><label><input type="checkbox" name="carry-product" value="' + esc(product.id) + '"' + checked + '> ' +
          esc(product.name) + '</label></td><td>' + esc(lineName(LINES, product.lineId)) + '</td><td>' +
          esc(coversLabel(product)) + '</td><td class="money">' + money(product.price) + '</td></tr>';
      }).join('');
      return pageHead('商品清单', '勾选后带到批量调价。一个商品只覆盖一部分方向，勾上不等于每个方向都会改。') +
        '<div class="toolbar"><p class="quiet" id="carry-status">价格是整数示意，不是真实售价。</p>' +
        '<button type="button" class="primary" id="carry">带到批量调价</button></div>' +
        '<div class="table-wrap"><table><thead><tr><th>商品</th><th>内容线</th><th>覆盖方向</th><th>现价</th></tr></thead><tbody>' +
        body + '</tbody></table></div>';
    }

    function priceHtml() {
      return pageHead('批量调价', '数字一次填好。确认之前，先看见真正会改价的「商品 × 方向」。') +
        '<div class="presets" role="group" aria-label="三个示例">' +
          presetButton('clean') + presetButton('mismatch') + presetButton('zero') +
        '</div>' +
        '<ol class="steps">' + stepButton(0, '1 调价方式', state.step) + stepButton(1, '2 商品', state.step) + stepButton(2, '3 方向', state.step) + stepButton(3, '4 确认', state.step) + '</ol>' +
        '<div class="workspace"><div class="panel" data-role="form">' + stepBody() +
          '<div class="actions"><button type="button" class="ghost" id="step-back">上一步</button>' +
          '<button type="button" class="primary" id="step-next">下一步</button>' +
          '<button type="button" class="primary" id="open-confirm">打开确认</button></div>' +
          '<p id="demo-status" role="status">' + esc(state.status) + '</p></div>' +
          '<aside class="impact" id="impact" aria-label="影响预览"></aside></div>';
    }

    function stepBody() {
      if (state.step === 0) {
        return '<fieldset class="field"><legend>怎么改</legend>' +
          '<div class="modes" role="radiogroup" aria-label="调价方式">' +
            '<label><input type="radio" name="adj-mode" value="percent"' + (state.mode === 'percent' ? ' checked' : '') + '> 按比例下调</label>' +
            '<label><input type="radio" name="adj-mode" value="reduce"' + (state.mode === 'reduce' ? ' checked' : '') + '> 按金额减免</label>' +
            '<label><input type="radio" name="adj-mode" value="fixed"' + (state.mode === 'fixed' ? ' checked' : '') + '> 统一售价</label>' +
          '</div>' +
          '<div class="stack-fields">' +
            '<label>数字<input id="adj-value" type="number" inputmode="decimal" step="1" value="' + esc(state.value) + '"></label>' +
            '<label>生效时间<input id="eff-at" type="datetime-local" value="' + esc(state.effectiveAt) + '"></label>' +
          '</div><p class="hint" id="value-hint"></p></fieldset>';
      }
      if (state.step === 1) return '<fieldset class="field"><legend>商品</legend>' + grouped('product') + '</fieldset>';
      if (state.step === 2) return '<fieldset class="field"><legend>方向</legend>' + grouped('subject') + '</fieldset>';
      return '<fieldset class="field"><legend>确认前再看一遍</legend><p class="quiet">右侧列出实际生效的组合。有阻断时，确认框不会打开。</p></fieldset>';
    }

    function bindPage() {
      root.querySelectorAll('[data-shelf]').forEach(function (button) {
        button.addEventListener('click', function () {
          state.shelf = button.getAttribute('data-shelf');
          render();
        });
      });
      var carry = root.querySelector('#carry');
      if (carry) {
        main.querySelectorAll('input[name="carry-product"]').forEach(function (input) {
          input.addEventListener('change', function () {
            if (input.checked) state.carryIds.add(input.value);
            else state.carryIds.delete(input.value);
          });
        });
        carry.addEventListener('click', function () {
          if (state.carryIds.size === 0) {
            var note = main.querySelector('#carry-status');
            if (note) note.textContent = '先勾选至少一个商品，再带到批量调价。';
            return;
          }
          state.selectedProductIds = new Set(state.carryIds);
          state.page = 'price';
          state.step = 2;
          state.preset = null;
          state.status = '商品已从清单带入。接着选方向。';
          render();
        });
      }
      if (state.page !== 'price') return;
      bindPrice();
    }

    function bindPrice() {
      var form = main.querySelector('[data-role="form"]');
      var impact = main.querySelector('#impact');
      var statusNode = main.querySelector('#demo-status');
      syncForm(form);
      refresh();

      main.querySelectorAll('[data-preset]').forEach(function (button) {
        button.addEventListener('click', function () { applyPreset(button.getAttribute('data-preset')); });
      });
      main.querySelectorAll('[data-step]').forEach(function (button) {
        button.addEventListener('click', function () {
          state.step = Number(button.getAttribute('data-step'));
          render();
        });
      });
      form.addEventListener('change', function (event) {
        var target = event.target;
        if (target.name === 'product' || target.name === 'subject') {
          var bag = target.name === 'product' ? state.selectedProductIds : state.selectedSubjectIds;
          if (target.checked) bag.add(target.value);
          else bag.delete(target.value);
          state.preset = null;
          state.status = '选择已改。右侧按覆盖范围重算组合。';
          refresh();
        }
        if (target.name === 'adj-mode') {
          state.mode = target.value;
          state.preset = null;
          state.status = '调价方式已改。';
          refresh();
        }
      });
      var valueInput = form.querySelector('#adj-value');
      var whenInput = form.querySelector('#eff-at');
      if (valueInput) {
        valueInput.addEventListener('input', function (event) {
          state.value = event.target.value;
          state.preset = null;
          state.status = '数字已改。';
          refresh();
        });
      }
      if (whenInput) {
        whenInput.addEventListener('input', function (event) {
          state.effectiveAt = event.target.value;
          state.preset = null;
          state.status = '生效时间已改。';
          refresh();
        });
      }
      main.querySelector('#step-back').addEventListener('click', function () {
        state.step = Math.max(0, state.step - 1);
        render();
      });
      main.querySelector('#step-next').addEventListener('click', function () {
        state.step = Math.min(3, state.step + 1);
        render();
      });
      main.querySelector('#open-confirm').addEventListener('click', function () {
        var result = refresh();
        if (!result.canConfirm) {
          state.status = '还有必须先处理的问题，确认框不会打开。';
          statusNode.textContent = state.status;
          var blockList = impact.querySelector('#block-list');
          if (blockList) blockList.focus();
          return;
        }
        openDialog(result);
      });

      function syncForm(scope) {
        scope.querySelectorAll('input[name="product"]').forEach(function (input) {
          input.checked = state.selectedProductIds.has(input.value);
        });
        scope.querySelectorAll('input[name="subject"]').forEach(function (input) {
          input.checked = state.selectedSubjectIds.has(input.value);
        });
        scope.querySelectorAll('[data-preset]').forEach(function (button) {
          var on = button.getAttribute('data-preset') === state.preset;
          button.setAttribute('aria-pressed', on ? 'true' : 'false');
          button.classList.toggle('is-on', on);
        });
      }

      function refresh() {
        var result = analyze(currentInput());
        impact.innerHTML = impactHtml(result, state.log);
        main.querySelectorAll('[data-price-for]').forEach(function (node) {
          node.textContent = '现价 ' + money(state.prices[node.getAttribute('data-price-for')]);
        });
        statusNode.textContent = state.status;
        var hint = main.querySelector('#value-hint');
        if (hint && state.mode === 'percent') hint.textContent = '例如 20 表示下调 20%。大于或等于 100 不能提交。实际降幅达到 40% 会提醒。';
        if (hint && state.mode === 'reduce') hint.textContent = '从现价减去这个金额。结果小于或等于 0 不能提交。降幅达到 40% 会提醒。';
        if (hint && state.mode === 'fixed') hint.textContent = '把覆盖到的组合改成这个售价。高于现价会提醒这是涨价；小于或等于 0 不能提交。';
        var next = main.querySelector('#step-next');
        var back = main.querySelector('#step-back');
        var confirm = main.querySelector('#open-confirm');
        if (back) back.hidden = state.step === 0;
        if (next) next.hidden = state.step === 3;
        if (confirm) confirm.hidden = state.step !== 3;
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

      function openDialog(result) {
        dialog.innerHTML = dialogHtml(result);
        if (typeof dialog.showModal === 'function') dialog.showModal();
        else dialog.setAttribute('open', '');
        dialog.querySelector('#dialog-cancel').addEventListener('click', function () { dialog.close(); });
        dialog.querySelector('#dialog-accept').addEventListener('click', function () {
          var latest = analyze(currentInput());
          if (!latest.canConfirm) {
            dialog.close();
            state.status = '规则已经变了，确认框已关闭，没有写入。';
            render();
            return;
          }
          var names = [];
          latest.validCombos.forEach(function (combo) {
            state.prices[combo.productId] = combo.nextPrice;
            if (names.indexOf(combo.productName) === -1) names.push(combo.productName);
          });
          var skipped = latest.mismatchedSubjects.map(function (item) { return item.name; }).join('、');
          var entry = '批量调价「' + names.join('、') + '」，' + describeAdjustment(currentInput().adjustment) +
            '，生效时间 ' + formatWhen(state.effectiveAt) + '，覆盖 ' + latest.counts.valid + ' 个「商品 × 方向」组合。';
          if (skipped) entry += '已跳过不适用的方向：' + skipped + '。';
          entry += '没有写入真实后台。';
          state.log.unshift({ at: '刚刚', text: entry });
          state.status = '已记在本页的操作记录里。没有写入真实后台。';
          dialog.close();
          render();
        });
        dialog.querySelector('#dialog-accept').focus();
      }
    }

    root.querySelector('.nav').addEventListener('click', function (event) {
      var button = event.target.closest('[data-page]');
      if (!button) return;
      go(button.getAttribute('data-page'));
    });

    main.addEventListener('click', function (event) {
      if (!event.target.closest('[data-action="clear-mismatch"]')) return;
      analyze(currentInput()).mismatchedSubjects.forEach(function (item) {
        state.selectedSubjectIds.delete(item.id);
      });
      state.preset = null;
      state.status = '已去掉不适用的方向。';
      render();
    });

    render();
  }

  function appHtml() {
    var groups = [];
    PAGES.forEach(function (page) {
      if (groups.indexOf(page.group) === -1) groups.push(page.group);
    });
    var nav = groups.map(function (group) {
      var buttons = PAGES.filter(function (page) { return page.group === group; }).map(function (page) {
        return '<button type="button" data-page="' + page.id + '">' + esc(page.label) + '</button>';
      }).join('');
      return '<p>' + esc(group) + '</p>' + buttons;
    }).join('');
    return '<div class="app"><header class="topbar"><strong>批量运营工作台</strong>' +
      '<span class="pill">脱敏预览 · 示意数据</span><span class="who">当前操作人：示例账号</span></header>' +
      '<p class="banner">这是从真实后台抽出来的交互，目录、价格、人员和内部名称都已换掉。刷新后记录清空，没有连接任何后台。</p>' +
      '<div class="body"><nav class="nav" aria-label="工作台">' + nav +
      '<p class="foot">只保留流程和校验。真实台账不在这里。</p></nav><main class="main"></main></div>' +
      '<dialog id="confirm-dialog" aria-labelledby="confirm-title"></dialog></div>';
  }

  function pageHead(title, text) {
    return '<header class="page-head"><h1>' + esc(title) + '</h1><p>' + esc(text) + '</p></header>';
  }

  function shelfSwitch(current) {
    return '<div class="seg" role="group" aria-label="状态">' +
      shelfButton('on', '使用中', current) + shelfButton('off', '已下架', current) + shelfButton('all', '全部', current) + '</div>';
  }

  function shelfButton(id, label, current) {
    return '<button type="button" data-shelf="' + id + '" aria-pressed="' + (id === current ? 'true' : 'false') + '">' + label + '</button>';
  }

  function rowHtml(name, kind, parent, status, child) {
    var label = status === 'on' ? '使用中' : '已下架';
    return '<tr class="' + (child ? 'child' : 'parent') + '"><td>' + esc(name) + '</td><td>' + esc(kind) +
      '</td><td>' + esc(parent) + '</td><td><span class="tag ' + (status === 'on' ? 'on' : 'off') + '">' + label + '</span></td></tr>';
  }

  function stepButton(index, label, currentStep) {
    var current = index === currentStep ? ' aria-current="step"' : '';
    return '<li><button type="button" data-step="' + index + '"' + current + '>' + label + '</button></li>';
  }

  function redactionHtml() {
    return pageHead('脱敏对照', '用来核对这页能不能单独外发。左边是拿掉的，右边是留下来给你看的。') +
      '<div class="notes"><article><h2>拿掉了</h2><ul>' +
        '<li>公司、品牌和内部产品名</li>' +
        '<li>人员真名，顶栏只留「示例账号」</li>' +
        '<li>真实内容线、商品、价格和业务编号</li>' +
        '<li>菜单原名、路由、字段编码、接口路径</li>' +
        '<li>能反推规模的精确条数</li>' +
        '<li>原后台的品牌色和截图</li>' +
      '</ul></article><article><h2>留着的做法</h2><ul>' +
        '<li>基础资料和运营动作分开</li>' +
        '<li>使用中和已下架分开看</li>' +
        '<li>商品只覆盖一部分方向</li>' +
        '<li>确认前按「商品 × 方向」计数</li>' +
        '<li>提醒可以继续，阻断不能提交</li>' +
        '<li>确认只写在本页内存</li>' +
      '</ul></article></div>';
  }

  function presetButton(key) {
    var preset = PRESETS[key];
    return '<button type="button" class="preset" data-preset="' + preset.id + '" aria-pressed="false">' +
      '<strong>示例 · ' + esc(preset.label) + '</strong><small>' + esc(preset.blurb) + '</small></button>';
  }

  function grouped(kind) {
    return LINES.map(function (line) {
      var items = (kind === 'product' ? PRODUCTS : SUBJECTS).filter(function (item) {
        return item.lineId === line.id;
      });
      var choices = items.map(function (item) {
        if (kind === 'product') {
          return '<label class="choice"><input type="checkbox" name="product" value="' + esc(item.id) + '">' +
            '<span><strong>' + esc(item.name) + '</strong>' +
            '<small data-price-for="' + esc(item.id) + '">现价 ' + money(item.price) + '</small>' +
            '<small>覆盖 ' + esc(coversLabel(item)) + '</small></span></label>';
        }
        return '<label class="choice"><input type="checkbox" name="subject" value="' + esc(item.id) + '">' +
          '<span><strong>' + esc(item.name) + '</strong></span></label>';
      }).join('');
      return '<div class="line-group"><p class="line-name">' + esc(line.name) + '</p><div class="choices">' + choices + '</div></div>';
    }).join('');
  }

  function impactHtml(result, log) {
    var combos = result.validCombos.length
      ? '<ul class="combo-list">' + result.validCombos.map(function (combo) {
          var cls = 'combo';
          if (Number.isFinite(combo.nextPrice) && combo.nextPrice <= 0) cls += ' is-bad';
          else if (combo.dropRatio !== null && combo.dropRatio >= 0.4) cls += ' is-steep';
          return '<li class="' + cls + '"><span>' + esc(combo.productName) + ' × ' + esc(combo.subjectName) +
            '</span><span class="money">' + money(combo.basePrice) + ' → ' + money(combo.nextPrice) + '</span></li>';
        }).join('') + '</ul>'
      : '<p class="quiet">当前没有会生效的组合。</p>';
    var clearNames = result.mismatchedSubjects.map(function (item) { return item.name; }).join('、');
    var warnings = result.warnings.length
      ? '<ul class="flag-list">' + result.warnings.map(function (item) {
          return '<li class="flag warn">' + esc(item.message) + '</li>';
        }).join('') + '</ul>' +
        (clearNames
          ? '<button type="button" class="ghost" data-action="clear-mismatch">去掉不适用的方向：' + esc(clearNames) + '</button>'
          : '')
      : '<p class="quiet">没有提醒。</p>';
    var blocks = result.blocks.length
      ? '<ul class="flag-list" id="block-list" tabindex="-1">' + result.blocks.map(function (item) {
          return '<li class="flag block">' + esc(item.message) + '</li>';
        }).join('') + '</ul>'
      : '<p class="quiet">没有阻断。到第 4 步可以打开确认。</p>';
    var logHtml = log.length
      ? '<ol class="log-list" id="op-log">' + log.map(function (item) {
          return '<li><time>' + esc(item.at) + '</time><p>' + esc(item.text) + '</p></li>';
        }).join('') + '</ol>'
      : '<p class="quiet" id="op-log">还没有确认过。确认后只留在这个页面的内存里。</p>';
    return '<h2>这次会改到哪里</h2>' +
      '<p class="count-line">已选 <b>' + result.counts.products + '</b> 个商品、<b>' + result.counts.subjects +
      '</b> 个方向，实际生效 <b>' + result.counts.valid + '</b> 个组合。</p>' +
      combos +
      '<div class="flag-block"><h3>提醒 · 可以继续</h3>' + warnings + '</div>' +
      '<div class="flag-block"><h3>阻断 · 不能提交</h3>' + blocks + '</div>' +
      '<div class="flag-block"><h3>本页记录</h3>' + logHtml + '</div>';
  }

  function dialogHtml(result) {
    var rows = result.validCombos.map(function (combo) {
      return '<li class="combo"><span>' + esc(combo.productName) + ' × ' + esc(combo.subjectName) +
        '</span><span class="money">' + money(combo.basePrice) + ' → ' + money(combo.nextPrice) + '</span></li>';
    }).join('');
    var extra = result.mismatchedSubjects.length
      ? '<p>不适用、不会改的方向：' + esc(result.mismatchedSubjects.map(function (item) { return item.name; }).join('、')) + '。</p>'
      : '';
    return '<div class="dialog"><h3 id="confirm-title">确认这次调价？</h3>' +
      '<p>将改 <b>' + result.counts.valid + '</b> 个「商品 × 方向」组合。按下确认后，只写进本页内存。</p>' +
      extra +
      '<ul class="dialog-list">' + rows + '</ul>' +
      '<p>没有连接真实后台。刷新后，这次记录会消失。</p>' +
      '<div class="actions">' +
        '<button type="button" class="ghost" id="dialog-cancel">返回修改</button>' +
        '<button type="button" class="primary" id="dialog-accept">确认，只记在本页</button>' +
      '</div></div>';
  }

  var api = {
    analyze: analyze,
    nextPrice: nextPrice,
    catalog: catalog,
    PRESETS: PRESETS,
    mount: mount
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;

  if (typeof document !== 'undefined') {
    var demoRoot = document.getElementById('demo-root');
    if (demoRoot) mount(demoRoot);
  }
})();
