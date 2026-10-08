/** PC 商城年份筛选项。种子对齐现网推荐筛选配置截图。 */

export const FILTER_YEARS = [2023, 2024, 2025, 2026, 2027]
export const FILTER_PROJECTS = ['考研', '护理', '中级职称', '临床']
export const FILTER_PROFESSIONS = {
  考研: ['西医考研', '西医考研-复试', '西医大一期末考试', '西医大二期末考试', '西医大三期末考试', '西医大四期末考试', '护理考研'],
  护理: ['护士执业', '护士资格', '护理三基', '初级护师', '护理考研', '主管护师'],
  中级职称: ['心内主治(304)', '内科主治(303)'],
  临床: ['临床执业医师', '临床助理医师']
}

export const backendPcFilters = [
  { id: 1, year: 2024, project: '考研', profession: '西医考研', isDefault: false },
  { id: 2, year: 2023, project: '护理', profession: '初级护师', isDefault: true },
  { id: 3, year: 2023, project: '护理', profession: '护士执业', isDefault: true },
  { id: 4, year: 2023, project: '考研', profession: '护理考研', isDefault: true },
  { id: 5, year: 2023, project: '考研', profession: '西医大一期末考试', isDefault: true },
  { id: 6, year: 2023, project: '考研', profession: '西医大二期末考试', isDefault: true },
  { id: 7, year: 2023, project: '考研', profession: '西医大三期末考试', isDefault: false },
  { id: 8, year: 2023, project: '考研', profession: '西医大四期末考试', isDefault: true },
  { id: 9, year: 2023, project: '考研', profession: '西医考研-复试', isDefault: true },
  { id: 10, year: 2024, project: '中级职称', profession: '心内主治(304)', isDefault: false },
  { id: 11, year: 2027, project: '临床', profession: '临床助理医师', isDefault: true }
]
