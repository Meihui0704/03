import { adTypeMeta } from './adEnums'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif']
const MAX_BYTES = 5 * 1024 * 1024

export function timeValue (value) {
  const parsed = Date.parse(String(value || '').replace('T', ' ').replace(/-/g, '/'))
  return Number.isFinite(parsed) ? parsed : 0
}

export function toDatetimeLocal (ms) {
  const date = new Date(ms)
  const pad = n => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function matchesOffRange (stamp, range, customFrom, customTo, now = Date.now()) {
  const value = timeValue(stamp)
  if (!value) return false
  if (range === 'all' || range === 'ALL') return true
  if (range === 'today' || range === 'TODAY') {
    return value >= new Date(new Date(now).toDateString()).getTime()
  }
  if (range === 'custom' || range === 'CUSTOM') {
    const start = timeValue(customFrom)
    let end = timeValue(customTo)
    if (customTo && String(customTo).length <= 10) end += 86400000 - 1
    if (start && value < start) return false
    if (end && value > end) return false
    return true
  }
  const days = range === 'WEEK' ? 7 : range === 'MONTH' ? 30 : Number(range)
  if (!Number.isFinite(days)) return true
  return value >= now - days * 86400000
}

export function rangesOverlap (aStart, aEnd, bStart, bEnd) {
  return timeValue(aStart) <= timeValue(bEnd) && timeValue(bStart) <= timeValue(aEnd)
}

export function inspectImageFile (file) {
  if (!file) return Promise.resolve({ ok: false, level: 'BLOCK', message: '请选择图片' })
  if (!ALLOWED_TYPES.includes(file.type) && !/\.(jpe?g|png|gif)$/i.test(file.name || '')) {
    return Promise.resolve({ ok: false, level: 'BLOCK', message: '只支持 jpg / png / gif / jpeg' })
  }
  if (file.size > MAX_BYTES) {
    return Promise.resolve({ ok: false, level: 'BLOCK', message: '图片不能超过 5MB（演示上限；正式以后台为准）' })
  }
  return new Promise(resolve => {
    const reader = new FileReader()
    reader.onerror = () => resolve({ ok: false, level: 'BLOCK', message: '图片读取失败，请重选' })
    reader.onload = () => {
      const url = reader.result
      const image = new Image()
      image.onload = () => resolve({
        ok: true,
        level: 'PASS',
        url,
        width: image.naturalWidth,
        height: image.naturalHeight,
        size: file.size,
        name: file.name,
        message: `${image.naturalWidth}×${image.naturalHeight}px`
      })
      image.onerror = () => resolve({ ok: false, level: 'BLOCK', message: '无法识别图片尺寸' })
      image.src = url
    }
    reader.readAsDataURL(file)
  })
}

export function checkImageAgainstType (adType, width, height) {
  if (!width || !height) {
    return { ok: false, level: 'BLOCK', message: '尚未读取到图片宽高，请重新上传' }
  }
  const ratio = width / height
  const type = adTypeMeta(adType)
  const sizeText = `${width}×${height}px`
  if (type.shape === 'landscape' && ratio < 1.6) {
    return { ok: false, level: 'BLOCK', message: `当前 ${sizeText} 不是横图，与「${type.label}」不符。请换横图，或改广告形式。正式像素以后台为准。` }
  }
  if (type.shape === 'portrait' && ratio > 1.15) {
    return { ok: false, level: 'BLOCK', message: `当前 ${sizeText} 偏横，与「${type.label}」不符。弹层请用竖图或接近方图。` }
  }
  if (type.shape === 'square' && (ratio < 0.7 || ratio > 1.4)) {
    return { ok: false, level: 'BLOCK', message: `当前 ${sizeText} 与「${type.label}」不符。悬浮图请接近正方形。` }
  }
  if (type.shape === 'portrait-tall' && ratio > 0.75) {
    return { ok: false, level: 'BLOCK', message: `当前 ${sizeText} 不是竖图，与「${type.label}」不符。开屏请用竖图。` }
  }
  return { ok: true, level: 'PASS', message: `${type.label} · ${sizeText} · 演示比例通过，正式尺寸由上传接口最终判定` }
}

export function collectConflicts (rows, candidate, ignoreId) {
  const list = rows.filter(row => row.id !== ignoreId && row.status === 'on' && candidate.status === 'on')
  const blocks = []
  const warns = []
  const type = candidate.adType || '轮播图'
  list.forEach(row => {
    const samePlace = row.app === candidate.app && row.page === candidate.page
      && String(row.project) === String(candidate.project)
      && String(row.profession) === String(candidate.profession)
      && rangesOverlap(row.start, row.end, candidate.start, candidate.end)
    if (!samePlace) return
    if (type === '轮播图' && (row.adType || '轮播图') === '轮播图' && row.position === candidate.position) {
      blocks.push({ id: row.id, name: row.product, reason: `与广告 ID ${row.id} 在同一应用／页面／图位／专业且有效期重叠` })
    }
    if (type === 'App弹层广告' && row.adType === 'App弹层广告') {
      warns.push({ id: row.id, name: row.product, reason: `同一页面已有弹层 ID ${row.id}，同时只建议 1 条使用中` })
    }
  })
  return { blocks, warns }
}

export function validateAd (form, rows, options = {}) {
  const errors = []
  if (!form.project || !form.profession) errors.push('请选择显示项目和专业')
  if (!form.app || !form.page || !form.adType) errors.push('请选择应用、页面和广告形式')
  if (form.adType === '轮播图' && !form.position) errors.push('轮播图必须选择展示顺序')
  if (!form.start || !form.end) errors.push('请填写投放开始和结束时间')
  if (form.end && form.start && form.end <= form.start) errors.push('结束时间必须晚于开始时间')
  if (form.targetType === '商品' && !form.productId) errors.push('请搜索并选定商品 ID，不能手填班型名')
  if ((form.targetType === '页面' || form.targetType === '外部链接') && !form.targetValue) errors.push(`请填写${form.targetType}`)
  if (form.targetType === '外部链接' && form.targetValue && !/^https:\/\//i.test(form.targetValue)) errors.push('外部链接必须以 https:// 开头')
  if (form.status === 'on' && !form.image) errors.push('上架前必须上传图片。可先保存为下架。')
  if (form.image && form.imageWidth && form.imageHeight) {
    const image = checkImageAgainstType(form.adType, form.imageWidth, form.imageHeight)
    if (!image.ok && form.status === 'on') errors.push(image.message)
  }
  const conflicts = collectConflicts(rows, form, options.ignoreId)
  if (form.status === 'on') errors.push(...conflicts.blocks.map(item => item.reason))
  return {
    ok: errors.length === 0,
    errors,
    warns: conflicts.warns,
    blocks: conflicts.blocks
  }
}
