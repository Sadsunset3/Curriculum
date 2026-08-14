import { STORAGE_KEY, buildCourseColorKey } from './courseFormat.js'

function normalizeCourse(course) {
  const now = Date.now()
  const name = String(course.name || '').trim()
  return {
    id: course.id || `course_${now}_${Math.random().toString(16).slice(2)}`,
    name,
    weekday: Number(course.weekday),
    sections: Array.isArray(course.sections) ? course.sections.map(Number) : [],
    classroom: String(course.classroom || '').trim(),
    teacher: String(course.teacher || '').trim(),
    weeks: Array.isArray(course.weeks) && course.weeks.length >= 2 ? course.weeks.map(Number) : [1, 16],
    weekMode: ['odd', 'even'].includes(course.weekMode) ? course.weekMode : 'all',
    colorKey: typeof course.colorKey === 'number' ? course.colorKey : buildCourseColorKey(name),
    createdAt: course.createdAt || now,
    updatedAt: course.updatedAt || now
  }
}

export function getCourses() {
  try {
    const courses = uni.getStorageSync(STORAGE_KEY)
    return Array.isArray(courses) ? courses.map(normalizeCourse) : []
  } catch (error) {
    return []
  }
}

export function saveCourses(courses) {
  const normalized = Array.isArray(courses) ? courses.map(normalizeCourse) : []
  uni.setStorageSync(STORAGE_KEY, normalized)
  return normalized
}

export function getCourseById(id) {
  return getCourses().find((course) => course.id === id)
}

export function addCourse(course) {
  const courses = getCourses()
  const nextCourse = normalizeCourse(course)
  saveCourses([nextCourse, ...courses])
  return nextCourse
}

export function updateCourse(id, patch) {
  const courses = getCourses()
  let updatedCourse = null
  const nextCourses = courses.map((course) => {
    if (course.id !== id) return course
    updatedCourse = normalizeCourse({
      ...course,
      ...patch,
      id: course.id,
      createdAt: course.createdAt,
      updatedAt: Date.now()
    })
    return updatedCourse
  })
  saveCourses(nextCourses)
  return updatedCourse
}

export function deleteCourse(id) {
  const courses = getCourses()
  saveCourses(courses.filter((course) => course.id !== id))
}
