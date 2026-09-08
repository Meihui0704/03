import '../../../profession-data.js'

export const backendProjects = [
  { id: 330, name: '公共预防', sort: 1, status: 'off', duplicate: true },
  { id: 364, name: '中西药', sort: 1, status: 'off', duplicate: true },
  { id: 372, name: '医学技术', sort: 1, status: 'off', duplicate: true },
  { id: 119, name: '临床', sort: 1, status: 'on' },
  { id: 631, name: '公共预防', sort: 1, status: 'off', duplicate: true },
  { id: 420, name: '西医', sort: 2, status: 'on' },
  { id: 139, name: '中级职称', sort: 3, status: 'on' },
  { id: 120, name: '考研', sort: 4, status: 'off' },
  { id: 121, name: '中医/中西医', sort: 4, status: 'on' },
  { id: 222, name: '本科考试', sort: 4, status: 'off' },
  { id: 124, name: '乡村全科', sort: 5, status: 'on' },
  { id: 313, name: '公卫预防', sort: 6, status: 'on' },
  { id: 160, name: '规培结业考核', sort: 6, status: 'off' },
  { id: 210, name: '口腔', sort: 6, status: 'on' },
  { id: 123, name: '护理', sort: 7, status: 'on' },
  { id: 189, name: '同等学力申硕', sort: 7, status: 'off' },
  { id: 285, name: '中西药', sort: 10, status: 'on', duplicate: true },
  { id: 204, name: '中医传承', sort: 10, status: 'on' },
  { id: 205, name: '中医师承1', sort: 10, status: 'off' },
  { id: 257, name: '医学技术', sort: 12, status: 'on', duplicate: true },
  { id: 122, name: '药师', sort: 13, status: 'off' },
  { id: 127, name: '医疗招聘', sort: 13, status: 'on' },
  { id: 637, name: '过敏', sort: 15, status: 'on' },
  { id: 642, name: '体重管理', sort: 16, status: 'on' }
]

const sourceProfessions = typeof window === 'undefined' ? [] : (window.professionData || [])

/** 运营已确认：挂在「中医/中西医 → 期末考试（中医）」下的学期子级；专业 ID 沿用原表，不新造。 */
export const tcmFinalExamChildIds = [352, 351, 353, 278, 283, 277, 282, 279, 284, 235, 243]

export const backendProfessions = sourceProfessions.map(item => {
  const nestedUnderTcmFinal = tcmFinalExamChildIds.includes(item.id)
  return {
    ...item,
    nestedParent: nestedUnderTcmFinal ? 349 : null,
    project: nestedUnderTcmFinal ? '中医/中西医' : item.project,
    sort: item.sort || item.no,
    pinyin: item.pinyin || '',
    year: '未标年份',
    life: nestedUnderTcmFinal
      ? '学期子级'
      : item.name === '—' && item.project === '—'
        ? '名称和项目为空'
        : item.project === '—'
          ? '所属项目为空'
          : '正在使用'
  }
})

export const defaultChildren = {
  258: [
    { id: 259, name: '放射医学技术（士）[代码104]', sort: 1, status: 'on' },
    { id: 260, name: '临床医学检验技术（士）[代码105]', sort: 2, status: 'on' },
    { id: 261, name: '病理学技术（士）[代码106]', sort: 3, status: 'on' },
    { id: 262, name: '康复医学治疗技术（士）[代码107]', sort: 4, status: 'on' },
    { id: 263, name: '营养（士）[代码108]', sort: 5, status: 'on' },
    { id: 267, name: '卫生检验技术（士）[代码109]', sort: 6, status: 'on' },
    { id: 428, name: '神经电生理-脑电图技术（士）[代码215]', sort: 7, status: 'on' }
  ],
  349: [
    { id: 'pending-349-1', name: '大一', sort: 1, status: 'on' },
    { id: 352, name: '大二', sort: 2, status: 'on' },
    { id: 351, name: '大三', sort: 3, status: 'on' },
    { id: 353, name: '大四', sort: 4, status: 'on' },
    { id: 278, name: '大二期末', sort: 5, status: 'on' },
    { id: 283, name: '大二期末', sort: 6, status: 'on' },
    { id: 277, name: '大三期末', sort: 7, status: 'on' },
    { id: 282, name: '大三期末', sort: 8, status: 'on' },
    { id: 279, name: '大四期末', sort: 9, status: 'on' },
    { id: 284, name: '大四期末', sort: 10, status: 'on' },
    { id: 235, name: '大二', sort: 11, status: 'on' },
    { id: 243, name: '大二', sort: 12, status: 'on' }
  ]
}
