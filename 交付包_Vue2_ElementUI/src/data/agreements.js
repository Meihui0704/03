/** 协议管理种子对齐现网列表与编辑截图。协议 ID 不改。正文仅演示摘要，不复制法务全文。 */

export const SIGN_FIELDS = [
  { key: 'name', label: '姓名' },
  { key: 'phone', label: '手机号' },
  { key: 'idNo', label: '身份证号' },
  { key: 'idPhoto', label: '身份证照片' },
  { key: 'address', label: '地址' },
  { key: 'postcode', label: '邮编' },
  { key: 'skill', label: '技能资质' },
  { key: 'work', label: '工作资质' },
  { key: 'idAuth', label: '身份认证' },
  { key: 'campus', label: '面授地址' }
]

function row (item) {
  return {
    notice: '',
    content: '演示只保留摘要。完整协议正文接入后走原富文本，不在助手里重录。',
    status: 'on',
    createdBy: '张宇航',
    updatedBy: '张宇航',
    createdAt: '2026-09-20 11:16:09',
    updatedAt: '2026-09-20 11:16:09',
    ...item
  }
}

export const backendAgreements = [
  row({
    id: 127,
    name: '2026二试九天七夜密训面授营协议',
    startAt: '2026-09-20 00:00:00',
    endAt: '2027-09-19 00:00:00',
    signKeys: ['name', 'phone', 'idNo', 'address']
  }),
  row({
    id: 126,
    name: '2026二试五天四夜密训面授营协议',
    startAt: '2026-09-20 00:00:00',
    endAt: '2027-09-19 00:00:00',
    signKeys: ['name', 'phone', 'idNo', 'address'],
    createdAt: '2026-09-20 11:15:52',
    updatedAt: '2026-09-20 11:15:52'
  }),
  row({
    id: 125,
    name: '2026二试四天三夜密训面授营协议',
    startAt: '2026-09-20 00:00:00',
    endAt: '2027-09-19 00:00:00',
    signKeys: ['name', 'phone', 'idNo', 'address'],
    createdAt: '2026-09-20 11:15:40',
    updatedAt: '2026-09-20 11:15:40'
  }),
  row({
    id: 124,
    name: '2026二试加强班协议 09-18',
    startAt: '2026-09-20 00:00:00',
    endAt: '2027-09-19 00:00:00',
    signKeys: ['name', 'phone', 'idNo', 'idPhoto', 'address'],
    createdAt: '2026-09-20 11:14:45',
    updatedAt: '2026-09-20 11:14:56'
  }),
  row({
    id: 123,
    name: '2026二试集训班协议 09-18',
    startAt: '2026-09-20 00:00:00',
    endAt: '2027-12-30 00:00:00',
    signKeys: ['name', 'phone', 'idNo', 'idPhoto', 'address'],
    createdAt: '2026-09-20 11:13:33',
    updatedAt: '2026-09-20 11:14:58'
  }),
  row({
    id: 122,
    name: '2028昭昭临床医学考研西综VIP班协议',
    startAt: '2026-08-12 16:22:05',
    endAt: '2028-06-01 00:00:00',
    signKeys: ['name', 'phone', 'idNo', 'idPhoto', 'address'],
    createdBy: '黄文彦',
    updatedBy: '黄文彦',
    createdAt: '2026-08-12 16:20:25',
    updatedAt: '2026-08-12 16:22:20'
  }),
  row({
    id: 121,
    name: '【停课】2026高端班',
    startAt: '2025-07-03 00:00:00',
    endAt: '2026-06-01 00:00:00',
    signKeys: ['name', 'phone', 'idNo', 'idPhoto', 'address'],
    status: 'off',
    createdAt: '2026-06-29 10:24:08',
    updatedAt: '2026-06-29 10:26:18'
  }),
  row({
    id: 120,
    name: '2026年11天冲刺加强密考面授班协议+安全',
    startAt: '2025-07-03 00:00:00',
    endAt: '2027-07-03 00:00:00',
    signKeys: ['name', 'phone', 'idNo', 'idPhoto', 'address'],
    createdAt: '2026-06-29 10:17:32',
    updatedAt: '2026-06-29 10:17:32'
  })
]
