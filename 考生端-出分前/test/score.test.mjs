import assert from 'node:assert/strict'
import test from 'node:test'
import { questionsFor } from '../questions.mjs'
import {
  TRACKS,
  RATES,
  SCORE_DATE,
  TYPICAL,
  trackById,
  daysUntil,
  scoreWaitCopy,
  isComplete,
  typicalRates,
  drillAdjustment,
  buildReport,
  verdict
} from '../score.mjs'

test('系统权重加总等于满分', () => {
  for (const track of TRACKS) {
    const sum = track.systems.reduce((total, system) => total + system.weight, 0)
    assert.equal(sum, track.full)
    assert.equal(track.pass / track.full, 0.6)
    assert.equal(new Set(track.systems.map(system => system.id)).size, track.systems.length)
  }
})

test('上海时区的出分倒计时', () => {
  assert.equal(daysUntil(SCORE_DATE, new Date('2026-11-12T02:00:00Z')), 15)
  assert.equal(daysUntil(SCORE_DATE, new Date('2026-11-11T16:00:00Z')), 15)
  assert.equal(daysUntil(SCORE_DATE, new Date('2026-11-11T15:30:00Z')), 16)
  assert.equal(daysUntil(SCORE_DATE, new Date('2026-11-26T15:00:00Z')), 1)
  assert.equal(daysUntil(SCORE_DATE, new Date('2026-11-26T16:00:00Z')), 0)
  assert.equal(daysUntil(SCORE_DATE, new Date('2026-11-27T02:00:00Z')), 0)
  assert.equal(daysUntil(SCORE_DATE, new Date('2026-11-28T02:00:00Z')), -1)
  assert.equal(scoreWaitCopy(15), '还有 15 天出分')
  assert.equal(scoreWaitCopy(1), '明天出分')
  assert.equal(scoreWaitCopy(0), '今天出分')
  assert.match(scoreWaitCopy(-1), /已于/)
})

test('考完很虚：区间跨在及格线上，只留下 99 元这一门', () => {
  for (const track of TRACKS) {
    const report = buildReport(track, typicalRates(track), 'valid')
    assert.equal(report.zone, 'line')
    assert.equal(report.product.kind, 'pinpoint')
    assert.equal(report.product.price, 99)
    assert.equal(report.product.hold, true)
    assert.equal(report.skillAddon, null)
    assert.equal(report.focus.id, 'resp')
    assert.ok(report.low < track.pass && report.high >= track.pass)
    assert.match(verdict(report, 15), /跨在及格线/)
    assert.ok(report.skipped.some(item => item.name.includes('面授营')))
    assert.ok(report.skipped.some(item => item.name.includes('全程精讲')))
  }
  const zhiye = buildReport(trackById('zhiye'), typicalRates(trackById('zhiye')), 'valid')
  assert.equal(zhiye.estimate, 366)
  assert.equal(zhiye.low, 342)
  assert.equal(zhiye.high, 390)
  assert.equal(zhiye.product.name, '2026全系统临床执业重难点深度解析')
})

test('只会两科不会、其余都会：仍在线上，不卖课', () => {
  const track = trackById('zhiye')
  const rates = {}
  track.systems.forEach(system => {
    rates[system.id] = TYPICAL.weak.includes(system.id) ? 'weak' : 'sure'
  })
  const report = buildReport(track, rates, 'retake')
  assert.equal(report.zone, 'above')
  assert.equal(report.product, null)
  assert.equal(report.skillAddon, null)
  assert.match(report.skillNote, /先别下单/)
  assert.match(verdict(report, 15), /不用买笔试课/)
})

test('整场都不会：建议全程精讲，技能要重考才附带 3D', () => {
  const track = trackById('zhiye')
  const rates = Object.fromEntries(track.systems.map(system => [system.id, 'weak']))
  const held = buildReport(track, rates, 'valid')
  assert.equal(held.zone, 'below')
  assert.equal(held.estimate, 210)
  assert.equal(held.product.kind, 'foundation')
  assert.equal(held.product.hold, false)
  assert.equal(held.product.price, 2300)
  assert.equal(held.skillAddon, null)
  assert.ok(held.skipped.some(item => item.name.includes('尊享')))

  const retake = buildReport(track, rates, 'retake')
  assert.equal(retake.skillAddon.name, '2027技能3D仿真模拟训练')
  assert.equal(retake.skillAddon.price, 159)
  assert.equal(retake.skillNote, '')
})

test('助理整场含糊会落到 180 分下面', () => {
  const track = trackById('zhuli')
  const rates = Object.fromEntries(track.systems.map(system => [system.id, 'mid']))
  const report = buildReport(track, rates, 'valid')
  assert.equal(report.estimate, 165)
  assert.equal(report.zone, 'below')
  assert.ok(report.high < track.pass)
})

test('没选完不算区间', () => {
  const track = trackById('zhiye')
  assert.equal(isComplete(track, { resp: 'sure' }), false)
  assert.equal(buildReport(track, { resp: 'sure' }, 'valid'), null)
  assert.equal(buildReport(track, typicalRates(track), 'later'), null)
  assert.equal(RATES.mid.value < 0.6 && RATES.sure.value > 0.6, true)
})

test('两道演示题可以改一档手感', () => {
  assert.equal(drillAdjustment('weak', 2, 2), 'mid')
  assert.equal(drillAdjustment('mid', 2, 2), 'sure')
  assert.equal(drillAdjustment('sure', 0, 2), 'mid')
  assert.equal(drillAdjustment('mid', 0, 2), 'weak')
  assert.equal(drillAdjustment('weak', 1, 2), null)
  assert.equal(drillAdjustment('sure', 2, 2), null)
})

test('每个系统都有两道四选一', () => {
  for (const system of trackById('zhiye').systems) {
    const questions = questionsFor(system.id)
    assert.equal(questions.length, 2)
    for (const question of questions) {
      assert.equal(question.options.length, 4)
      assert.ok(question.answer >= 0 && question.answer < 4)
      assert.ok(question.stem.length > 8)
      assert.ok(question.why.length > 8)
    }
  }
  assert.equal(questionsFor('missing').length, 0)
})
