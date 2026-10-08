/** 运费模板种子对齐现网列表与「考编」编辑截图。 */

export const BILLING_MODES = [
  { value: 'weight', label: '按重量' },
  { value: 'piece', label: '按件数' }
]

export const PROVINCES = [
  '北京市', '天津市', '河北省', '山西省', '内蒙古自治区',
  '辽宁省', '吉林省', '黑龙江省', '上海市', '江苏省',
  '浙江省', '安徽省', '福建省', '江西省', '山东省',
  '河南省', '湖北省', '湖南省', '广东省', '广西壮族自治区',
  '海南省', '重庆市', '四川省', '贵州省', '云南省',
  '西藏自治区', '陕西省', '甘肃省', '青海省', '宁夏回族自治区',
  '新疆维吾尔自治区'
]

const MAINLAND = PROVINCES.filter(item => !['内蒙古自治区', '新疆维吾尔自治区', '西藏自治区', '四川省', '山东省'].includes(item))

function zone (regions, firstQty, firstFee, extraQty, extraFee) {
  return { regions, firstQty, firstFee, extraQty, extraFee }
}

export const backendFreight = [
  {
    id: 1,
    name: '考编',
    billing: 'weight',
    status: 'on',
    productCount: 4,
    createdAt: '2026-04-01 09:00:58',
    zones: [
      zone(MAINLAND, 1, 5, 1, 5),
      zone(['内蒙古自治区', '新疆维吾尔自治区', '西藏自治区', '四川省'], 1, 15, null, null),
      zone(['山东省'], 1, 0, 1, 5)
    ]
  },
  {
    id: 2,
    name: '28扑克牌',
    billing: 'weight',
    status: 'on',
    productCount: 1,
    createdAt: '2026-03-28 00:45:54',
    zones: [
      zone(['北京市', '天津市', '河北省'], 1, 8, 1, 4),
      zone(['上海市', '江苏省', '浙江省'], 1, 10, 1, 5),
      zone(['广东省'], 1, 12, 1, 6),
      zone(['新疆维吾尔自治区', '西藏自治区'], 1, 20, null, null)
    ]
  },
  {
    id: 3,
    name: '公众号专业',
    billing: 'weight',
    status: 'on',
    productCount: 9,
    createdAt: '2026-01-23 10:46:20',
    zones: [
      zone(['北京市', '上海市', '广东省'], 1, 6, 1, 4),
      zone(['新疆维吾尔自治区', '西藏自治区'], 1, 18, 1, 10)
    ]
  },
  {
    id: 4,
    name: '2026实物运营详情',
    billing: 'weight',
    status: 'on',
    productCount: 18,
    createdAt: '2025-12-11 13:38:18',
    zones: [
      zone(['北京市'], 1, 5, 1, 3),
      zone(['上海市'], 1, 6, 1, 3),
      zone(['广东省'], 1, 8, 1, 4)
    ]
  },
  {
    id: 5,
    name: '全部包邮',
    billing: 'piece',
    status: 'on',
    productCount: 43,
    createdAt: '2025-08-01 18:00:06',
    zones: [zone(PROVINCES.slice(), 1, 0, 1, 0)]
  },
  {
    id: 6,
    name: '2025实物运营',
    billing: 'weight',
    status: 'on',
    productCount: 22,
    createdAt: '2025-04-21 15:17:04',
    zones: [
      zone(MAINLAND.slice(0, 10), 1, 5, 1, 5),
      zone(['山东省'], 1, 0, 1, 5)
    ]
  },
  {
    id: 7,
    name: '实物商品运费模板',
    billing: 'piece',
    status: 'on',
    productCount: 47,
    createdAt: '2023-05-24 14:49:18',
    zones: [
      zone(['北京市', '天津市', '河北省'], 1, 6, 1, 2),
      zone(['上海市', '江苏省', '浙江省'], 1, 8, 1, 3),
      zone(['广东省'], 1, 10, 1, 4),
      zone(['新疆维吾尔自治区'], 1, 15, 1, 8)
    ]
  },
  {
    id: 8,
    name: '测试北京地区运费模板（禁用）',
    billing: 'piece',
    status: 'off',
    productCount: 3,
    createdAt: '2023-03-10 11:32:26',
    zones: [zone(['北京市'], 1, 8, 1, 2)]
  }
]
