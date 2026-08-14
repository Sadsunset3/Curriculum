<template>
  <view class="page">
    <view class="header">
      <text class="eyebrow">{{ isEdit ? '编辑课程' : '新增课程' }}</text>
      <text class="title">{{ isEdit ? '调整课程信息' : '添加一门课程' }}</text>
      <text class="subtitle">支持设置周次范围和单双周，周课表会自动按当前学期过滤显示。</text>
    </view>

    <view class="form">
      <view class="field">
        <text class="label">课程名称</text>
        <input class="input" v-model.trim="form.name" placeholder="例如：高等数学" />
      </view>

      <view class="field">
        <text class="label">星期</text>
        <picker :range="weekdayLabels" :value="weekdayIndex" @change="onWeekdayChange">
          <view class="select">{{ weekdayLabels[weekdayIndex] }}</view>
        </picker>
      </view>

      <view class="field">
        <text class="label">节次</text>
        <picker :range="sectionLabels" :value="sectionIndex" @change="onSectionChange">
          <view class="select">{{ sectionLabels[sectionIndex] }}</view>
        </picker>
      </view>

      <view class="field">
        <text class="label">上课规律</text>
        <picker :range="weekModeLabels" :value="weekModeIndex" @change="onWeekModeChange">
          <view class="select">{{ weekModeLabels[weekModeIndex] }}</view>
        </picker>
      </view>

      <view class="field two-column">
        <view class="sub-field">
          <text class="label">起始周</text>
          <picker :range="weekNumbers" :value="startWeekIndex" @change="onStartWeekChange">
            <view class="select">{{ form.weeks[0] }} 周</view>
          </picker>
        </view>
        <view class="sub-field">
          <text class="label">结束周</text>
          <picker :range="weekNumbers" :value="endWeekIndex" @change="onEndWeekChange">
            <view class="select">{{ form.weeks[1] }} 周</view>
          </picker>
        </view>
      </view>

      <view class="field">
        <text class="label">教室</text>
        <input class="input" v-model.trim="form.classroom" placeholder="例如：A101" />
      </view>

      <view class="field">
        <text class="label">任课老师</text>
        <input class="input" v-model.trim="form.teacher" placeholder="例如：王老师" />
      </view>
    </view>

    <view class="footer">
      <button class="secondary-button" @tap="goBack">取消</button>
      <button class="primary-button" @tap="save">保存课程</button>
    </view>
  </view>
</template>

<script>
import { addCourse, getCourseById, updateCourse } from '@/utils/courseStorage.js'
import { SECTION_OPTIONS, WEEKDAYS, WEEK_MODE_OPTIONS } from '@/utils/courseFormat.js'

export default {
  data() {
    return {
      courseId: '',
      form: {
        name: '',
        weekday: 1,
        sections: [1, 2],
        classroom: '',
        teacher: '',
        weeks: [1, 16],
        weekMode: 'all'
      },
      weekNumbers: Array.from({ length: 24 }, (_, index) => String(index + 1))
    }
  },
  computed: {
    isEdit() {
      return Boolean(this.courseId)
    },
    weekdayLabels() {
      return WEEKDAYS.map((item) => item.label)
    },
    sectionLabels() {
      return SECTION_OPTIONS.map((item) => item.label)
    },
    weekModeLabels() {
      return WEEK_MODE_OPTIONS.map((item) => item.label)
    },
    weekdayIndex() {
      return Math.max(0, WEEKDAYS.findIndex((item) => item.value === Number(this.form.weekday)))
    },
    sectionIndex() {
      const index = SECTION_OPTIONS.findIndex((item) => {
        return item.value.length === this.form.sections.length && item.value.every((value, i) => value === this.form.sections[i])
      })
      return Math.max(0, index)
    },
    weekModeIndex() {
      return Math.max(0, WEEK_MODE_OPTIONS.findIndex((item) => item.value === this.form.weekMode))
    },
    startWeekIndex() {
      return Math.max(0, Number(this.form.weeks[0]) - 1)
    },
    endWeekIndex() {
      return Math.max(0, Number(this.form.weeks[1]) - 1)
    }
  },
  onLoad(options) {
    if (!options || !options.id) return
    this.courseId = options.id
    const course = getCourseById(options.id)
    if (!course) {
      uni.showToast({ title: '课程不存在', icon: 'none' })
      setTimeout(() => uni.navigateBack(), 600)
      return
    }
    this.form = {
      name: course.name,
      weekday: course.weekday,
      sections: course.sections,
      classroom: course.classroom,
      teacher: course.teacher,
      weeks: course.weeks,
      weekMode: course.weekMode || 'all'
    }
  },
  methods: {
    onWeekdayChange(event) {
      this.form.weekday = WEEKDAYS[Number(event.detail.value)].value
    },
    onSectionChange(event) {
      this.form.sections = SECTION_OPTIONS[Number(event.detail.value)].value
    },
    onWeekModeChange(event) {
      this.form.weekMode = WEEK_MODE_OPTIONS[Number(event.detail.value)].value
    },
    onStartWeekChange(event) {
      const start = Number(event.detail.value) + 1
      const end = Math.max(start, Number(this.form.weeks[1]))
      this.form.weeks = [start, end]
    },
    onEndWeekChange(event) {
      const end = Number(event.detail.value) + 1
      const start = Math.min(Number(this.form.weeks[0]), end)
      this.form.weeks = [start, end]
    },
    validate() {
      if (!this.form.name) return '请输入课程名称'
      if (!this.form.weekday) return '请选择星期'
      if (!Array.isArray(this.form.sections) || !this.form.sections.length) return '请选择节次'
      return ''
    },
    save() {
      const error = this.validate()
      if (error) {
        uni.showToast({ title: error, icon: 'none' })
        return
      }

      if (this.isEdit) {
        updateCourse(this.courseId, this.form)
      } else {
        addCourse(this.form)
      }

      uni.showToast({ title: '已保存', icon: 'success' })
      setTimeout(() => {
        uni.switchTab({ url: '/pages/week/week' })
      }, 350)
    },
    goBack() {
      if (getCurrentPages().length > 1) {
        uni.navigateBack()
        return
      }
      uni.switchTab({ url: '/pages/index/index' })
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
  font-size: 48rpx;
  line-height: 1.16;
  font-weight: 700;
}

.subtitle {
  display: block;
  margin-top: 14rpx;
  color: #6b7280;
  font-size: 24rpx;
  line-height: 1.6;
}

.form {
  padding: 28rpx;
  border-radius: 20rpx;
  background: #ffffff;
}

.field {
  margin-bottom: 26rpx;
}

.field:last-child {
  margin-bottom: 0;
}

.label {
  display: block;
  margin-bottom: 12rpx;
  color: #374151;
  font-size: 24rpx;
  font-weight: 600;
}

.input,
.select {
  height: 88rpx;
  padding: 0 24rpx;
  border-radius: 14rpx;
  background: #f8fafc;
  color: #111827;
  font-size: 30rpx;
  line-height: 88rpx;
  box-sizing: border-box;
}

.two-column {
  display: flex;
  gap: 16rpx;
}

.sub-field {
  flex: 1;
}

.footer {
  display: flex;
  gap: 16rpx;
  margin-top: 28rpx;
}

.primary-button,
.secondary-button {
  flex: 1;
  height: 88rpx;
  border-radius: 14rpx;
  font-size: 30rpx;
  line-height: 88rpx;
}

.primary-button {
  color: #ffffff;
  background: #111827;
}

.secondary-button {
  color: #111827;
  background: #ffffff;
}
</style>
