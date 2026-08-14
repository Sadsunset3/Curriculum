<template>
  <view class="page">
    <view class="header">
      <view class="header-top">
        <view class="header-main">
          <text class="eyebrow">{{ termInfo.semesterLabel }}</text>
          <view class="title-row">
            <button class="week-nav" :class="{ disabled: !canGoPrevWeek }" @tap="changeWeek(-1)">‹</button>
            <text class="title">{{ weekHeadline }}</text>
            <button class="week-nav" :class="{ disabled: !canGoNextWeek }" @tap="changeWeek(1)">›</button>
          </view>
        </view>

        <button class="share-button" @tap="shareSchedule">分享</button>
      </view>

      <text class="subtitle">{{ weekSubline }}</text>
    </view>

    <scroll-view scroll-x class="week-scroll">
      <view class="week-grid">
        <view
          v-for="day in weekdays"
          :key="day.value"
          class="day-column"
          :class="{ active: day.value === todayWeekday }"
        >
          <view class="day-head">
            <text class="day-label">{{ day.label }}</text>
            <text class="day-count">{{ coursesByDay(day.value).length }} 门</text>
          </view>

          <view class="day-slots">
            <view
              v-for="slot in daySlots(day.value)"
              :key="`${day.value}-${slot.key}`"
              class="slot-card"
              :class="{ empty: !slot.course }"
            >
              <template v-if="slot.course">
                <view class="mini-top">
                  <text class="mini-section">{{ slot.label }}</text>
                  <text v-if="slot.course.weekMode !== 'all'" class="mini-tag">{{ weekModeLabel(slot.course.weekMode) }}</text>
                </view>
                <text class="mini-name">{{ slot.course.name }}</text>
                <text class="mini-meta">{{ courseMeta(slot.course) }}</text>
              </template>

              <template v-else>
                <text class="empty-section">{{ slot.label }}</text>
                <text class="empty-copy">本节无课</text>
              </template>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script>
import { getCourses } from '@/utils/courseStorage.js'
import {
  getSectionLabel,
  getWeekModeLabel,
  getTodayWeekday,
  isCourseActiveForWeek,
  sortBySection,
  SECTION_OPTIONS,
  WEEKDAYS
} from '@/utils/courseFormat.js'
import { getCurrentTermInfo, getTermConfig } from '@/utils/termConfig.js'

export default {
  data() {
    return {
      courses: [],
      weekdays: WEEKDAYS,
      sectionOptions: SECTION_OPTIONS,
      todayWeekday: getTodayWeekday(),
      termInfo: getCurrentTermInfo(),
      viewingWeek: 1
    }
  },
  computed: {
    weekHeadline() {
      return `第 ${this.viewingWeek} 周`
    },
    weekSubline() {
      if (this.termInfo.status === 'before') return `当前未开学，正在预览第 ${this.viewingWeek} 周课表`
      if (this.termInfo.status === 'after') return `当前学期已结束，正在预览第 ${this.viewingWeek} 周课表`
      if (this.viewingWeek !== this.termInfo.currentWeek) {
        return `当前学期进行到第 ${this.termInfo.currentWeek} 周，正在预览第 ${this.viewingWeek} 周`
      }
      return '当前按固定节次展示本周课程，可左右切换预览其他周。'
    },
    canGoPrevWeek() {
      return this.viewingWeek > 1
    },
    canGoNextWeek() {
      return this.viewingWeek < Number(this.termInfo.totalWeeks || 1)
    }
  },
  onShow() {
    this.todayWeekday = getTodayWeekday()
    this.courses = getCourses()
    this.termInfo = getCurrentTermInfo(getTermConfig())
    this.viewingWeek = this.getInitialViewingWeek()
  },
  methods: {
    getInitialViewingWeek() {
      const totalWeeks = Number(this.termInfo.totalWeeks || 1)
      if (this.termInfo.currentWeek && this.termInfo.currentWeek >= 1 && this.termInfo.currentWeek <= totalWeeks) {
        return this.termInfo.currentWeek
      }
      if (this.termInfo.status === 'after') return totalWeeks
      return 1
    },
    changeWeek(step) {
      const nextWeek = this.viewingWeek + Number(step)
      if (nextWeek < 1 || nextWeek > Number(this.termInfo.totalWeeks || 1)) return
      this.viewingWeek = nextWeek
    },
    coursesByDay(weekday) {
      return this.courses
        .filter((course) => Number(course.weekday) === Number(weekday))
        .filter((course) => isCourseActiveForWeek(course, this.viewingWeek))
        .sort(sortBySection)
    },
    daySlots(weekday) {
      const courses = this.coursesByDay(weekday)
      return this.sectionOptions.map((option) => {
        const course = courses.find((item) => this.sameSections(item.sections, option.value))
        return {
          key: option.value.join('-'),
          label: getSectionLabel(option.value),
          course
        }
      })
    },
    sameSections(a, b) {
      return Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((value, index) => Number(value) === Number(b[index]))
    },
    weekModeLabel(weekMode) {
      return getWeekModeLabel(weekMode)
    },
    courseMeta(course) {
      return [course.classroom, course.teacher].filter(Boolean).join(' · ')
    },
    buildSharePayload() {
      const termConfig = getTermConfig()
      const courses = getCourses()
        .slice()
        .sort((a, b) => {
          if (Number(a.weekday) !== Number(b.weekday)) return Number(a.weekday) - Number(b.weekday)
          return sortBySection(a, b)
        })
        .map((course) => ({
          name: course.name,
          weekday: Number(course.weekday),
          sections: Array.isArray(course.sections) ? course.sections.map(Number) : [],
          weeks: Array.isArray(course.weeks) ? course.weeks.map(Number) : [1, 16],
          weekMode: course.weekMode || 'all',
          classroom: String(course.classroom || '').trim(),
          teacher: String(course.teacher || '').trim()
        }))

      return JSON.stringify(
        {
          termConfig,
          courses
        },
        null,
        2
      )
    },
    shareSchedule() {
      if (!this.courses.length) {
        uni.showToast({
          title: '当前还没有课程可分享',
          icon: 'none'
        })
        return
      }

      uni.setClipboardData({
        data: this.buildSharePayload(),
        success: () => {
          uni.showModal({
            title: '已复制课表',
            content: '已复制全部课程。你可以直接粘贴发给其他人使用，对方打开“智能导入课表”后，从剪贴板读取并确认导入即可。',
            showCancel: false,
            confirmText: '我知道了'
          })
        },
        fail: () => {
          uni.showToast({
            title: '复制失败，请重试',
            icon: 'none'
          })
        }
      })
    }
  }
}
</script>

<style>
.page {
  min-height: 100vh;
  padding: 40rpx 0 140rpx 28rpx;
  background: #f5f6f8;
  color: #111827;
  box-sizing: border-box;
}

.header {
  padding-right: 28rpx;
  margin-bottom: 24rpx;
}

.header-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20rpx;
}

.header-main {
  flex: 1;
  min-width: 0;
}

.eyebrow {
  display: block;
  margin-bottom: 10rpx;
  color: #6b7280;
  font-size: 24rpx;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 18rpx;
}

.week-nav {
  width: 68rpx;
  height: 68rpx;
  padding: 0;
  border-radius: 999rpx;
  background: #ffffff;
  color: #111827;
  font-size: 42rpx;
  line-height: 68rpx;
  text-align: center;
  box-shadow: 0 6rpx 18rpx rgba(15, 23, 42, 0.06);
}

.week-nav.disabled {
  color: #cbd5e1;
}

.share-button {
  flex-shrink: 0;
  min-width: 120rpx;
  height: 68rpx;
  margin: 0;
  padding: 0 24rpx;
  border-radius: 999rpx;
  background: #111827;
  color: #ffffff;
  font-size: 26rpx;
  line-height: 68rpx;
  text-align: center;
  box-shadow: 0 8rpx 18rpx rgba(17, 24, 39, 0.12);
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

.week-scroll {
  width: 100%;
}

.week-grid {
  display: flex;
  width: 1756rpx;
  padding-right: 28rpx;
}

.day-column {
  width: 232rpx;
  min-height: 980rpx;
  margin-right: 16rpx;
  padding: 20rpx;
  border-radius: 20rpx;
  background: #ffffff;
  box-sizing: border-box;
}

.day-column:last-child {
  margin-right: 0;
}

.day-column.active {
  background: #eef5ff;
}

.day-head {
  margin-bottom: 18rpx;
}

.day-label {
  display: block;
  font-size: 30rpx;
  font-weight: 700;
}

.day-count {
  display: block;
  margin-top: 8rpx;
  color: #6b7280;
  font-size: 22rpx;
}

.day-slots {
  display: flex;
  flex-direction: column;
  gap: 14rpx;
}

.slot-card {
  min-height: 168rpx;
  padding: 18rpx;
  border-radius: 16rpx;
  background: #f1f3f5;
  box-sizing: border-box;
}

.slot-card.empty {
  background: #f8fafc;
  border: 2rpx dashed #e5e7eb;
}

.mini-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12rpx;
  margin-bottom: 8rpx;
}

.mini-section,
.empty-section {
  font-size: 20rpx;
  font-weight: 700;
  color: #374151;
}

.mini-tag {
  flex-shrink: 0;
  padding: 4rpx 12rpx;
  border-radius: 999rpx;
  background: rgba(17, 24, 39, 0.08);
  color: #374151;
  font-size: 20rpx;
}

.mini-name {
  display: block;
  font-size: 28rpx;
  line-height: 1.32;
  font-weight: 700;
  color: #111827;
}

.mini-meta {
  display: block;
  margin-top: 10rpx;
  color: #4b5563;
  font-size: 22rpx;
  line-height: 1.45;
}

.empty-copy {
  display: block;
  margin-top: 18rpx;
  color: #9ca3af;
  font-size: 22rpx;
  line-height: 1.45;
}
</style>
