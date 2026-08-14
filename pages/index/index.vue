<template>
  <view class="page">
    <view class="hero">
      <view>
        <text class="eyebrow">{{ todayText }}</text>
        <text class="title">今日课程</text>
        <text class="subtitle">{{ termInfo.fullLabel }}</text>
      </view>
    </view>

    <view class="summary">
      <view>
        <text class="summary-number">{{ todayCourses.length }}</text>
        <text class="summary-label">门课</text>
      </view>
      <text class="summary-copy">{{ summaryCopy }}</text>
    </view>

    <view v-if="todayCourses.length" class="course-list">
      <view
        v-for="course in todayCourses"
        :key="course.id"
        class="course-card"
        :style="courseStyle(course)"
      >
        <view class="course-main">
          <view class="course-top">
            <text class="course-time">{{ sectionTime(course.sections) || sectionLabel(course.sections) }}</text>
            <text v-if="course.weekMode !== 'all'" class="course-tag">{{ weekModeLabel(course.weekMode) }}</text>
          </view>
          <text class="course-name">{{ course.name }}</text>
          <text class="course-meta">{{ metaText(course) }}</text>
        </view>
      </view>
    </view>

    <view v-else class="empty">
      <text class="empty-title">今天没有课程</text>
      <text class="empty-copy">课程新增和修改请前往课程页管理，这里只展示今天需要上的课。</text>
    </view>
  </view>
</template>

<script>
import { getCourses } from '@/utils/courseStorage.js'
import {
  getCourseColor,
  getSectionLabel,
  getSectionTime,
  getTodayWeekday,
  getWeekModeLabel,
  getWeekdayLabel,
  isCourseActiveForWeek,
  sortBySection
} from '@/utils/courseFormat.js'
import { getCurrentTermInfo, getTermConfig } from '@/utils/termConfig.js'

export default {
  data() {
    return {
      courses: [],
      todayWeekday: getTodayWeekday(),
      termInfo: getCurrentTermInfo()
    }
  },
  computed: {
    todayText() {
      return `${getWeekdayLabel(this.todayWeekday)} · ${this.formatDate()}`
    },
    todayCourses() {
      return this.courses
        .filter((course) => Number(course.weekday) === this.todayWeekday)
        .filter((course) => isCourseActiveForWeek(course, this.termInfo.currentWeek))
        .sort(sortBySection)
    },
    summaryCopy() {
      if (this.termInfo.status === 'before') return '距离开学还有课程待生效'
      if (this.termInfo.status === 'after') return '本学期已结束，可在课程页调整学期设置'
      return this.todayCourses.length ? '已按本周课表整理完成' : '今天没有需要上的课'
    }
  },
  onShow() {
    this.todayWeekday = getTodayWeekday()
    this.courses = getCourses()
    this.termInfo = getCurrentTermInfo(getTermConfig())
  },
  methods: {
    formatDate() {
      const date = new Date()
      return `${date.getMonth() + 1}月${date.getDate()}日`
    },
    sectionLabel(sections) {
      return getSectionLabel(sections)
    },
    sectionTime(sections) {
      return getSectionTime(sections)
    },
    weekModeLabel(weekMode) {
      return getWeekModeLabel(weekMode)
    },
    metaText(course) {
      return [getSectionLabel(course.sections), course.classroom, course.teacher].filter(Boolean).join(' · ')
    },
    courseStyle(course) {
      const color = getCourseColor(course)
      return `background:${color.bg};color:${color.text};`
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

.hero {
  margin-bottom: 28rpx;
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

.subtitle {
  display: block;
  margin-top: 12rpx;
  color: #6b7280;
  font-size: 24rpx;
  line-height: 1.5;
}

.summary {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24rpx;
  margin-bottom: 28rpx;
  padding: 28rpx;
  border-radius: 20rpx;
  background: #ffffff;
}

.summary-number {
  margin-right: 8rpx;
  font-size: 56rpx;
  font-weight: 700;
}

.summary-label,
.summary-copy {
  color: #6b7280;
  font-size: 26rpx;
}

.summary-copy {
  max-width: 360rpx;
  text-align: right;
  line-height: 1.5;
}

.course-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.course-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx;
  border-radius: 18rpx;
}

.course-main {
  flex: 1;
  min-width: 0;
}

.course-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12rpx;
  margin-bottom: 8rpx;
}

.course-time {
  font-size: 22rpx;
  font-weight: 700;
}

.course-tag {
  flex-shrink: 0;
  padding: 4rpx 14rpx;
  border-radius: 999rpx;
  background: rgba(17, 24, 39, 0.08);
  color: #374151;
  font-size: 20rpx;
}

.course-name {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 34rpx;
  font-weight: 700;
}

.course-meta {
  display: block;
  margin-top: 10rpx;
  color: rgba(17, 24, 39, 0.72);
  font-size: 24rpx;
}

.empty {
  padding: 40rpx 32rpx;
  border-radius: 20rpx;
  background: #ffffff;
}

.empty-title {
  display: block;
  font-size: 34rpx;
  font-weight: 700;
}

.empty-copy {
  display: block;
  margin-top: 16rpx;
  color: #6b7280;
  font-size: 26rpx;
  line-height: 1.6;
}
</style>
