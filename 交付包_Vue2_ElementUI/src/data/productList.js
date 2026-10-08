/** 商品列表种子对齐现网编辑/组合截图。ID 不改。 */

export const PRODUCT_CATEGORIES = ['课程', '图书', '题包']
export const SELL_MODES = ['直播', '录播', '面授', '题库']
export const PROJECTS = ['临床', '中级职称']
export const PROFESSIONS = {
  临床: ['临床执业医师', '临床助理医师'],
  中级职称: ['内科主治(303)']
}
export const COURSE_PACKS = {
  临床: ['2027早鸟班', '2027进阶班', '2027全程班'],
  中级职称: ['2027精英班']
}

function row (item) {
  return {
    category: '课程',
    deliver: true,
    project: '临床',
    profession: '临床助理医师',
    packName: '2027早鸟班',
    courseId: '',
    teacher: '昭昭老师',
    sellModes: ['直播', '录播', '题库'],
    hours: 200,
    year: 2027,
    serviceMode: 'campus',
    includeBooks: false,
    physical: false,
    cover: '商品主图.jpg',
    details: ['商品详情图.jpg'],
    notice: '',
    includeBuyDesc: false,
    sort: 0,
    listPrice: 0,
    stock: 0,
    virtualSales: 0,
    autoShelf: true,
    shelfStart: '2026-09-18 13:12:59',
    shelfEnd: '',
    validType: 'time',
    validUntil: '2028-11-30 00:00:00',
    hasAgreement: false,
    status: 'on',
    shown: true,
    comboIds: [],
    updatedBy: '美惠',
    updatedAt: '2026-09-18 13:12:00',
    ...item
  }
}

export const backendProducts = [
  row({
    id: 4854,
    name: '2027临床进阶班（6本书）',
    packName: '2027进阶班',
    courseId: '3306',
    price: 9999,
    stock: 8854,
    virtualSales: 3229,
    comboIds: []
  }),
  row({
    id: 4852,
    name: '2027临床早鸟班（6本书）',
    packName: '2027早鸟班',
    courseId: '3305',
    price: 9999,
    stock: 8600,
    virtualSales: 4102
  }),
  row({
    id: 4851,
    name: '2027临床早鸟班（6本书）',
    packName: '2027早鸟班',
    courseId: '3305',
    price: 9999,
    stock: 1200,
    virtualSales: 880,
    shown: false
  }),
  row({
    id: 4850,
    name: '2027临床全程班（6本书）',
    packName: '2027全程班',
    courseId: '3298',
    price: 2350,
    stock: 5400,
    virtualSales: 6120
  }),
  row({
    id: 4848,
    name: '2027临床甄题精析题库+ai错题再练',
    category: '题包',
    packName: '2027早鸟班',
    courseId: '3280',
    sellModes: ['题库'],
    hours: 0,
    price: 9999,
    stock: 9999,
    virtualSales: 2100
  }),
  row({
    id: 4838,
    name: 'AI私教（智学系统）',
    packName: '2027早鸟班',
    courseId: '3210',
    sellModes: ['录播'],
    hours: 40,
    price: 1290,
    stock: 3000,
    virtualSales: 1560
  }),
  row({
    id: 4836,
    name: '2027甄题增值',
    packName: '2027早鸟班',
    courseId: '3208',
    sellModes: ['录播', '题库'],
    price: 9999,
    stock: 2000,
    virtualSales: 430
  }),
  row({
    id: 4834,
    name: '昭昭26学年二试冲刺包',
    year: 2026,
    packName: '2027早鸟班',
    courseId: '3188',
    sellModes: ['直播', '录播'],
    hours: 32,
    price: 99,
    stock: 5000,
    virtualSales: 8900
  }),
  row({
    id: 4832,
    name: '20临床题库会员免费领取',
    category: '题包',
    packName: '2027早鸟班',
    courseId: '3180',
    sellModes: ['题库'],
    hours: 0,
    price: 299,
    stock: 99999,
    virtualSales: 12000
  }),
  row({
    id: 2101,
    name: '2026临床执业医师强化班',
    profession: '临床执业医师',
    packName: '2027全程班',
    courseId: '2101',
    year: 2026,
    sellModes: ['直播', '录播', '面授'],
    hours: 160,
    price: 1599,
    stock: 800,
    virtualSales: 320,
    status: 'on'
  }),
  row({
    id: 460,
    name: '4天三夜密训班',
    profession: '临床执业医师',
    packName: '2027全程班',
    courseId: '460',
    year: 2026,
    sellModes: ['面授'],
    hours: 32,
    price: null,
    stock: 200,
    virtualSales: 5400,
    status: 'on'
  }),
  row({
    id: 4720,
    name: '2026临床执业及助理医师资格考试笔试重难点精析（上下册）',
    category: '图书',
    deliver: true,
    physical: true,
    includeBooks: true,
    packName: '',
    courseId: '',
    sellModes: [],
    hours: 0,
    year: 2026,
    price: 224.25,
    stock: 320,
    virtualSales: 1860,
    autoShelf: false,
    status: 'on'
  }),
  row({
    id: 3101,
    name: '2027年中级职称精英班',
    project: '中级职称',
    profession: '内科主治(303)',
    packName: '2027精英班',
    courseId: '3101',
    sellModes: ['直播', '录播'],
    hours: 180,
    price: 1299,
    stock: 600,
    virtualSales: 210,
    status: 'on'
  })
]
