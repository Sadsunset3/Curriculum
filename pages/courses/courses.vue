<template>
  <view class="page">
    <view class="header">
      <view>
        <text class="eyebrow">本地课程</text>
        <text class="title">课程管理</text>
      </view>
      <view class="header-actions">
        <button class="add-button" @tap="goAdd">添加</button>
        <text class="import-entry" @tap="goImportStory">智能导入课表</text>
      </view>
    </view>

    <view class="term-panel">
      <view class="term-head">
        <view>
          <text class="term-title">学期设置</text>
          <text class="term-copy">{{ termInfo.fullLabel }}</text>
        </view>
      </view>

      <view class="term-grid">
        <view class="term-field">
          <text class="term-label">学年</text>
          <input class="term-input" v-model.trim="termForm.academicYear" placeholder="例如：2025-2026" />
        </view>
        <view class="term-field">
          <text class="term-label">学期</text>
          <picker :range="semesterOptions" :value="semesterIndex" @change="onSemesterChange">
            <view class="term-input">{{ semesterOptions[semesterIndex] }}</view>
          </picker>
        </view>
        <view class="term-field">
          <text class="term-label">开学日期</text>
          <picker mode="date" :value="termForm.startDate" @change="onStartDateChange">
            <view class="term-input">{{ termForm.startDate || '请选择日期' }}</view>
          </picker>
        </view>
        <view class="term-field">
          <text class="term-label">总周数</text>
          <picker :range="totalWeekOptions" :value="totalWeekIndex" @change="onTotalWeeksChange">
            <view class="term-input">{{ termForm.totalWeeks }} 周</view>
          </picker>
        </view>
      </view>
      <button class="save-button" @tap="saveTerm">保存学期设置</button>
    </view>

    <view v-if="courses.length" class="course-list">
      <view v-for="course in courses" :key="course.id" class="course-row">
        <view class="course-info" @tap="goEdit(course.id)">
          <view class="name-line">
            <text class="course-name">{{ course.name }}</text>
            <text v-if="course.weekMode !== 'all'" class="week-tag">{{ weekModeLabel(course.weekMode) }}</text>
          </view>
          <text class="course-meta">{{ courseMeta(course) }}</text>
        </view>
        <view class="actions">
          <button class="text-button" @tap="goEdit(course.id)">编辑</button>
          <button class="danger-button" @tap="confirmDelete(course)">删除</button>
        </view>
      </view>
    </view>

    <view v-else class="empty">
      <text class="empty-title">还没有课程</text>
      <text class="empty-copy">
        先设置学期信息，再手动添加课程，或者使用智能导入粘贴外部 AI 整理好的结构化课表。
      </text>
      <button class="primary-button" @tap="goAdd">添加课程</button>
    </view>
  </view>
</template>

<script>
import { deleteCourse, getCourses } from '@/utils/courseStorage.js'
import { getSectionLabel, getWeekModeLabel, getWeekdayLabel, getWeeksLabel, sortBySection } from '@/utils/courseFormat.js'
import { getCurrentTermInfo, getTermConfig, saveTermConfig } from '@/utils/termConfig.js'

export default {
  data() {
    return {
      courses: [],
      semesterOptions: ['第一学期', '第二学期'],
      totalWeekOptions: Array.from({ length: 30 }, (_, index) => String(index + 1)),
      termForm: {
        academicYear: '',
        semester: 1,
        startDate: '',
        totalWeeks: 20
      }
    }
  },
  computed: {
    termInfo() {
      return getCurrentTermInfo(this.termForm)
    },
    semesterIndex() {
      return Number(this.termForm.semester) === 2 ? 1 : 0
    },
    totalWeekIndex() {
      return Math.max(0, Number(this.termForm.totalWeeks) - 1)
    }
  },
  onShow() {
    this.termForm = { ...getTermConfig() }
    this.loadCourses()
    this.maybeRemindTermSettings()
  },
  methods: {
    maybeRemindTermSettings() {
      const shouldFocus = uni.getStorageSync('curriculum_focus_term_settings')
      if (!shouldFocus) return
      uni.removeStorageSync('curriculum_focus_term_settings')
      uni.showModal({
        title: '检查学期设置',
        content: '请先检查并修改学年、学期、开学日期和总周数，再确认课程内容。',
        showCancel: false,
        confirmText: '知道了'
      })
    },
    loadCourses() {
      this.courses = getCourses().sort((a, b) => {
        const weekdayDiff = Number(a.weekday) - Number(b.weekday)
        return weekdayDiff || sortBySection(a, b)
      })
    },
    courseMeta(course) {
      return [
        getWeekdayLabel(course.weekday),
        getSectionLabel(course.sections),
        getWeeksLabel(course.weeks),
        course.classroom,
        course.teacher
      ].filter(Boolean).join(' · ')
    },
    weekModeLabel(weekMode) {
      return getWeekModeLabel(weekMode)
    },
    onSemesterChange(event) {
      this.termForm.semester = Number(event.detail.value) === 1 ? 2 : 1
    },
    onStartDateChange(event) {
      this.termForm.startDate = event.detail.value
    },
    onTotalWeeksChange(event) {
      this.termForm.totalWeeks = Number(event.detail.value) + 1
    },
    saveTerm() {
      this.termForm = saveTermConfig(this.termForm)
      uni.showToast({ title: '已保存', icon: 'success' })
    },
    goAdd() {
      uni.navigateTo({ url: '/pages/course-form/course-form' })
    },
    goEdit(id) {
      uni.navigateTo({ url: `/pages/course-form/course-form?id=${id}` })
    },
    goImportStory() {
      uni.navigateTo({ url: '/pages/import-story/import-story' })
    },
    confirmDelete(course) {
      uni.showModal({
        title: '删除课程',
        content: `确定删除“${course.name}”吗？`,
        confirmColor: '#ba1a1a',
        success: (res) => {
          if (!res.confirm) return
          deleteCourse(course.id)
          this.loadCourses()
          uni.showToast({ title: '已删除', icon: 'success' })
        }
      })
    }
  }
}
</script>

<style>
.page {
  min-height: 100vh;
  padding: 40rpx 32rpx 140rpx;
  background: #f5f6f8;
  color: #111827;
  box-sizing: border-box;
}

.header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 28rpx;
}

.header-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.eyebrow {
  display: block;
  margin-bottom: 10rpx;
  color: #6b7280;
  font-size: 24rpx;
}

.title {
  display: block;
  font-size: 52rpx;
  line-height: 1.12;
  font-weight: 700;
}

.term-panel,
.course-row,
.empty {
  border-radius: 20rpx;
  background: #ffffff;
}

.term-panel {
  margin-bottom: 18rpx;
  padding: 24rpx;
}

.term-head {
  margin-bottom: 18rpx;
}

.term-title {
  display: block;
  font-size: 30rpx;
  font-weight: 700;
}

.term-copy {
  display: block;
  margin-top: 10rpx;
  color: #6b7280;
  font-size: 24rpx;
  line-height: 1.5;
}

.term-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.term-field {
  width: calc(50% - 8rpx);
  min-width: 0;
}

.term-label {
  display: block;
  margin-bottom: 10rpx;
  color: #6b7280;
  font-size: 22rpx;
}

.term-input {
  height: 80rpx;
  padding: 0 22rpx;
  border-radius: 14rpx;
  background: #f8fafc;
  color: #111827;
  font-size: 28rpx;
  line-height: 80rpx;
  box-sizing: border-box;
}

.add-button,
.primary-button,
.save-button {
  height: 76rpx;
  border-radius: 14rpx;
  color: #ffffff;
  background: #111827;
  font-size: 28rpx;
  line-height: 76rpx;
}

.add-button {
  width: 128rpx;
}

.save-button {
  margin-top: 18rpx;
}

.import-entry {
  display: block;
  margin-top: 14rpx;
  color: #2563eb;
  font-size: 22rpx;
  line-height: 1.5;
}

.course-list {
  display: flex;
  flex-direction: column;
  gap: 14rpx;
}

.course-row {
  display: flex;
  align-items: center;
  padding: 24rpx;
}

.course-info {
  flex: 1;
  min-width: 0;
  margin-right: 18rpx;
}

.name-line {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.course-name {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 32rpx;
  font-weight: 700;
}

.week-tag {
  flex-shrink: 0;
  padding: 4rpx 14rpx;
  border-radius: 999rpx;
  background: #eef2f7;
  color: #4b5563;
  font-size: 20rpx;
}

.course-meta {
  display: block;
  margin-top: 10rpx;
  color: #6b7280;
  font-size: 24rpx;
  line-height: 1.5;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
  width: 112rpx;
}

.text-button,
.danger-button {
  height: 56rpx;
  padding: 0;
  border-radius: 12rpx;
  font-size: 24rpx;
  line-height: 56rpx;
  background: #f5f6f8;
}

.text-button {
  color: #2563eb;
}

.danger-button {
  color: #ba1a1a;
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
  margin: 16rpx 0 28rpx;
  color: #6b7280;
  font-size: 26rpx;
  line-height: 1.6;
}
</style>
