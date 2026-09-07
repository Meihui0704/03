export const taxonomy = [
  { name: '临床', groups: [{ name: '', items: ['临床执业医师', '临床助理医师'] }] },
  { name: '西医', groups: [{ name: '', items: ['西医考研', '西医考研—复试', '规培结业考核（共30科）', '期末考试（共4科）', '申硕—西医综合', '西医副高职称（共47科）', '临床三基', '临床医学专业／本科水平测试'] }] },
  {
    name: '中级职称',
    groups: [
      { name: '内科类', items: ['全科主治(301)', '全科医学中医类(302)', '内科主治(303)', '心内主治(304)', '呼吸主治(305)', '消化主治(306)', '肾内主治(307)', '神内主治(308)', '内分泌主治(309)', '血液主治(310)', '传染病主治(312)', '风湿免疫主治(313)', '中医内科(315)', '中西医结合内科(316)'] },
      { name: '外科类', items: ['普外主治(317)', '骨外主治(318)', '胸心外主治(319)', '神外主治(320)', '泌外主治(321)', '小儿外主治(322)', '烧伤外主治(323)', '整形外主治(324)', '中医外科(325)', '中西医结合外科(326)'] },
      { name: '妇儿类', items: ['妇产主治(330)', '儿科主治(332)'] },
      { name: '专科其他类', items: ['眼科学(334)', '耳鼻咽喉科学(336)', '皮肤与性病学(338)', '精神病学(340)', '肿瘤内科学(341)', '核医学主治(345)', '麻醉学(347)', '康复医学(348)', '病理学主治(351)', '口腔医学(353)', '重症医学(359)', '公共卫生(362)', '急诊医学(392)'] }
    ]
  },
  { name: '中医／中西医', groups: [{ name: '', items: ['中医执业／助理医师', '中医考研', '中西医执业／助理医师', '中级职称（共10科）', '规培结业考核（共2科）', '规培出科考核（共9科）', '期末考试（中医，共4科）', '期末考试（中西医，共4科）', '中医师承及确有专长', '中医适宜技术'] }] },
  { name: '乡村全科', groups: [{ name: '', items: ['乡村全科助理'] }] },
  { name: '口腔', groups: [{ name: '', items: ['口腔执业医师', '口腔执业助理医师', '中级职称（共1科）', '期末考试（口腔，共4科）', '口腔规培结业考核（共7科）', '口腔考研'] }] },
  { name: '公卫预防', groups: [{ name: '', items: ['公卫执业医师', '公卫助理医师', '中级职称（共5科）', '期末考试（公卫，共4科）', '公卫考研'] }] },
  { name: '护理', groups: [{ name: '', items: ['护士执业', '护士资格', '护理三基', '初级护师', '护理考研', '主管护师（共6科）', '专科期末（护理，共2科）', '本科期末（护理，共3科）', '护理专升本（统招，共4科）'] }] },
  { name: '中医传承', groups: [{ name: '', items: ['中医传承'] }] },
  { name: '中西药', groups: [{ name: '', items: ['考研（共2科）', '初级职称（共4科）', '中级职称（共2科）', '期末考试（西药，共4科）', '期末考试（中药，共4科）'] }] },
  { name: '医学技术', groups: [{ name: '', items: ['医技初级职称（士，共7科）', '医技初级职称（师，共7科）', '医学初级职称（师，共1科）', '医技中级职称（主管，共15科）'] }] },
  { name: '医疗招聘', groups: [{ name: '', items: ['临床考编', '中医考编', '口腔考编', '预防医学考编', '护理考编', '药学考编', '中药学考编', '检验考编', '康复考编', '影像考编'] }] },
  { name: '过敏', groups: [{ name: '', items: ['变态反应学'] }] }
]

export const zzzcScope = [
  '全科主治(301)', '内科主治(303)', '心内主治(304)', '呼吸主治(305)', '消化主治(306)', '肾内主治(307)',
  '神内主治(308)', '内分泌主治(309)', '血液主治(310)', '传染病主治(312)', '风湿免疫主治(313)',
  '普外主治(317)', '骨外主治(318)', '胸心外主治(319)', '神外主治(320)', '泌外主治(321)',
  '小儿外主治(322)', '烧伤外主治(323)', '整形外主治(324)'
]

const middleTitleNames = {
  刷题必买: ['2027中级职称AI错题再练'],
  高端进阶: ['2027年中级职称旗舰领航班', '2027年中级职称精英班', '2027年中级职称旗舰班', '2027年中级职称至尊班'],
  高分密训: ['2027年中级职称高分密训班（一单元）', '2027年中级职称高分密训班（一+二单元）'],
  基础夯实: ['2027年中级职称基础夯实班（一单元）', '2027年中级职称基础夯实班（一+二单元）']
}

let serial = 1
export const middleTitleProducts = Object.keys(middleTitleNames).reduce((list, category) => {
  return list.concat(middleTitleNames[category].map(name => ({
    id: `zzzc-${String(serial++).padStart(3, '0')}`,
    name,
    project: '中级职称',
    category,
    scope: zzzcScope.slice(),
    price: null,
    status: serial % 4 === 0 ? 'OFF' : 'ON',
    source: '中级职称课程库'
  })))
}, [])

const clinicalRaw = [
  {
    owner: 'shared', ownerLabel: '临床执业医师／临床助理医师共用商品', ownerShort: '共用', scope: ['临床执业医师', '临床助理医师'],
    categories: {
      '笔试／冲刺': [['2026昭师金题带刷冲刺班', 1280], ['2026考前速效抢救班（券后价）', 1480], ['2026五天四夜仿真模考视频代课面授班', 2990], ['2026五天四夜仿真模考面授班（券后价）', 4570], ['2026八天七夜冲刺串讲视频代课面授班', 2990]],
      高端面授: [['2026昭师进阶班（技能免考）', 8330], ['2026昭师尊享B班（技能免考）', 12470]],
      网络班次: [['2026全程精讲班（技能免考，券后价）', 2300], ['2026昭师助力班（技能免考，券后价）', 3680], ['2027全程精讲班（券后价）', 2300], ['2027早鸟班（券后价）', 2730], ['2027昭师助力班（券后价）', 3680], ['2027昭师带学A班（券后价）', 5830]],
      小昭医声: [['2027心／肺技能听诊', 9.9]],
      技能突破: [['2027技能3D仿真模拟训练', 159]],
      正版书籍: [['2026临床执业及助理医师资格考试笔试重难点精析（上下册）（券后价）', 224.25], ['2026临床执业及助理医师资格考试精选真题考点精析（两册）（券后价）', 179.25], ['2026临床执业及助理医师资格考试实践技能操作核心考点背诵版（券后价）', 27], ['2026临床执业及助理医师资格考试笔试核心考点背诵版（券后价）', 96], ['2026临床执业及助理医师资格考试题眼狂背（券后价）', 36.75], ['25—26年手绘笔记普通版', 194]]
    }
  },
  {
    owner: 'exec', ownerLabel: '临床执业医师专属商品', ownerShort: '执业专属', scope: ['临床执业医师'],
    categories: {
      '笔试／冲刺': [['2026执业笔试压题卷（3600题，券后价）', 499]],
      小昭医声: [['2026全系统临床执业重难点深度解析', 99], ['2026全系统临床执业笔试核心考点', 129]],
      正版书籍: [['2026临床执业考点蒸馏手册书课包（非偏远地区）', 99]]
    }
  },
  {
    owner: 'assist', ownerLabel: '临床助理医师专属商品', ownerShort: '助理专属', scope: ['临床助理医师'],
    categories: {
      '笔试／冲刺': [['2026助理笔试压题卷（1800题，券后价）', 499]],
      小昭医声: [['2026全系统临床助理重难点深度解析', 99], ['2026全系统临床助理笔试核心考点', 129]],
      正版书籍: [['2026临床助理考点蒸馏手册书课包（非偏远地区）', 99]]
    }
  }
]

let clinicalSerial = 1
export const clinicalGroups = clinicalRaw.map(block => ({
  owner: block.owner,
  ownerLabel: block.ownerLabel,
  ownerShort: block.ownerShort,
  scope: block.scope,
  categories: Object.keys(block.categories).map(category => ({
    name: category,
    products: block.categories[category].map(([name, price]) => ({
      id: `clinical-${String(clinicalSerial++).padStart(3, '0')}`,
      name,
      price,
      project: '临床',
      category,
      owner: block.owner,
      ownerLabel: block.ownerShort,
      scope: block.scope.slice(),
      status: clinicalSerial % 5 === 0 ? 'OFF' : 'ON',
      source: '临床商品库'
    }))
  }))
}))

export const clinicalProducts = clinicalGroups.reduce((items, block) => {
  return items.concat(block.categories.reduce((list, category) => list.concat(category.products), []))
}, [])

export const allOperationProducts = middleTitleProducts.concat(clinicalProducts)

export function professionName (id) {
  return id.indexOf('::') > -1 ? id.slice(id.indexOf('::') + 2) : id
}

export function professionProject (id) {
  return id.indexOf('::') > -1 ? id.slice(0, id.indexOf('::')) : ''
}

export function getImpact (selectedProductIds, selectedProfessionIds, products = allOperationProducts) {
  const selectedProducts = products.filter(item => selectedProductIds.includes(item.id))
  const valid = []
  const mismatched = []
  selectedProfessionIds.forEach(professionId => {
    const name = professionName(professionId)
    const coveredProducts = selectedProducts.filter(product => !product.scope || product.scope.includes(name))
    if (coveredProducts.length) valid.push({ professionId, name, count: coveredProducts.length })
    else if (selectedProducts.length) mismatched.push({ professionId, name })
  })
  return {
    products: selectedProducts,
    valid,
    mismatched,
    combinationCount: valid.reduce((total, item) => total + item.count, 0)
  }
}

export function saveTransfer (payload) {
  window.sessionStorage.setItem('operation-transfer', JSON.stringify(payload))
}

export function readTransfer () {
  try {
    const payload = JSON.parse(window.sessionStorage.getItem('operation-transfer') || '{}')
    window.sessionStorage.removeItem('operation-transfer')
    return payload
  } catch (error) {
    window.sessionStorage.removeItem('operation-transfer')
    return {}
  }
}
