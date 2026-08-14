const STORAGE_KEY = 'curriculum_arrangements_v1'

function createId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`
}

function getDatePart(dateTime) {
  const match = String(dateTime || '').trim().match(/^(\d{4}-\d{2}-\d{2})/)
  return match ? match[1] : ''
}

function normalizeDateTimeRange(item = {}) {
  const dateText = String(item.date || '').trim()
  const match = dateText.match(/^(\d{4}-\d{2}-\d{2})(?:\s+(\d{2}:\d{2}))?$/)
  const legacyStart = match?.[2] ? `${match[1]} ${match[2]}` : ''
  const legacyStartFromSplit = match?.[1] && item.startTime ? `${match[1]} ${String(item.startTime).trim()}` : ''
  const legacyEndFromSplit = match?.[1] && item.endTime ? `${match[1]} ${String(item.endTime).trim()}` : ''
  const pureDateStart = match?.[1] ? `${match[1]} 00:00` : ''
  const startDateTime = String(item.startDateTime || legacyStart || legacyStartFromSplit || pureDateStart || dateText).trim()
  const endDateTime = String(item.endDateTime || legacyEndFromSplit || '').trim()

  return {
    date: getDatePart(startDateTime) || (match ? match[1] : dateText),
    startDateTime,
    endDateTime
  }
}

function normalizeItem(item = {}) {
  const now = Date.now()
  const type = item.type === 'event' ? 'event' : 'note'

  if (type === 'event') {
    const timeInfo = normalizeDateTimeRange(item)
    return {
      id: item.id || createId('event'),
      type: 'event',
      title: String(item.title || '').trim(),
      date: timeInfo.date,
      startDateTime: timeInfo.startDateTime,
      endDateTime: timeInfo.endDateTime,
      remark: String(item.remark || '').trim(),
      completed: Boolean(item.completed),
      createdAt: Number(item.createdAt) || now,
      updatedAt: Number(item.updatedAt) || now
    }
  }

  return {
    id: item.id || createId('note'),
    type: 'note',
    content: String(item.content || '').trim(),
    createdAt: Number(item.createdAt) || now,
    updatedAt: Number(item.updatedAt) || now
  }
}

export function getArrangementItems() {
  try {
    const items = uni.getStorageSync(STORAGE_KEY)
    return Array.isArray(items) ? items.map(normalizeItem) : []
  } catch (error) {
    return []
  }
}

export function saveArrangementItems(items) {
  const normalized = Array.isArray(items) ? items.map(normalizeItem) : []
  uni.setStorageSync(STORAGE_KEY, normalized)
  return normalized
}

export function addNote(content) {
  const items = getArrangementItems()
  const note = normalizeItem({
    type: 'note',
    content
  })
  saveArrangementItems([note, ...items])
  return note
}

export function addEvent(payload) {
  const items = getArrangementItems()
  const event = normalizeItem({
    type: 'event',
    ...payload,
    completed: false
  })
  saveArrangementItems([event, ...items])
  return event
}

export function updateEvent(id, payload) {
  const items = getArrangementItems()
  let updated = null
  const nextItems = items.map((item) => {
    if (item.id !== id || item.type !== 'event') return item
    updated = normalizeItem({
      ...item,
      ...payload,
      type: 'event',
      completed: item.completed,
      updatedAt: Date.now()
    })
    return updated
  })
  saveArrangementItems(nextItems)
  return updated
}

export function toggleEventCompleted(id) {
  const items = getArrangementItems()
  let updated = null
  const nextItems = items.map((item) => {
    if (item.id !== id || item.type !== 'event') return item
    updated = normalizeItem({
      ...item,
      completed: !item.completed,
      updatedAt: Date.now()
    })
    return updated
  })
  saveArrangementItems(nextItems)
  return updated
}

export function deleteArrangementItem(id) {
  const items = getArrangementItems()
  saveArrangementItems(items.filter((item) => item.id !== id))
}
