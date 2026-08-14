import { saveCourses } from './courseStorage.js'
import { saveTermConfig } from './termConfig.js'

export const IMPORT_PROMPT = `你是“课表结构化整理助手”。

我会给你课表截图、PDF、Excel 导出内容或 OCR 文本。你的任务不是解释，而是把课表整理成固定 JSON，供“校园课表”App 直接解析导入。

你的输出规则:
1. 只输出 JSON 本体，不要输出解释、备注、标题、前后缀、Markdown 代码块。
2. 如果同一门课出现在不同星期、不同节次、不同周次，必须拆成多条 course 记录。
3. 如果教师、教室缺失，输出空字符串 ""。
4. weekday 必须是 1-7 的数字，其中 1=周一，2=周二，3=周三，4=周四，5=周五，6=周六，7=周日。
5. sections 只能输出以下数组之一:
   [1,2]
   [3,4]
   [5,6]
   [7,8]
   [9,10]
   [11,12]
6. weeks 必须输出长度为 2 的数组 [开始周, 结束周]，例如 [1,16]。
7. weekMode 只能输出 "all"、"odd"、"even" 三选一。
   "all" 表示每周
   "odd" 表示单周
   "even" 表示双周
8. semester 只能输出数字 1 或 2。
9. startDate 必须是 YYYY-MM-DD 格式。
10. totalWeeks 必须是 1-30 的整数。
11. academicYear 必须是 YYYY-YYYY 格式，例如 "2025-2026"。
12. 如果无法完全确定，请尽量根据上下文合理推断；实在无法判断的字段按以下规则处理:
   academicYear: 尽量推断
   semester: 尽量推断，无法判断时优先填 1
   startDate: 无法判断时根据学期和常见开学时间合理推断
   totalWeeks: 无法判断时合理推断，常见值可用 16/18/20
   teacher: ""
   classroom: ""
13. 不要省略字段，不要新增解释性文字。

输出 JSON 结构必须严格等于:
{
  "termConfig": {
    "academicYear": "2025-2026",
    "semester": 1,
    "startDate": "2025-09-01",
    "totalWeeks": 20
  },
  "courses": [
    {
      "name": "高等数学",
      "weekday": 1,
      "sections": [1, 2],
      "weeks": [1, 16],
      "weekMode": "all",
      "classroom": "A101",
      "teacher": "王老师"
    },
    {
      "name": "大学英语",
      "weekday": 3,
      "sections": [3, 4],
      "weeks": [1, 16],
      "weekMode": "odd",
      "classroom": "B203",
      "teacher": "李老师"
    }
  ]
}

再次强调:
- 只返回 JSON
- 不要使用 \`\`\`json
- 不要说“以下是整理结果”
- 课程数组中的每一项都必须是一个可直接导入的上课时段`

const VALID_SECTION_KEYS = new Set(['1,2', '3,4', '5,6', '7,8', '9,10', '11,12'])
const VALID_WEEK_MODES = new Set(['all', 'odd', 'even'])

class ImportValidationError extends Error {
  constructor(message, path = '') {
    super(message)
    this.name = 'ImportValidationError'
    this.path = path
  }
}

function isObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value)
}

function createValidationError(message, path = '') {
  return new ImportValidationError(message, path)
}

function normalizeJsonText(text) {
  let normalized = String(text || '').trim()
  if (!normalized) return ''

  normalized = normalized.replace(/^\uFEFF/, '').trim()

  const fenced = normalized.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)
  if (fenced) {
    normalized = fenced[1].trim()
  }

  const firstBrace = normalized.indexOf('{')
  const lastBrace = normalized.lastIndexOf('}')
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace >= firstBrace) {
    normalized = normalized.slice(firstBrace, lastBrace + 1)
  }

  return normalized.trim()
}

function getLineNumberFromPosition(text, position) {
  if (!Number.isInteger(position) || position < 0) return null
  return String(text || '')
    .slice(0, position)
    .split('\n').length
}

function findLineNumberForPath(text, path) {
  if (!path) return null

  const lines = String(text || '').split('\n')

  const topFieldMatch = path.match(/^termConfig\.(\w+)$/)
  if (topFieldMatch) {
    const key = `"${topFieldMatch[1]}"`
    const lineIndex = lines.findIndex((line) => line.includes(key))
    return lineIndex >= 0 ? lineIndex + 1 : null
  }

  if (path === 'termConfig') {
    const lineIndex = lines.findIndex((line) => line.includes('"termConfig"'))
    return lineIndex >= 0 ? lineIndex + 1 : null
  }

  if (path === 'courses') {
    const lineIndex = lines.findIndex((line) => line.includes('"courses"'))
    return lineIndex >= 0 ? lineIndex + 1 : null
  }

  const courseFieldMatch = path.match(/^courses\[(\d+)\](?:\.(\w+))?$/)
  if (!courseFieldMatch) return null

  const courseIndex = Number(courseFieldMatch[1])
  const field = courseFieldMatch[2] || ''

  let currentCourseIndex = -1
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i]
    if (line.includes('"name"')) {
      currentCourseIndex += 1
      if (currentCourseIndex === courseIndex) {
        if (!field) return i + 1

        const fieldKey = `"${field}"`
        for (let j = i; j < lines.length; j += 1) {
          if (j > i && lines[j].includes('"name"')) break
          if (lines[j].includes(fieldKey)) return j + 1
        }
        return i + 1
      }
    }
  }

  return null
}

function formatImportError(error, normalizedText) {
  if (error instanceof ImportValidationError) {
    const lineNumber = findLineNumberForPath(normalizedText, error.path)
    const pathText = error.path ? `字段 ${error.path}` : '导入内容'
    const lineText = lineNumber ? `第 ${lineNumber} 行附近，` : ''
    return `${lineText}${pathText}有问题：${error.message}`
  }

  const syntaxPositionMatch = String(error && error.message || '').match(/position\s+(\d+)/i)
  if (syntaxPositionMatch) {
    const lineNumber = getLineNumberFromPosition(normalizedText, Number(syntaxPositionMatch[1]))
    if (lineNumber) {
      return `第 ${lineNumber} 行附近的 JSON 语法有问题，请让外部 AI 只返回合法 JSON`
    }
  }

  return error && error.message
    ? `导入内容有问题：${error.message}`
    : '导入内容格式错误'
}

function parseJson(text) {
  const normalized = normalizeJsonText(text)
  if (!normalized) {
    throw new Error('请先粘贴外部 AI 输出的 JSON 课表内容')
  }

  try {
    return {
      payload: JSON.parse(normalized),
      normalizedText: normalized
    }
  } catch (error) {
    throw new Error(formatImportError(error, normalized))
  }
}

function assertAcademicYear(value, path) {
  const text = String(value || '').trim()
  if (!/^\d{4}-\d{4}$/.test(text)) {
    throw createValidationError('必须使用如 2025-2026 的格式', path)
  }
  return text
}

function assertSemester(value, path) {
  const semester = Number(value)
  if (![1, 2].includes(semester)) {
    throw createValidationError('只能是 1 或 2', path)
  }
  return semester
}

function assertStartDate(value, path) {
  const text = String(value || '').trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    throw createValidationError('必须是 YYYY-MM-DD 格式', path)
  }
  return text
}

function assertTotalWeeks(value, path) {
  const totalWeeks = Number(value)
  if (!Number.isInteger(totalWeeks) || totalWeeks < 1 || totalWeeks > 30) {
    throw createValidationError('必须是 1-30 的整数', path)
  }
  return totalWeeks
}

function assertWeekday(value, path) {
  const weekday = Number(value)
  if (!Number.isInteger(weekday) || weekday < 1 || weekday > 7) {
    throw createValidationError('必须是 1-7 的数字', path)
  }
  return weekday
}

function assertSections(value, path) {
  if (!Array.isArray(value) || value.length !== 2) {
    throw createValidationError('必须是长度为 2 的数组', path)
  }

  const sections = value.map((item) => Number(item))
  if (sections.some((item) => !Number.isInteger(item))) {
    throw createValidationError('节次必须是整数', path)
  }

  const key = sections.join(',')
  if (!VALID_SECTION_KEYS.has(key)) {
    throw createValidationError('目前只支持 [1,2] [3,4] [5,6] [7,8] [9,10] [11,12]', path)
  }

  return sections
}

function assertWeeks(value, path) {
  if (!Array.isArray(value) || value.length !== 2) {
    throw createValidationError('必须是 [开始周, 结束周]', path)
  }

  const weeks = value.map((item) => Number(item))
  const [start, end] = weeks

  if (weeks.some((item) => !Number.isInteger(item) || item < 1 || item > 30)) {
    throw createValidationError('周次必须是 1-30 的整数', path)
  }
  if (start > end) {
    throw createValidationError('开始周不能大于结束周', path)
  }

  return weeks
}

function assertWeekMode(value, path) {
  const weekMode = String(value || '').trim()
  if (!VALID_WEEK_MODES.has(weekMode)) {
    throw createValidationError('只能是 all、odd、even', path)
  }
  return weekMode
}

function normalizeCourse(course, index) {
  const basePath = `courses[${index}]`

  if (!isObject(course)) {
    throw createValidationError('必须是对象', basePath)
  }

  const name = String(course.name || '').trim()
  if (!name) {
    throw createValidationError('缺少 name', `${basePath}.name`)
  }

  return {
    name,
    weekday: assertWeekday(course.weekday, `${basePath}.weekday`),
    sections: assertSections(course.sections, `${basePath}.sections`),
    weeks: assertWeeks(course.weeks, `${basePath}.weeks`),
    weekMode: assertWeekMode(course.weekMode, `${basePath}.weekMode`),
    classroom: String(course.classroom || '').trim(),
    teacher: String(course.teacher || '').trim()
  }
}

export function parseScheduleImportText(text) {
  const { payload, normalizedText } = parseJson(text)

  try {
    if (!isObject(payload)) {
      throw createValidationError('JSON 顶层必须是对象')
    }

    const { termConfig, courses } = payload

    if (!isObject(termConfig)) {
      throw createValidationError('缺少 termConfig 对象', 'termConfig')
    }

    if (!Array.isArray(courses) || !courses.length) {
      throw createValidationError('缺少 courses 数组，且至少要有一门课程', 'courses')
    }

    return {
      termConfig: {
        academicYear: assertAcademicYear(termConfig.academicYear, 'termConfig.academicYear'),
        semester: assertSemester(termConfig.semester, 'termConfig.semester'),
        startDate: assertStartDate(termConfig.startDate, 'termConfig.startDate'),
        totalWeeks: assertTotalWeeks(termConfig.totalWeeks, 'termConfig.totalWeeks')
      },
      courses: courses.map((course, index) => normalizeCourse(course, index))
    }
  } catch (error) {
    throw new Error(formatImportError(error, normalizedText))
  }
}

export function buildImportFeedbackPrompt(jsonText, errorMessage) {
  const content = String(jsonText || '').trim()
  const reason = String(errorMessage || 'JSON 结构不符合要求').trim()

  return `你上一次返回的课表 JSON 无法导入“校园课表”App，请严格按原要求修正。

导入失败原因:
${reason}

修正规则:
1. 只输出修正后的 JSON，不要输出解释，不要输出 Markdown 代码块。
2. 保留正确字段，只修正有问题的部分。
3. 顶层必须只有 termConfig 和 courses。
4. courses 中每一项必须包含:
   name
   weekday
   sections
   weeks
   weekMode
   classroom
   teacher
5. weekday 必须是 1-7 的数字。
6. sections 只能是 [1,2] [3,4] [5,6] [7,8] [9,10] [11,12] 之一。
7. weeks 必须是 [开始周, 结束周]。
8. weekMode 只能是 "all"、"odd"、"even"。
9. semester 只能是 1 或 2。
10. startDate 必须是 YYYY-MM-DD。
11. totalWeeks 必须是 1-30 的整数。
12. academicYear 必须是 YYYY-YYYY。
13. 如果错误信息里提到“第 X 行附近”或具体字段路径，例如 courses[3].sections，请优先修正那个位置。

这是你上一次返回的 JSON，请直接在它的基础上修正并重新完整输出:
${content}`
}

export function importScheduleText(text) {
  const parsed = parseScheduleImportText(text)
  const termConfig = saveTermConfig(parsed.termConfig)
  const courses = saveCourses(parsed.courses)
  return { termConfig, courses }
}
