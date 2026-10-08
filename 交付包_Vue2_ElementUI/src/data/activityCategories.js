/** 活动类目：运营只选小类；大类由小类自动带出。五大类留给筛选和张旭老师看。 */
export const TAXONOMY_KEY = 'activity-taxonomy-demo-v5'

const stamp = '2026-09-17 14:30:00'

const child = (id, parentId, name, sort) => ({
  id,
  parentId,
  name,
  sort,
  status: 'on',
  createdBy: '美惠',
  createdAt: stamp,
  updatedBy: '美惠',
  updatedAt: stamp
})

export const backendActivityGroups = [
  { id: 101, name: '拉新', sort: 1, status: 'on', locked: true, createdBy: '美惠', createdAt: stamp, updatedBy: '美惠', updatedAt: stamp, children: [] },
  {
    id: 102,
    name: '传播',
    sort: 2,
    status: 'on',
    locked: true,
    createdBy: '美惠',
    createdAt: stamp,
    updatedBy: '美惠',
    updatedAt: stamp,
    children: [child(1021, 102, '阶段拉新', 1)]
  },
  {
    id: 103,
    name: '激活',
    sort: 3,
    status: 'on',
    locked: true,
    createdBy: '美惠',
    createdAt: stamp,
    updatedBy: '美惠',
    updatedAt: stamp,
    children: [
      child(1031, 103, '考后估分', 1),
      child(1032, 103, '冲刺模考', 2)
    ]
  },
  {
    id: 104,
    name: '留存',
    sort: 4,
    status: 'on',
    locked: true,
    createdBy: '美惠',
    createdAt: stamp,
    updatedBy: '美惠',
    updatedAt: stamp,
    children: [
      child(1041, 104, '资料与伴学', 1),
      child(1042, 104, '节日活动', 2)
    ]
  },
  {
    id: 105,
    name: '变现',
    sort: 5,
    status: 'on',
    locked: true,
    createdBy: '美惠',
    createdAt: stamp,
    updatedBy: '美惠',
    updatedAt: stamp,
    children: [
      child(1051, 105, '考前冲刺专区', 1),
      child(1052, 105, '学科专区', 2),
      child(1053, 105, '早鸟召集', 3),
      child(1054, 105, '大促专区', 4)
    ]
  }
]

export function findGroup (groups, id) {
  return (groups || []).find(item => item.id === id) || null
}

export function findChild (groups, childId) {
  for (const group of groups || []) {
    const item = (group.children || []).find(row => row.id === childId)
    if (item) return { group, child: item }
  }
  return null
}

export function taxonomyLabel (groups, groupId, childId) {
  const found = findChild(groups, childId)
  if (found) return `${found.group.name} / ${found.child.name}`
  const group = findGroup(groups, groupId)
  return group ? group.name : ''
}
