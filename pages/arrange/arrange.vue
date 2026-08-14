<template>
  <view class="page">
    <view class="hero">
      <text class="title">安排</text>
      <text class="subtitle">记录课程便签和带日期的安排，全部只保存在本地设备。</text>
    </view>

    <view class="segment">
      <button class="segment-button" :class="{ active: activeTab === 'event' }" @tap="activeTab = 'event'">事件</button>
      <button class="segment-button" :class="{ active: activeTab === 'note' }" @tap="activeTab = 'note'">便签</button>
    </view>

    <view v-if="activeTab === 'note'" class="notes-board">
      <view v-if="notes.length" class="notes-grid">
        <view class="notes-column">
          <view
            v-for="note in noteColumns.left"
            :key="note.id"
            class="note-wrap"
            @tap="openNoteViewer(note)"
            @longpress="confirmDelete(note)"
          >
            <view class="note-card" :style="noteCardStyle(note)">
              <text class="note-content">{{ note.content }}</text>
              <text class="note-time">{{ formatTimestamp(note.createdAt) }}</text>
            </view>
          </view>
        </view>

        <view class="notes-column">
          <view
            v-for="note in noteColumns.right"
            :key="note.id"
            class="note-wrap"
            @tap="openNoteViewer(note)"
            @longpress="confirmDelete(note)"
          >
            <view class="note-card" :style="noteCardStyle(note)">
              <text class="note-content">{{ note.content }}</text>
              <text class="note-time">{{ formatTimestamp(note.createdAt) }}</text>
            </view>
          </view>
        </view>
      </view>

      <view v-else class="empty">
        <text class="empty-title">还没有便签</text>
        <text class="empty-copy">把复习内容、老师提醒和临时备注先贴在这里，随手记录就够了。</text>
      </view>
    </view>

    <view v-else class="events-panel">
      <view v-if="sortedEvents.length" class="event-list">
        <swipe-delete-item
          v-for="event in sortedEvents"
          :key="event.id"
          class="event-wrap"
          @delete="confirmDelete(event)"
        >
          <view class="event-card" :class="{ completed: event.completed }" @tap="openEventEditor(event)">
            <button class="event-toggle" :class="{ completed: event.completed }" @tap.stop="toggleCompleted(event)">
              <text v-if="event.completed" class="event-check">✓</text>
            </button>

            <view class="event-main">
              <view class="event-top">
                <text class="event-title" :class="{ completed: event.completed }">{{ event.title }}</text>
                <text class="event-countdown" :class="{ completed: event.completed }">{{ countdownText(event) }}</text>
              </view>
              <text class="event-date">{{ formatEventDate(event) }}</text>
              <text v-if="event.remark" class="event-remark" :class="{ completed: event.completed }">{{ event.remark }}</text>
            </view>
          </view>
        </swipe-delete-item>
      </view>

      <view v-else class="empty">
        <text class="empty-title">还没有事件</text>
        <text class="empty-copy">把考试、作业截止和需要准备的事情放在这里，剩余天数会自动显示。</text>
      </view>
    </view>

    <button class="fab" @tap="openComposer(activeTab)">+</button>

    <view v-if="viewerVisible" class="viewer-mask" @tap="closeNoteViewer">
      <view class="viewer-card" @tap.stop>
        <view class="viewer-head">
          <text class="viewer-title">便签</text>
          <text class="viewer-close" @tap="closeNoteViewer">关闭</text>
        </view>
        <scroll-view scroll-y class="viewer-scroll">
          <text class="viewer-content">{{ viewingNote.content }}</text>
        </scroll-view>
        <text class="viewer-time">{{ formatTimestamp(viewingNote.createdAt) }}</text>
      </view>
    </view>

    <view v-if="composerVisible" class="composer-mask" @tap="closeComposer">
      <view class="composer-sheet" @tap.stop>
        <view class="composer-head">
          <text class="composer-title">{{ composerTitle }}</text>
          <text class="composer-close" @tap="closeComposer">关闭</text>
        </view>

        <view v-if="composerType === 'note'" class="composer-body">
          <textarea
            class="composer-textarea"
            v-model.trim="noteForm.content"
            :maxlength="-1"
            placeholder="写下复习重点、临时提醒或随手记"
          />
        </view>

        <view v-else class="composer-body">
          <view class="field">
            <text class="field-label">事件标题</text>
            <textarea
              class="field-input title-input"
              v-model.trim="eventForm.title"
              :maxlength="40"
              auto-height
              placeholder="例如：数据库概论作业截止"
            />
          </view>

          <view class="field">
            <text class="field-label">开始日期时间</text>
            <view class="datetime-trigger" @tap="showStartDateTimePicker = true">
              <text class="datetime-value" :class="{ placeholder: !eventForm.startDateTime }">
                {{ eventForm.startDateTime ? formatDateTimeText(eventForm.startDateTime) : '请选择开始日期和时间' }}
              </text>
              <text class="datetime-icon">⌄</text>
            </view>
            <d-datetime-picker
              :value="eventForm.startDateTime"
              :mode="4"
              :show="showStartDateTimePicker"
              placeholder="请选择开始日期和时间"
              @input="eventForm.startDateTime = $event"
              @update:show="showStartDateTimePicker = $event"
              @change="onStartDateTimeChange"
            />
          </view>

          <view class="field">
            <text class="field-label">结束日期时间</text>
            <view class="datetime-trigger" @tap="showEndDateTimePicker = true">
              <text class="datetime-value" :class="{ placeholder: !eventForm.endDateTime }">
                {{ eventForm.endDateTime ? formatDateTimeText(eventForm.endDateTime) : '可不填' }}
              </text>
              <text class="datetime-icon">⌄</text>
            </view>
            <d-datetime-picker
              :value="eventForm.endDateTime"
              :mode="4"
              :show="showEndDateTimePicker"
              placeholder="结束日期和时间"
              @input="eventForm.endDateTime = $event"
              @update:show="showEndDateTimePicker = $event"
              @change="onEndDateTimeChange"
            />
          </view>

          <view class="field">
            <text class="field-label">备注</text>
            <textarea
              class="composer-textarea event-remark-input"
              v-model.trim="eventForm.remark"
              :maxlength="-1"
              placeholder="可选备注，例如地点、需要提交的内容"
            />
          </view>
        </view>

        <button class="save-button" @tap="saveComposer">{{ saveButtonText }}</button>
      </view>
    </view>
  </view>
</template>

<script>
import SwipeDeleteItem from '@/components/swipe-delete-item.vue'
import {
  addEvent,
  addNote,
  deleteArrangementItem,
  getArrangementItems,
  toggleEventCompleted,
  updateEvent
} from '@/utils/arrangementStorage.js'

function parseEventDateTime(dateText) {
  const match = String(dateText || '').match(/^(\d{4})-(\d{2})-(\d{2})(?:\s+(\d{2}):(\d{2}))?$/)
  if (!match) return null
  return new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
    Number(match[4] || 0),
    Number(match[5] || 0)
  )
}

function formatDateTimeValue(date = new Date()) {
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const mi = String(date.getMinutes()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`
}

function normalizeEventForm(event = {}) {
  const dateText = String(event.date || '').trim()
  const legacyMatch = dateText.match(/^(\d{4}-\d{2}-\d{2})(?:\s+(\d{2}:\d{2}))?$/)
  const legacyStartFromSplit = legacyMatch?.[1] && event.startTime ? `${legacyMatch[1]} ${event.startTime}` : ''
  const legacyEndFromSplit = legacyMatch?.[1] && event.endTime ? `${legacyMatch[1]} ${event.endTime}` : ''
  const legacyStart = legacyMatch?.[2] ? `${legacyMatch[1]} ${legacyMatch[2]}` : ''
  const pureDateStart = legacyMatch?.[1] ? `${legacyMatch[1]} 00:00` : ''
  return {
    title: event.title || '',
    startDateTime: event.startDateTime || legacyStart || legacyStartFromSplit || pureDateStart || dateText,
    endDateTime: event.endDateTime || legacyEndFromSplit || '',
    remark: event.remark || ''
  }
}

function getDatePart(dateTime) {
  const match = String(dateTime || '').match(/^(\d{4}-\d{2}-\d{2})/)
  return match ? match[1] : ''
}

function compareDateTime(a, b) {
  return String(a || '').localeCompare(String(b || ''))
}

function getDateTimeStamp(dateText) {
  const date = parseEventDateTime(dateText)
  return date ? date.getTime() : NaN
}

export default {
  components: {
    SwipeDeleteItem
  },
  data() {
    return {
      activeTab: 'event',
      items: [],
      viewerVisible: false,
      viewingNote: {
        content: '',
        createdAt: ''
      },
      composerVisible: false,
      composerType: 'note',
      editingEventId: '',
      showStartDateTimePicker: false,
      showEndDateTimePicker: false,
      noteForm: {
        content: ''
      },
      eventForm: {
        title: '',
        startDateTime: '',
        endDateTime: '',
        remark: ''
      }
    }
  },
  computed: {
    notes() {
      return this.items
        .filter((item) => item.type === 'note')
        .sort((a, b) => Number(b.createdAt) - Number(a.createdAt))
    },
    events() {
      return this.items.filter((item) => item.type === 'event')
    },
    sortedEvents() {
      return [...this.events].sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1
        const aForm = normalizeEventForm(a)
        const bForm = normalizeEventForm(b)
        if (aForm.startDateTime !== bForm.startDateTime) return compareDateTime(aForm.startDateTime, bForm.startDateTime)
        return Number(b.createdAt) - Number(a.createdAt)
      })
    },
    noteColumns() {
      const left = []
      const right = []
      let leftWeight = 0
      let rightWeight = 0

      this.notes.forEach((note) => {
        const weight = this.noteWeight(note)
        if (leftWeight <= rightWeight) {
          left.push(note)
          leftWeight += weight
        } else {
          right.push(note)
          rightWeight += weight
        }
      })

      return { left, right }
    },
    composerTitle() {
      if (this.composerType === 'note') return '新建便签'
      return this.editingEventId ? '编辑事件' : '新建事件'
    },
    saveButtonText() {
      if (this.composerType === 'note') return '保存便签'
      return this.editingEventId ? '保存修改' : '保存事件'
    }
  },
  onShow() {
    this.loadItems()
  },
  methods: {
    loadItems() {
      this.items = getArrangementItems()
    },
    openComposer(type) {
      this.composerType = type
      this.composerVisible = true
      this.editingEventId = ''
      this.closePickers()
      this.noteForm = { content: '' }
      this.eventForm = { title: '', startDateTime: formatDateTimeValue(), endDateTime: '', remark: '' }
    },
    openEventEditor(event) {
      this.composerType = 'event'
      this.composerVisible = true
      this.editingEventId = event.id
      this.closePickers()
      this.eventForm = normalizeEventForm(event)
    },
    openNoteViewer(note) {
      this.viewingNote = {
        content: note.content,
        createdAt: note.createdAt
      }
      this.viewerVisible = true
    },
    closeNoteViewer() {
      this.viewerVisible = false
    },
    closeComposer() {
      this.composerVisible = false
      this.closePickers()
    },
    closePickers() {
      this.showStartDateTimePicker = false
      this.showEndDateTimePicker = false
    },
    onStartDateTimeChange(data) {
      this.eventForm.startDateTime = data && data.value ? data.value : ''
      if (this.eventForm.startDateTime && !this.eventForm.endDateTime) {
        this.eventForm.endDateTime = this.eventForm.startDateTime
      }
    },
    onEndDateTimeChange(data) {
      this.eventForm.endDateTime = data && data.value ? data.value : ''
    },
    saveComposer() {
      if (this.composerType === 'note') {
        if (!this.noteForm.content) {
          uni.showToast({ title: '请先输入便签内容', icon: 'none' })
          return
        }
        addNote(this.noteForm.content)
      } else {
        if (!this.eventForm.title) {
          uni.showToast({ title: '请先输入事件标题', icon: 'none' })
          return
        }
        if (!this.eventForm.startDateTime) {
          uni.showToast({ title: '请选择开始日期时间', icon: 'none' })
          return
        }
        if (this.eventForm.endDateTime) {
          const startTime = getDateTimeStamp(this.eventForm.startDateTime)
          const endTime = getDateTimeStamp(this.eventForm.endDateTime)
          if (!Number.isFinite(startTime) || !Number.isFinite(endTime)) {
            uni.showToast({ title: '请检查日期时间格式', icon: 'none' })
            return
          }
          if (endTime <= startTime) {
            uni.showToast({ title: '结束必须晚于开始', icon: 'none' })
            return
          }
        }
        if (!parseEventDateTime(this.eventForm.startDateTime)) {
          uni.showToast({ title: '请检查开始日期时间', icon: 'none' })
          return
        }
        const payload = {
          ...this.eventForm,
          date: getDatePart(this.eventForm.startDateTime)
        }
        if (this.editingEventId) {
          updateEvent(this.editingEventId, payload)
        } else {
          addEvent(payload)
        }
      }

      this.closeComposer()
      this.loadItems()
      uni.showToast({ title: '已保存', icon: 'success' })
    },
    confirmDelete(item) {
      uni.showModal({
        title: '删除内容',
        content: item.type === 'note' ? '确定删除这张便签吗？' : '确定删除这个事件吗？',
        confirmColor: '#ba1a1a',
        success: (res) => {
          if (!res.confirm) return
          deleteArrangementItem(item.id)
          this.loadItems()
          uni.showToast({ title: '已删除', icon: 'success' })
        }
      })
    },
    toggleCompleted(event) {
      toggleEventCompleted(event.id)
      this.loadItems()
    },
    noteWeight(note) {
      return Math.max(1, Math.ceil(String(note.content || '').length / 16))
    },
    noteCardStyle(note) {
      const height = 180 + (this.noteWeight(note) - 1) * 54
      return `min-height:${height}rpx;`
    },
    formatTimestamp(timestamp) {
      const date = new Date(Number(timestamp))
      const today = new Date()
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()
      const dateStart = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
      const diffDays = Math.round((todayStart - dateStart) / 86400000)
      const hh = String(date.getHours()).padStart(2, '0')
      const mm = String(date.getMinutes()).padStart(2, '0')

      if (diffDays === 0) return `今天 ${hh}:${mm}`
      if (diffDays === 1) return `昨天 ${hh}:${mm}`
      return `${date.getMonth() + 1}月${date.getDate()}日 ${hh}:${mm}`
    },
    formatEventDate(event) {
      const form = normalizeEventForm(event)
      const startText = this.formatDateTimeText(form.startDateTime)
      if (form.endDateTime) return `${startText} - ${this.formatDateTimeText(form.endDateTime)}`
      return startText
    },
    formatDateTimeText(dateText) {
      const date = parseEventDateTime(dateText)
      if (!date) return dateText
      const hh = String(date.getHours()).padStart(2, '0')
      const mm = String(date.getMinutes()).padStart(2, '0')
      return `${date.getMonth() + 1}月${date.getDate()}日 ${hh}:${mm}`
    },
    countdownText(event) {
      const target = parseEventDateTime(normalizeEventForm(event).startDateTime)
      if (!target) return ''

      const today = new Date()
      const base = new Date(today.getFullYear(), today.getMonth(), today.getDate())
      const diff = Math.round((target.getTime() - base.getTime()) / 86400000)

      if (diff === 0) return '今天'
      if (diff > 0) return `还有 ${diff} 天`
      return `已过期 ${Math.abs(diff)} 天`
    }
  }
}
</script>

<style>
.page {
  min-height: 100vh;
  padding: 40rpx 28rpx 170rpx;
  background: #f5f6f8;
  color: #111827;
  box-sizing: border-box;
}

.hero {
  margin-bottom: 26rpx;
}

.title {
  display: block;
  font-size: 52rpx;
  line-height: 1.12;
  font-weight: 700;
}

.subtitle {
  display: block;
  margin-top: 12rpx;
  color: #6b7280;
  font-size: 24rpx;
  line-height: 1.6;
}

.segment {
  display: flex;
  gap: 8rpx;
  margin-bottom: 24rpx;
  padding: 8rpx;
  border-radius: 20rpx;
  background: #eef1f4;
}

.segment-button {
  flex: 1;
  height: 76rpx;
  border-radius: 16rpx;
  background: transparent;
  color: #6b7280;
  font-size: 28rpx;
  line-height: 76rpx;
}

.segment-button.active {
  background: #ffffff;
  color: #111827;
  box-shadow: 0 10rpx 28rpx rgba(15, 23, 42, 0.06);
}

.notes-grid {
  display: flex;
  gap: 16rpx;
  align-items: flex-start;
}

.notes-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.note-wrap,
.event-wrap {
  width: 100%;
}

.note-card,
.event-card,
.empty {
  width: 100%;
  border-radius: 20rpx;
  background: #ffffff;
  box-sizing: border-box;
}

.note-card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 22rpx;
  box-sizing: border-box;
}

.note-content {
  display: block;
  color: #111827;
  font-size: 30rpx;
  line-height: 1.55;
  word-break: break-word;
}

.note-time {
  display: block;
  margin-top: 24rpx;
  color: #9ca3af;
  font-size: 22rpx;
}

.events-panel,
.notes-board {
  min-height: 400rpx;
}

.event-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.event-card {
  display: flex;
  gap: 18rpx;
  align-items: flex-start;
  padding: 24rpx;
}

.event-card.completed {
  opacity: 0.6;
}

.event-toggle {
  width: 48rpx;
  height: 48rpx;
  margin-top: 4rpx;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2rpx solid #cbd5e1;
  border-radius: 999rpx;
  background: #ffffff;
  box-sizing: border-box;
}

.event-toggle.completed {
  border-color: #111827;
  background: #111827;
}

.event-check {
  display: block;
  color: #ffffff;
  font-size: 24rpx;
  font-weight: 700;
  line-height: 1;
}

.event-main {
  flex: 1;
  min-width: 0;
}

.event-top {
  display: flex;
  gap: 14rpx;
  align-items: flex-start;
  justify-content: space-between;
}

.event-title {
  flex: 1;
  font-size: 30rpx;
  line-height: 1.4;
  font-weight: 700;
  color: #111827;
}

.event-title.completed {
  text-decoration: line-through;
}

.event-countdown {
  flex-shrink: 0;
  padding: 6rpx 14rpx;
  border-radius: 999rpx;
  background: #eef1f4;
  color: #4b5563;
  font-size: 22rpx;
}

.event-date {
  display: block;
  margin-top: 10rpx;
  color: #6b7280;
  font-size: 24rpx;
}

.event-remark {
  display: block;
  margin-top: 12rpx;
  color: #374151;
  font-size: 24rpx;
  line-height: 1.6;
}

.event-remark.completed,
.event-countdown.completed {
  opacity: 0.8;
}

.empty {
  padding: 40rpx 32rpx;
}

.empty-title {
  display: block;
  font-size: 34rpx;
  font-weight: 700;
}

.empty-copy {
  display: block;
  margin-top: 14rpx;
  color: #6b7280;
  font-size: 26rpx;
  line-height: 1.6;
}

.fab {
  position: fixed;
  right: 32rpx;
  bottom: 170rpx;
  z-index: 19;
  width: 96rpx;
  height: 96rpx;
  padding: 0;
  border-radius: 999rpx;
  background: #ffffff;
  color: #111827;
  font-size: 52rpx;
  line-height: 96rpx;
  box-shadow: 0 12rpx 30rpx rgba(15, 23, 42, 0.1);
}

.viewer-mask,
.composer-mask {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(17, 24, 39, 0.18);
  z-index: 20;
}

.viewer-card {
  width: calc(100% - 64rpx);
  max-height: 70vh;
  padding: 28rpx;
  border-radius: 28rpx;
  background: #ffffff;
  box-sizing: border-box;
}

.viewer-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20rpx;
}

.viewer-title {
  font-size: 34rpx;
  font-weight: 700;
}

.viewer-close {
  color: #6b7280;
  font-size: 24rpx;
}

.viewer-scroll {
  max-height: 52vh;
}

.viewer-content {
  display: block;
  color: #111827;
  font-size: 30rpx;
  line-height: 1.7;
  word-break: break-word;
}

.viewer-time {
  display: block;
  margin-top: 22rpx;
  color: #9ca3af;
  font-size: 22rpx;
}

.composer-sheet {
  position: relative;
  z-index: 21;
  width: 100%;
  margin-top: auto;
  padding: 28rpx 28rpx calc(28rpx + env(safe-area-inset-bottom));
  border-radius: 28rpx 28rpx 0 0;
  background: #ffffff;
  box-sizing: border-box;
}

.composer-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24rpx;
}

.composer-title {
  font-size: 34rpx;
  font-weight: 700;
}

.composer-close {
  color: #6b7280;
  font-size: 24rpx;
}

.composer-body {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
}

.field-label {
  display: block;
  margin-bottom: 10rpx;
  color: #6b7280;
  font-size: 24rpx;
}

.field-input,
.composer-textarea {
  width: 100%;
  padding: 22rpx;
  border-radius: 18rpx;
  background: #f5f7fa;
  color: #111827;
  font-size: 28rpx;
  line-height: 1.6;
  box-sizing: border-box;
}

.datetime-trigger {
  width: 100%;
  min-height: 92rpx;
  padding: 0 22rpx;
  border-radius: 18rpx;
  background: #f5f7fa;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-sizing: border-box;
}

.datetime-value {
  color: #111827;
  font-size: 28rpx;
  line-height: 1.4;
}

.datetime-value.placeholder {
  color: #9ca3af;
}

.datetime-icon {
  color: #6b7280;
  font-size: 30rpx;
  line-height: 1;
}

.composer-textarea {
  min-height: 240rpx;
}

.title-input {
  min-height: 92rpx;
  max-height: 140rpx;
}

.event-remark-input {
  min-height: 180rpx;
}

.save-button {
  margin-top: 24rpx;
  height: 88rpx;
  border-radius: 18rpx;
  background: #111827;
  color: #ffffff;
  font-size: 30rpx;
  line-height: 88rpx;
}
</style>
