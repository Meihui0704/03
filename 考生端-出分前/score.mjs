// 出分前的换算规则。
// 手感不是官方成绩：会做 75%、含糊 55%、不会 35%。
// 及格线是满分的 60%（执业 360/600，助理 180/300）。
// 上下各留满分的 4%，表示考完记不清的余地。

export const SCORE_DATE = '2026-11-27'
export const EXAM_WHEN = '2026年11月7日—8日'

export const RATES = {
  sure: { key: 'sure', label: '会做', full: '大多会做', value: 0.75 },
  mid: { key: 'mid', label: '含糊', full: '一半一半', value: 0.55 },
  weak: { key: 'weak', label: '不会', full: '基本不会', value: 0.35 }
}

const SYSTEMS = [
  { id: 'resp', name: '呼吸系统' },
  { id: 'circ', name: '循环系统' },
  { id: 'digest', name: '消化系统' },
  { id: 'renal', name: '泌尿系统' },
  { id: 'obgyn', name: '妇产' },
  { id: 'peds', name: '儿科' },
  { id: 'neuro', name: '神经与精神' },
  { id: 'endo', name: '内分泌、血液与感染' },
  { id: 'surg', name: '外科总论' },
  { id: 'prevent', name: '预防与法规' },
  { id: 'other', name: '其他（急诊、中毒、五官、皮肤）' }
]

const ZHIYE_WEIGHTS = [60, 60, 54, 36, 48, 42, 42, 66, 48, 72, 72]
const ZHULI_WEIGHTS = [30, 30, 27, 18, 24, 21, 21, 33, 24, 36, 36]

function withWeights (weights) {
  return SYSTEMS.map((system, index) => ({ ...system, index, weight: weights[index] }))
}

export const TRACKS = [
  {
    id: 'zhiye',
    name: '临床执业医师',
    full: 600,
    pass: 360,
    units: '11月7日—8日，4 个单元',
    systems: withWeights(ZHIYE_WEIGHTS)
  },
  {
    id: 'zhuli',
    name: '临床执业助理医师',
    full: 300,
    pass: 180,
    units: '11月7日，2 个单元',
    systems: withWeights(ZHULI_WEIGHTS)
  }
]

export const TYPICAL = {
  trackId: 'zhiye',
  skill: 'valid',
  weak: ['resp', 'circ'],
  mid: ['digest', 'renal', 'obgyn', 'peds']
}

const PINPOINT = {
  zhiye: {
    kind: 'pinpoint',
    name: '2026全系统临床执业重难点深度解析',
    price: 99,
    priceNote: '商品清单标价',
    why: '亏分集中在少数系统。这一门按系统讲重难点，对得上这件事。清单里它仍叫 2026 学年，不是一场已经结束的面授。'
  },
  zhuli: {
    kind: 'pinpoint',
    name: '2026全系统临床助理重难点深度解析',
    price: 99,
    priceNote: '商品清单标价',
    why: '亏分集中在少数系统。这一门按系统讲重难点，对得上这件事。清单里它仍叫 2026 学年，不是一场已经结束的面授。'
  }
}

const FOUNDATION = {
  kind: 'foundation',
  name: '2027全程精讲班（券后价）',
  price: 2300,
  priceNote: '清单中的券后价',
  why: '多个系统都低于及格需要的正确率，下一步是把基础重新铺开。这门是清单里执业和助理都能上的 2027 全程精讲。'
}

const SKILL_PRODUCT = {
  kind: 'skill',
  name: '2027技能3D仿真模拟训练',
  price: 159,
  priceNote: '商品清单标价',
  why: '你选了明年要重考实践技能。技能考试在明年，不跟这几天的出分绑在一起。'
}

export function trackById (id) {
  return TRACKS.find(track => track.id === id) || null
}

export function daysUntil (targetISODate, now = new Date()) {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
  const today = fmt.format(now)
  const start = Date.parse(`${today}T00:00:00+08:00`)
  const end = Date.parse(`${targetISODate}T00:00:00+08:00`)
  return Math.round((end - start) / 86400000)
}

export function scoreWaitCopy (days) {
  if (days > 1) return `还有 ${days} 天出分`
  if (days === 1) return '明天出分'
  if (days === 0) return '今天出分'
  return '成绩已于 11 月 27 日公布'
}

export function isComplete (track, rates) {
  return Boolean(track) && track.systems.every(system => RATES[rates?.[system.id]])
}

export function typicalRates (track) {
  const rates = {}
  track.systems.forEach(system => {
    if (TYPICAL.weak.includes(system.id)) rates[system.id] = 'weak'
    else if (TYPICAL.mid.includes(system.id)) rates[system.id] = 'mid'
    else rates[system.id] = 'sure'
  })
  return rates
}

export function drillAdjustment (rateKey, correct, total) {
  if (total <= 0) return null
  if (correct === total && rateKey === 'weak') return 'mid'
  if (correct === total && rateKey === 'mid') return 'sure'
  if (correct === 0 && rateKey === 'sure') return 'mid'
  if (correct === 0 && rateKey === 'mid') return 'weak'
  return null
}

function bandFor (full) {
  return Math.round(full * 0.04)
}

function notThese (track, kind) {
  const camp = {
    name: '2026二试五天四夜密训面授营',
    reason: '这场考试已经结束'
  }
  if (kind === 'pinpoint') {
    return [
      camp,
      { name: '2027全程精讲班', reason: '还没到要把所有系统重新学一遍的程度' }
    ]
  }
  if (kind === 'foundation') {
    return [
      camp,
      track.id === 'zhuli'
        ? { name: '2026二试九天七夜密训面授营', reason: '天数更长，改变不了考试已经结束' }
        : { name: '2026昭师尊享B班（技能免考）', reason: '贵在全程陪跑，对不上补基础这件事' }
    ]
  }
  return []
}

function skillNote (zone, skill) {
  if (skill !== 'retake' || zone === 'below') return ''
  return '你选了明年要重考技能。笔试这边先别下单，出分后再看技能课就行。'
}

export function buildReport (track, rates, skill) {
  if (!isComplete(track, rates)) return null
  if (skill !== 'valid' && skill !== 'retake') return null

  const rows = track.systems.map(system => {
    const rateKey = rates[system.id]
    const rate = RATES[rateKey].value
    return {
      ...system,
      rateKey,
      rate,
      left: system.weight * (RATES.sure.value - rate)
    }
  })

  const raw = rows.reduce((sum, row) => sum + row.weight * row.rate, 0)
  const estimate = Math.round(raw)
  const band = bandFor(track.full)
  const low = Math.max(0, estimate - band)
  const high = Math.min(track.full, estimate + band)
  let zone = 'line'
  if (estimate - band >= track.pass) zone = 'above'
  else if (estimate + band < track.pass) zone = 'below'

  const ranked = [...rows].sort((a, b) => b.left - a.left || a.index - b.index)
  const focus = ranked[0]
  const weakRows = rows.filter(row => row.rateKey === 'weak')
  const totalLeft = rows.reduce((sum, row) => sum + row.left, 0)
  const top2 = ranked[0].left + ranked[1].left
  const narrow = weakRows.length <= 2 || (weakRows.length <= 3 && totalLeft > 0 && top2 / totalLeft >= 0.55)

  let product = null
  if (zone !== 'above') product = narrow ? { ...PINPOINT[track.id] } : { ...FOUNDATION }
  if (product) product.hold = zone === 'line'

  return {
    trackId: track.id,
    trackName: track.name,
    full: track.full,
    pass: track.pass,
    estimate,
    band,
    low,
    high,
    zone,
    rows: ranked,
    focus,
    narrow,
    product,
    skipped: product ? notThese(track, product.kind) : [],
    skillAddon: zone === 'below' && skill === 'retake' ? { ...SKILL_PRODUCT } : null,
    skillNote: skillNote(zone, skill)
  }
}

export function verdict (report, days) {
  if (report.zone === 'above') {
    return days >= 0
      ? '区间整段在及格线以上。个别系统没底，不等于这场没过。出分前不用买笔试课。'
      : '按这份手感，区间在及格线以上。拿它和正式分数对一下即可。'
  }
  if (report.zone === 'line') {
    return days >= 0
      ? '区间跨在及格线上，现在下结论太早。先把对得上的那一门记下，11 月 27 日如果没过再买。'
      : '这份手感跨在及格线上。正式分过了就不用买；没过再看下面这一门。'
  }
  return days >= 0
    ? '区间整段在及格线下面。二试面授已经结束，现在也只建议这一门，而不是货架上更贵的班。'
    : '按这份手感，区间在及格线下面。正式分如果没过，下面这一门是对得上的起点。'
}
