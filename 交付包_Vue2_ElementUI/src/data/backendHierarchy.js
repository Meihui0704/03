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

export const backendProfessions = sourceProfessions.map(item => ({
  ...item,
  sort: item.sort || item.no,
  pinyin: item.pinyin || '',
  year: '未标年份',
  life: item.name === '—' && item.project === '—' ? '名称和项目为空' : item.project === '—' ? '所属项目为空' : '正在使用'
}))

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
    { id: 'pending-349-2', name: '大二', sort: 2, status: 'on' },
    { id: 'pending-349-3', name: '大三', sort: 3, status: 'on' },
    { id: 'pending-349-4', name: '大四', sort: 4, status: 'on' }
  ]
}
