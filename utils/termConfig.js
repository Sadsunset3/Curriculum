const TERM_STORAGE_KEY = 'curriculum_term_config_v1'

function pad(value) {
  return String(value).padStart(2, '0')
}

function formatDate(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function parseDate(dateText) {
  if (!dateText) return null
  const match = String(dateText).match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return null
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  if (Number.isNaN(date.getTime())) return null
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function getDefaultAcademicYear(date = new Date()) {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const startYear = month >= 8 ? year : year - 1
  return `${startYear}-${startYear + 1}`
}

function getDefaultSemester(date = new Date()) {
  const month = date.getMonth() + 1
  return month >= 2 && month < 8 ? 2 : 1
}

function getDefaultStartDate(date = new Date()) {
  return formatDate(date)
}

function normalizeTermConfig(config = {}) {
  return {
    academicYear: String(config.academicYear || getDefaultAcademicYear()).trim(),
    semester: Number(config.semester) === 2 ? 2 : 1,
    startDate: parseDate(config.startDate) ? config.startDate : getDefaultStartDate(),
    totalWeeks: Math.min(30, Math.max(1, Number(config.totalWeeks) || 20))
  }
}

export function getTermConfig() {
  try {
    const config = uni.getStorageSync(TERM_STORAGE_KEY)
    return normalizeTermConfig(config)
  } catch (error) {
    return normalizeTermConfig()
  }
}

export function saveTermConfig(config) {
  const normalized = normalizeTermConfig(config)
  uni.setStorageSync(TERM_STORAGE_KEY, normalized)
  return normalized
}

export function getCurrentTermInfo(config = getTermConfig(), baseDate = new Date()) {
  const normalized = normalizeTermConfig(config)
  const today = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate())
  const startDate = parseDate(normalized.startDate)

  let currentWeek = null
  let status = 'unset'

  if (startDate) {
    const diffDays = Math.floor((today.getTime() - startDate.getTime()) / 86400000)
    currentWeek = diffDays >= 0 ? Math.floor(diffDays / 7) + 1 : 0

    if (currentWeek === 0) {
      status = 'before'
    } else if (currentWeek > normalized.totalWeeks) {
      status = 'after'
    } else {
      status = 'ongoing'
    }
  }

  const weekLabel = currentWeek && currentWeek > 0 ? `第 ${currentWeek} 周` : '未开学'
  const semesterLabel = `${normalized.academicYear} 学年 第 ${normalized.semester} 学期`

  return {
    ...normalized,
    currentWeek,
    status,
    weekLabel,
    semesterLabel,
    fullLabel: `${semesterLabel} ${weekLabel}`
  }
}
