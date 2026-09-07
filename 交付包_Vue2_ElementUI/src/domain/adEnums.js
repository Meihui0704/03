/** 与《运营配置助手_技术对接说明》对齐的展示名 ↔ 建议编码。正式 code 以后台字典为准，前端不擅自发明新值。 */
export const AD_TYPE_OPTIONS = [
  { label: '轮播图', value: '轮播图', code: 'BANNER', shape: 'landscape', help: '横图。可设置图1—图5顺序。演示按横图比例校验，正式像素由上传接口返回。' },
  { label: '弹层', value: 'App弹层广告', code: 'POPUP', shape: 'portrait', help: '弹窗图。同一页面同时只建议 1 条使用中。演示按竖图／方图校验。' },
  { label: '悬浮', value: 'App悬浮广告', code: 'FLOATING', shape: 'square', help: '小尺寸悬浮图，避开主要操作区。演示按接近正方形校验。' },
  { label: '开屏', value: 'App开屏广告', code: 'SPLASH', shape: 'portrait-tall', help: '开屏竖图，用户打开 App 时展示。演示按竖图比例校验。' }
]

export const APP_OPTIONS = [
  { label: '昭昭医考App', code: 'APP' },
  { label: '昭昭医考小程序', code: 'MINI_PROGRAM' },
  { label: '昭昭网校PC端', code: 'PC' }
]

export const STATUS_CODE = { on: 'ON', off: 'OFF' }

export function adTypeMeta (label) {
  return AD_TYPE_OPTIONS.find(item => item.value === label) || AD_TYPE_OPTIONS[0]
}

export function appCodeOf (label) {
  return (APP_OPTIONS.find(item => item.label === label) || APP_OPTIONS[0]).code
}
