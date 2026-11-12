import { questionsFor } from './questions.mjs'
import {
  SCORE_DATE,
  EXAM_WHEN,
  RATES,
  TRACKS,
  trackById,
  daysUntil,
  scoreWaitCopy,
  isComplete,
  typicalRates,
  drillAdjustment,
  buildReport,
  verdict
} from './score.mjs'

const KEY = 'zz-before-score-v1'
const SCREENS = ['home', 'setup', 'rate', 'result', 'drill']

const state = {
  screen: 'home',
  trackId: null,
  skill: null,
  rates: {},
  noted: false,
  drill: null
}

const app = document.querySelector('#app')
const live = document.querySelector('#live')

app.addEventListener('click', onClick)
window.addEventListener('popstate', () => {
  const next = guard(hashScreen())
  state.screen = next
  if (next !== 'drill') state.drill = null
  if (`#${next}` !== location.hash) history.replaceState({ screen: next }, '', `#${next}`)
  render({ announce: true })
})

load()
const initial = guard(hashScreen() || state.screen || 'home')
state.screen = initial
history.replaceState({ screen: initial }, '', `#${initial}`)
render()

function hashScreen () {
  const name = location.hash.replace('#', '')
  return SCREENS.includes(name) ? name : ''
}

function guard (screen) {
  const track = currentTrack()
  if ((screen === 'result' || screen === 'drill') && !isComplete(track, state.rates)) return state.trackId ? 'rate' : 'setup'
  if (screen === 'rate' && !track) return 'setup'
  if (screen === 'drill' && !state.drill) return 'result'
  return SCREENS.includes(screen) ? screen : 'home'
}

function currentTrack () {
  return trackById(state.trackId)
}

function currentReport () {
  return buildReport(currentTrack(), state.rates, state.skill)
}

function days () {
  return daysUntil(SCORE_DATE)
}

function load () {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || 'null')
    if (!saved || typeof saved !== 'object') return
    if (trackById(saved.trackId)) state.trackId = saved.trackId
    if (saved.skill === 'valid' || saved.skill === 'retake') state.skill = saved.skill
    if (saved.rates && typeof saved.rates === 'object') state.rates = saved.rates
    state.noted = Boolean(saved.noted)
  } catch {
    localStorage.removeItem(KEY)
  }
}

function save () {
  try {
    localStorage.setItem(KEY, JSON.stringify({
      trackId: state.trackId,
      skill: state.skill,
      rates: state.rates,
      noted: state.noted
    }))
  } catch {
    // 无痕模式写不进去时，这一次仍可继续看区间。
  }
}

function go (screen, { replace = false } = {}) {
  const next = guard(screen)
  state.screen = next
  if (next !== 'drill') state.drill = null
  const url = `#${next}`
  if (replace || location.hash === url) history.replaceState({ screen: next }, '', url)
  else history.pushState({ screen: next }, '', url)
  save()
  render({ announce: true })
}

function onClick (event) {
  const button = event.target.closest('[data-action]')
  if (!button || button.disabled) return
  const action = button.dataset.action
  if (action === 'go') go(button.dataset.screen)
  if (action === 'back') {
    const parent = { setup: 'home', rate: 'setup', result: 'rate', drill: 'result' }
    go(parent[state.screen] || 'home')
  }
  if (action === 'start-over') startOver()
  if (action === 'pick-track') {
    if (state.trackId !== button.dataset.id) {
      state.trackId = button.dataset.id
      state.rates = {}
      state.noted = false
    }
    save()
    render()
  }
  if (action === 'pick-skill') {
    state.skill = button.dataset.skill
    state.noted = false
    save()
    render()
  }
  if (action === 'rate') {
    state.rates = { ...state.rates, [button.dataset.id]: button.dataset.rate }
    state.noted = false
    save()
    render()
  }
  if (action === 'typical') applyTypical()
  if (action === 'note') {
    state.noted = true
    save()
    announce('已留在这台设备上，出分后打开这页还能看到。')
    render()
  }
  if (action === 'start-drill') startDrill()
  if (action === 'pick-option') pickOption(Number(button.dataset.index))
  if (action === 'next-question') nextQuestion()
  if (action === 'apply-adjust') applyAdjust()
}

function startOver () {
  state.trackId = null
  state.skill = null
  state.rates = {}
  state.noted = false
  state.drill = null
  localStorage.removeItem(KEY)
  go('setup')
}

function applyTypical () {
  const track = trackById('zhiye')
  state.trackId = track.id
  state.skill = 'valid'
  state.rates = typicalRates(track)
  state.noted = false
  state.drill = null
  go('result')
}

function startDrill () {
  const report = currentReport()
  if (!report) return
  const questions = questionsFor(report.focus.id)
  if (!questions.length) return
  state.drill = {
    systemId: report.focus.id,
    step: 0,
    chosen: null,
    revealed: false,
    correct: 0,
    done: false
  }
  go('drill')
}

function pickOption (index) {
  const drill = state.drill
  if (!drill || drill.revealed || drill.done) return
  const question = questionsFor(drill.systemId)[drill.step]
  drill.chosen = index
  drill.revealed = true
  if (index === question.answer) drill.correct += 1
  render()
}

function nextQuestion () {
  const drill = state.drill
  if (!drill?.revealed) return
  const questions = questionsFor(drill.systemId)
  if (drill.step >= questions.length - 1) {
    drill.done = true
    render({ announce: true })
    return
  }
  drill.step += 1
  drill.chosen = null
  drill.revealed = false
  render({ announce: true })
}

function applyAdjust () {
  const drill = state.drill
  const report = currentReport()
  if (!drill?.done || !report) return
  const next = drillAdjustment(report.focus.rateKey, drill.correct, questionsFor(drill.systemId).length)
  if (!next) return
  state.rates = { ...state.rates, [drill.systemId]: next }
  state.noted = false
  state.drill = null
  go('result')
}

function render ({ announce: shouldAnnounce = false } = {}) {
  const active = document.activeElement
  const focusKey = active && app.contains(active) ? controlKey(active) : ''
  const previous = app.querySelector('h1')?.textContent
  app.innerHTML = view()
  document.title = {
    home: '出分前 · 昭昭医考',
    setup: '选择考试 · 出分前',
    rate: '按系统回忆 · 出分前',
    result: '手感区间 · 出分前',
    drill: '留下这一块 · 出分前'
  }[state.screen]
  const heading = app.querySelector('h1')
  if (shouldAnnounce && heading && heading.textContent !== previous) {
    heading.tabIndex = -1
    heading.focus()
    window.scrollTo(0, 0)
    announce(`${heading.textContent}。${document.title}`)
    return
  }
  if (focusKey) {
    const match = [...app.querySelectorAll('[data-action]')].find(element => controlKey(element) === focusKey)
    if (match) match.focus()
  }
}

function controlKey (element) {
  return [element.dataset.action, element.dataset.id, element.dataset.rate, element.dataset.skill, element.dataset.screen, element.dataset.index].join('|')
}

function announce (text) {
  live.textContent = ''
  requestAnimationFrame(() => {
    live.textContent = text
  })
}

function view () {
  if (state.screen === 'setup') return shell(viewSetup())
  if (state.screen === 'rate') return shell(viewRate())
  if (state.screen === 'result') return shell(viewResult())
  if (state.screen === 'drill') return shell(viewDrill())
  return shell(viewHome())
}

function shell (body) {
  return `<div class="frame">${body}</div>`
}

function brand () {
  return `<button class="brand" type="button" data-action="go" data-screen="home"><span class="mark" aria-hidden="true">昭</span><span>昭昭医考 · 出分前</span></button>`
}

function backButton () {
  const label = { setup: '返回', rate: '返回', result: '改手感', drill: '回到区间' }[state.screen] || '返回'
  return `<button class="back" type="button" data-action="back">${label}</button>`
}

function viewHome () {
  const track = currentTrack()
  const report = currentReport()
  const wait = scoreWaitCopy(days())
  const resume = track && (state.skill || Object.keys(state.rates).length)
    ? `<button class="btn btn-primary" type="button" data-action="go" data-screen="${report ? 'result' : state.skill ? 'rate' : 'setup'}">继续上次 · ${esc(track.name)}</button>
       <button class="btn btn-ghost" type="button" data-action="start-over">重新开始</button>`
    : `<button class="btn btn-primary" type="button" data-action="go" data-screen="setup">开始估，大约 3 分钟</button>`
  return `
    ${brand()}
    <p class="kicker">${esc(wait)} · 11 月 27 日公布</p>
    <h1>先别在货架里挑。</h1>
    <p class="lead">临床二试已经在 ${esc(EXAM_WHEN)} 考完。这几天最容易做错两件事：去报一场已经结束的面授，或者因为一两科难受，就买下一年里最贵的班。</p>
    <p class="lead">这页只用你还记得的手感，给出一个分数区间，并且最多留下一门对得上的课。出分前可以一门都不买。</p>
    <div class="actions">${resume}</div>
    <button class="sample" type="button" data-action="typical">
      <strong>用「考完很虚」试一次</strong>
      <span>执业，技能仍有效。呼吸和循环基本不会；消化、泌尿、妇产、儿科一半一半；其余大多会做。</span>
    </button>
    ${finePrint()}
  `
}

function viewSetup () {
  const track = currentTrack()
  return `
    ${brand()}
    ${backButton()}
    <h1>你考的是哪一种</h1>
    <p class="lead">及格线都是满分的 60%。执业 360 分，助理 180 分。</p>
    <div class="choices" role="group" aria-label="考试类别">
      ${TRACKS.map(item => `
        <button class="choice" type="button" data-action="pick-track" data-id="${item.id}" aria-pressed="${item.id === state.trackId}">
          <strong>${esc(item.name)}</strong>
          <span>${esc(item.units)} · 满分 ${item.full} · 及格 ${item.pass}</span>
        </button>
      `).join('')}
    </div>
    <h2>实践技能明年还用得上吗</h2>
    <div class="choices" role="group" aria-label="实践技能">
      ${[
        ['valid', '还在有效期内', '笔试如果没过，明年也不必为技能重新买课'],
        ['retake', '明年要重新考技能', '技能和笔试分开看，不绑成一个大班']
      ].map(([id, title, detail]) => `
        <button class="choice" type="button" data-action="pick-skill" data-skill="${id}" aria-pressed="${state.skill === id}">
          <strong>${title}</strong>
          <span>${detail}</span>
        </button>
      `).join('')}
    </div>
    <div class="actions">
      <button class="btn btn-primary" type="button" data-action="go" data-screen="rate" ${track && state.skill ? '' : 'disabled'}>按系统回忆</button>
    </div>
  `
}

function viewRate () {
  const track = currentTrack()
  const done = track.systems.filter(system => RATES[state.rates[system.id]]).length
  const ready = done === track.systems.length
  return `
    ${brand()}
    ${backButton()}
    <h1>${esc(track.name)}</h1>
    <p class="lead">按考完还记得的手感选。含糊按 55% 计，低于及格需要的 60%，所以整场都含糊会落在线下面。</p>
    <ol class="systems">
      ${track.systems.map(system => `
        <li class="system">
          <div class="system-top">
            <span class="system-name">${esc(system.name)}</span>
            <span class="system-weight">按 ${system.weight} 分计</span>
          </div>
          <div class="seg" role="group" aria-label="${esc(system.name)}的手感">
            ${Object.values(RATES).map(rate => `
              <button type="button" data-action="rate" data-id="${system.id}" data-rate="${rate.key}" aria-pressed="${state.rates[system.id] === rate.key}" title="${esc(rate.full)}，按 ${Math.round(rate.value * 100)}% 计">${rate.label}</button>
            `).join('')}
          </div>
        </li>
      `).join('')}
    </ol>
    <div class="dock">
      <p>${done} / ${track.systems.length} 个系统 · 加起来是满分 ${track.full}</p>
      <button class="btn btn-primary" type="button" data-action="go" data-screen="result" ${ready ? '' : 'disabled'}>${ready ? '看手感区间' : '选完才能看区间'}</button>
    </div>
  `
}

function viewResult () {
  const report = currentReport()
  if (!report) return viewRate()
  const wait = scoreWaitCopy(days())
  const zoneLabel = { above: '整段在线上', line: '跨在及格线上', below: '整段在线下' }[report.zone]
  return `
    ${brand()}
    ${backButton()}
    <p class="kicker">${esc(wait)} · ${esc(report.trackName)}</p>
    <h1>手感区间</h1>
    <p class="eyebrow">不是官方成绩 · ${zoneLabel}</p>
    <p class="range" aria-label="估计 ${report.low} 到 ${report.high} 分"><span>${report.low}</span><i>–</i><span>${report.high}</span></p>
    <p class="mid">中点 ${report.estimate} 分 · 及格线 ${report.pass} 分 · 记不清的余地 ±${report.band} 分</p>
    ${meter(report)}
    <p class="verdict">${esc(verdict(report, days()))}</p>
    ${report.product ? productCard(report) : calmCard(report)}
    ${report.skillAddon ? skillCard(report.skillAddon) : ''}
    ${report.skillNote ? `<p class="note">${esc(report.skillNote)}</p>` : ''}
    <section class="pull">
      <h2>哪一块在拉分</h2>
      <p class="section-note">「少拿」是相对「大多会做」少出来的分，不是距离及格线的分。刻度上的标记是 60%。</p>
      <ol class="pull-list">
        ${report.rows.map(row => `
          <li>
            <div class="pull-top">
              <span>${esc(row.name)}</span>
              <span>${esc(RATES[row.rateKey].full)}${row.left > 0 ? ` · 少拿约 ${Math.round(row.left)} 分` : ''}</span>
            </div>
            <div class="mini" aria-hidden="true">
              <span class="mini-fill ${row.rate >= 0.6 ? 'ok' : row.rateKey === 'weak' ? 'bad' : 'mid'}" style="width:${Math.round(row.rate * 100)}%"></span>
              <i style="left:60%"></i>
            </div>
          </li>
        `).join('')}
      </ol>
    </section>
    <details class="formula">
      <summary>区间怎么来的</summary>
      <p>会做按 75%，含糊按 55%，不会按 35%，乘以该系统所占分数后相加，得到中点。上下各留满分的 4%。及格线用的是 2026 年考区公告里的 360 分和 180 分。各系统分数按大纲常见结构拆开，用来比出亏在哪里，不是官方题数。</p>
    </details>
    ${finePrint()}
  `
}

function meter (report) {
  const left = (report.low / report.full) * 100
  const width = ((report.high - report.low) / report.full) * 100
  const pass = (report.pass / report.full) * 100
  return `
    <div class="meter" role="img" aria-label="估计区间 ${report.low} 到 ${report.high} 分，及格线 ${report.pass} 分，满分 ${report.full} 分">
      <div class="meter-track">
        <span class="meter-range ${report.zone}" style="left:${left}%;width:${width}%"></span>
        <span class="meter-pass" style="left:${pass}%"></span>
      </div>
      <div class="meter-caption">
        <span>0</span>
        <span class="pass-label" style="left:${pass}%">及格 ${report.pass}</span>
        <span>${report.full}</span>
      </div>
    </div>
  `
}

function productCard (report) {
  const product = report.product
  const action = state.noted
    ? '<p class="noted">已留在这台设备上。出分后打开这页，还是这一门。</p>'
    : `<button class="btn btn-primary" type="button" data-action="note">${product.hold ? '先记下，出分后再决定' : '就记下这一门'}</button>`
  return `
    <section class="product">
      <p class="eyebrow">${product.hold ? '出分前先别下单' : '只建议这一门'}</p>
      <h2>${esc(product.name)}</h2>
      <p class="price">${product.price} 元 <span>${esc(product.priceNote)}</span></p>
      <p>${esc(product.why)}</p>
      ${action}
      <h3>这次不推荐</h3>
      <ul class="skip">
        ${report.skipped.map(item => `<li><strong>${esc(item.name)}</strong><span>${esc(item.reason)}</span></li>`).join('')}
      </ul>
      <button class="btn btn-secondary" type="button" data-action="start-drill">做两道${esc(report.focus.name)}的演示题</button>
    </section>
  `
}

function calmCard (report) {
  return `
    <section class="calm">
      <h2>不用买笔试课</h2>
      <p>${esc(report.focus.name)}是你手里最没底的一块。把它留下就行，不必为此配一门课。</p>
      <button class="btn btn-primary" type="button" data-action="start-drill">做两道${esc(report.focus.name)}的演示题</button>
    </section>
  `
}

function skillCard (product) {
  return `
    <section class="skill">
      <p class="eyebrow">技能另算</p>
      <h2>${esc(product.name)}</h2>
      <p class="price">${product.price} 元 <span>${esc(product.priceNote)}</span></p>
      <p>${esc(product.why)}</p>
    </section>
  `
}

function viewDrill () {
  const report = currentReport()
  const drill = state.drill
  if (!report || !drill) return viewResult()
  const questions = questionsFor(drill.systemId)
  const system = report.rows.find(row => row.id === drill.systemId) || report.focus
  if (drill.done) return drillDone(system, drill, questions.length)
  const question = questions[drill.step]
  return `
    ${brand()}
    ${backButton()}
    <p class="kicker">${esc(system.name)} · 第 ${drill.step + 1} / ${questions.length} 题</p>
    <h1>演示题，不是真题</h1>
    <p class="stem">${esc(question.stem)}</p>
    <div class="options">
      ${question.options.map((option, index) => {
        const letter = 'ABCD'[index]
        let cls = 'option'
        if (drill.revealed && index === question.answer) cls += ' is-right'
        if (drill.revealed && index === drill.chosen && index !== question.answer) cls += ' is-wrong'
        return `<button class="${cls}" type="button" data-action="pick-option" data-index="${index}" aria-disabled="${drill.revealed}">
          <span class="letter">${letter}</span><span>${esc(option)}</span>
        </button>`
      }).join('')}
    </div>
    ${drill.revealed ? `<p class="why">${drill.chosen === question.answer ? '这道对了。' : '这道不是这个答案。'} ${esc(question.why)}</p>
      <div class="actions"><button class="btn btn-primary" type="button" data-action="next-question">${drill.step === questions.length - 1 ? '看这两道的结果' : '下一题'}</button></div>` : ''}
  `
}

function drillDone (system, drill, total) {
  const next = drillAdjustment(system.rateKey, drill.correct, total)
  const nextLabel = next ? RATES[next].full : ''
  return `
    ${brand()}
    ${backButton()}
    <p class="kicker">${esc(system.name)}</p>
    <h1>${drill.correct} / ${total} 题</h1>
    <p class="lead">${next ? `如果按这个结果，手感可以从「${esc(RATES[system.rateKey].full)}」改成「${esc(nextLabel)}」。区间会跟着重算。` : '这两道还不足以改你的手感。记录留在这台设备上。'}</p>
    <div class="actions">
      ${next ? `<button class="btn btn-primary" type="button" data-action="apply-adjust">改成${esc(nextLabel)}，重看区间</button>` : ''}
      <button class="btn btn-secondary" type="button" data-action="go" data-screen="result">回到区间</button>
    </div>
  `
}

function finePrint () {
  return `<footer class="fine">手感换算，不是国家医学考试中心的成绩。班型名称和价格取自公司现有的临床商品清单与二试活动。这页不能下单。</footer>`
}

function esc (value) {
  return String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[char]))
}
