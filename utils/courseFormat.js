export const STORAGE_KEY = 'curriculum_courses_v1'

export const WEEKDAYS = [
  { label: '周一', value: 1 },
  { label: '周二', value: 2 },
  { label: '周三', value: 3 },
  { label: '周四', value: 4 },
  { label: '周五', value: 5 },
  { label: '周六', value: 6 },
  { label: '周日', value: 7 }
]

export const SECTION_OPTIONS = [
  { label: '第 1-2 节', value: [1, 2], time: '08:00-09:40' },
  { label: '第 3-4 节', value: [3, 4], time: '10:00-11:40' },
  { label: '第 5-6 节', value: [5, 6], time: '14:00-15:40' },
  { label: '第 7-8 节', value: [7, 8], time: '16:00-17:40' },
  { label: '第 9-10 节', value: [9, 10], time: '19:00-20:40' },
  { label: '第 11-12 节', value: [11, 12], time: '20:50-22:30' }
]

export const WEEK_MODE_OPTIONS = [
  { label: '每周', value: 'all' },
  { label: '单周', value: 'odd' },
  { label: '双周', value: 'even' }
]

export const COURSE_COLORS = [
  { bg: '#eef4ff', soft: '#dbe7ff', accent: '#2563eb', text: '#163a7a' },
  { bg: '#f3f0ff', soft: '#e4dcff', accent: '#6d4aff', text: '#38256f' },
  { bg: '#edf8f1', soft: '#d8efe0', accent: '#1d8f54', text: '#185031' },
  { bg: '#fff5e9', soft: '#ffe4bf', accent: '#c77700', text: '#6e4300' },
  { bg: '#fff1f2', soft: '#ffd7dd', accent: '#d1435b', text: '#7a2130' },
  { bg: '#eef7f8', soft: '#d8ebed', accent: '#157787', text: '#0e4b55' }
]

export function getTodayWeekday() {
  const day = new Date().getDay()
  return day === 0 ? 7 : day
}

export function getWeekdayLabel(value) {
  const item = WEEKDAYS.find((day) => day.value === Number(value))
  return item ? item.label : '未选择'
}

export function getSectionLabel(sections) {
  if (!Array.isArray(sections) || sections.length === 0) return '未选择'
  const match = SECTION_OPTIONS.find((item) => sameSections(item.value, sections))
  return match ? match.label : `第 ${sections.join('-')} 节`
}

export function getSectionTime(sections) {
  const match = SECTION_OPTIONS.find((item) => sameSections(item.value, sections || []))
  return match ? match.time : ''
}

export function getWeeksLabel(weeks) {
  if (!Array.isArray(weeks) || weeks.length < 2) return '1-16 周'
  return `${weeks[0]}-${weeks[1]} 周`
}

export function getWeekModeLabel(weekMode) {
  const match = WEEK_MODE_OPTIONS.find((item) => item.value === weekMode)
  return match ? match.label : '每周'
}

export function sortBySection(a, b) {
  const startA = Array.isArray(a.sections) ? Number(a.sections[0]) : 0
  const startB = Array.isArray(b.sections) ? Number(b.sections[0]) : 0
  return startA - startB
}

export function sameSections(a, b) {
  return Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((value, index) => Number(value) === Number(b[index]))
}

export function getCourseColor(course) {
  const index = Math.abs(Number(course && course.colorKey ? course.colorKey : 0)) % COURSE_COLORS.length
  return COURSE_COLORS[index]
}

export function buildCourseColorKey(name) {
  const text = name || ''
  let hash = 0
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash + text.charCodeAt(i) * (i + 1)) % COURSE_COLORS.length
  }
  return hash
}

export function isCourseInWeekRange(course, currentWeek) {
  if (!currentWeek || currentWeek < 1) return false
  const weeks = Array.isArray(course.weeks) ? course.weeks.map(Number) : [1, 16]
  return currentWeek >= Number(weeks[0]) && currentWeek <= Number(weeks[1])
}

export function matchWeekMode(weekMode, currentWeek) {
  if (!currentWeek || currentWeek < 1) return false
  if (weekMode === 'odd') return currentWeek % 2 === 1
  if (weekMode === 'even') return currentWeek % 2 === 0
  return true
}

export function isCourseActiveForWeek(course, currentWeek) {
  return isCourseInWeekRange(course, currentWeek) && matchWeekMode(course.weekMode, currentWeek)
}
