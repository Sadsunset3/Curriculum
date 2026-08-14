<template>
  <view class="page">
    <view class="hero">
      <text class="eyebrow">智能导入</text>
      <text class="title">把课表交给外部 AI 整理</text>
      <text class="lead">复制 Prompt 给外部 AI，拿回 JSON 后先解析预览，再决定是否导入。</text>
    </view>

    <view class="panel">
      <text class="section-title">导入流程</text>
      <text class="step">1. 复制 Prompt</text>
      <text class="step">2. 推荐使用 DeepSeek，并上传课表截图、PDF 或 Excel</text>
      <text class="step">3. 让外部 AI 严格输出 JSON</text>
      <text class="step">4. 建议优先从剪贴板读取 JSON</text>
      <text class="step">5. 解析成功先预览，确认后再导入</text>
      <text class="step">6. 解析失败会生成反馈 Prompt，复制回外部 AI 修正</text>
      <button class="primary-button" @tap="copyPrompt">复制 Prompt</button>
      <text class="hint">复制后建议直接发给 DeepSeek，再附上你的课表文件</text>
    </view>

    <view class="panel warning-panel">
      <text class="section-title">覆盖提醒</text>
      <text class="warning-text">每次智能导入都会覆盖当前本地已有课程，不会在原有课表上追加导入。</text>
      <text class="paragraph">当前本地已有 {{ existingCourseCount }} 条课程记录。确认导入前请先检查预览内容。</text>
    </view>

    <view class="panel">
      <text class="section-title">给外部 AI 的 Prompt</text>
      <textarea class="prompt-box" :value="importPrompt" :maxlength="-1" disabled />
    </view>

    <view class="panel">
      <text class="section-title">导入外部 AI 返回的 JSON</text>
      <textarea
        class="result-box"
        v-model="importText"
        :maxlength="-1"
        placeholder="请把外部 AI 返回的 JSON 完整粘贴到这里"
      />
      <view class="tool-row">
        <button class="ghost-button half-button compact-button" @tap="readFromClipboard">从剪贴板读取</button>
        <button class="ghost-button half-button compact-button" @tap="clearImportText">清空内容</button>
      </view>
      <text class="hint">当前已读取 {{ importTextLength }} 个字符。大段 JSON 建议优先使用“从剪贴板读取”。</text>
      <text v-if="isLikelyTruncated" class="warning-inline">当前内容可能已被截断，建议重新使用“从剪贴板读取”获取完整 JSON。</text>
      <text class="hint">如果是别人分享给你的课表 JSON，直接点“从剪贴板读取”即可，无需每次启动自动读取剪贴板。</text>
      <text class="hint">解析只做校验和预览，不会立刻覆盖本地课表。</text>
      <button class="primary-button" @tap="parseImport">解析 JSON</button>
    </view>

    <view v-if="parseError" class="panel error-panel">
      <text class="section-title">解析失败</text>
      <text class="error-text">{{ parseError }}</text>
      <text class="paragraph">把下面这段反馈 Prompt 复制给外部 AI，让它基于原 JSON 修正后重新返回。</text>
      <button class="ghost-button" @tap="copyFeedbackPrompt">复制反馈 Prompt</button>
      <textarea class="feedback-box" :value="feedbackPrompt" :maxlength="-1" disabled />
    </view>

    <view v-if="previewData" class="panel preview-panel">
      <text class="section-title">预览课程</text>
      <view class="summary-card">
        <text class="summary-title">{{ previewSemesterLabel }}</text>
        <text class="summary-meta">开学日期 {{ previewData.termConfig.startDate }}</text>
        <text class="summary-meta">总周数 {{ previewData.termConfig.totalWeeks }} 周</text>
        <text class="summary-meta">共解析出 {{ previewData.courses.length }} 条上课记录</text>
      </view>

      <view class="preview-list">
        <view v-for="(course, index) in previewCourses" :key="previewCourseKey(course, index)" class="course-card">
          <view class="course-head">
            <text class="course-name">{{ course.name }}</text>
            <text class="course-tag">{{ course.weekModeLabel }}</text>
          </view>
          <text class="course-meta">{{ course.weekdayLabel }} · {{ course.sectionLabel }} · {{ course.weeksLabel }}</text>
          <text class="course-meta">{{ course.classroom || '未填写教室' }} · {{ course.teacher || '未填写教师' }}</text>
        </view>
      </view>

      <view class="action-row">
        <button class="ghost-button half-button" @tap="resetPreview">返回修改 JSON</button>
        <button class="primary-button half-button" @tap="confirmImport">确认导入</button>
      </view>
      <text class="hint">确认导入后会覆盖当前本地课表和学期信息。</text>
    </view>
  </view>
</template>

<script>
import {
  IMPORT_PROMPT,
  buildImportFeedbackPrompt,
  importScheduleText,
  parseScheduleImportText
} from '@/utils/scheduleImport.js'
import { getCourses } from '@/utils/courseStorage.js'

const WEEKDAY_LABELS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
const SECTION_LABEL_MAP = {
  '1,2': '第1-2节',
  '3,4': '第3-4节',
  '5,6': '第5-6节',
  '7,8': '第7-8节',
  '9,10': '第9-10节',
  '11,12': '第11-12节'
}
const WEEK_MODE_LABEL_MAP = {
  all: '每周',
  odd: '单周',
  even: '双周'
}

export default {
  data() {
    return {
      importPrompt: IMPORT_PROMPT,
      importText: '',
      previewData: null,
      parseError: '',
      feedbackPrompt: '',
      existingCourseCount: 0
    }
  },
  computed: {
    importTextLength() {
      return String(this.importText || '').length
    },
    isLikelyTruncated() {
      const text = String(this.importText || '').trim()
      if (!text) return false
      const normalized = text.replace(/```(?:json)?/gi, '').trim()
      const lastChar = normalized.slice(-1)
      if (normalized.length > 80 && !['}', ']', '`'].includes(lastChar)) return true
      return normalized.includes('{') && !normalized.endsWith('}')
    },
    previewSemesterLabel() {
      if (!this.previewData) return ''
      const term = this.previewData.termConfig
      return `${term.academicYear} 学年 第${term.semester}学期`
    },
    previewCourses() {
      if (!this.previewData) return []
      return this.previewData.courses.map((course) => ({
        ...course,
        weekdayLabel: WEEKDAY_LABELS[Number(course.weekday) - 1] || `周${course.weekday}`,
        sectionLabel: SECTION_LABEL_MAP[(course.sections || []).join(',')] || `${course.sections.join('-')}节`,
        weeksLabel: `第${course.weeks[0]}-${course.weeks[1]}周`,
        weekModeLabel: WEEK_MODE_LABEL_MAP[course.weekMode] || '每周'
      }))
    }
  },
  onShow() {
    this.refreshExistingCourseCount()
  },
  methods: {
    refreshExistingCourseCount() {
      this.existingCourseCount = getCourses().length
    },
    readFromClipboard() {
      uni.getClipboardData({
        success: (res) => {
          this.importText = String(res.data || '')
          this.clearParseState()
          uni.showToast({ title: '已从剪贴板读取', icon: 'success' })
        },
        fail: () => {
          uni.showToast({ title: '读取剪贴板失败', icon: 'none' })
        }
      })
    },
    clearImportText() {
      this.importText = ''
      this.clearParseState()
    },
    copyPrompt() {
      uni.setClipboardData({
        data: this.importPrompt,
        success: () => {
          uni.showToast({ title: 'Prompt 已复制', icon: 'success' })
        }
      })
    },
    copyFeedbackPrompt() {
      if (!this.feedbackPrompt) return
      uni.setClipboardData({
        data: this.feedbackPrompt,
        success: () => {
          uni.showToast({ title: '反馈 Prompt 已复制', icon: 'success' })
        }
      })
    },
    clearParseState() {
      this.previewData = null
      this.parseError = ''
      this.feedbackPrompt = ''
    },
    parseImport() {
      if (!this.importText.trim()) {
        uni.showToast({ title: '请先粘贴 JSON 内容', icon: 'none' })
        return
      }

      this.clearParseState()

      try {
        this.previewData = parseScheduleImportText(this.importText)
        uni.showToast({ title: '解析成功，请先预览', icon: 'success' })
      } catch (error) {
        this.parseError = error.message || '导入内容格式错误'
        this.feedbackPrompt = buildImportFeedbackPrompt(this.importText, this.parseError)
      }
    },
    resetPreview() {
      this.previewData = null
    },
    previewCourseKey(course, index) {
      return `${course.name}_${course.weekday}_${(course.sections || []).join('-')}_${(course.weeks || []).join('-')}_${index}`
    },
    confirmImport() {
      if (!this.previewData) return

      uni.showModal({
        title: '确认导入',
        content: `本次将导入 ${this.previewData.courses.length} 条上课记录，并覆盖当前已有的 ${this.existingCourseCount} 条课程记录。每次导入都会整体覆盖，不会追加，是否继续？`,
        confirmText: '确认导入',
        success: (res) => {
          if (!res.confirm) return
          this.handleImport()
        }
      })
    },
    handleImport() {
      try {
        const result = importScheduleText(this.importText)
        this.importText = ''
        this.clearParseState()
        this.refreshExistingCourseCount()
        uni.showModal({
          title: '导入完成',
          content: `已导入 ${result.courses.length} 条上课记录，原有课程已被本次导入结果覆盖。请优先检查并修改学期、开学日期、总周数，再检查课程内容。`,
          showCancel: false,
          confirmText: '去检查学期设置',
          success: () => {
            uni.setStorageSync('curriculum_focus_term_settings', '1')
            uni.switchTab({ url: '/pages/courses/courses' })
          }
        })
      } catch (error) {
        this.previewData = null
        this.parseError = error.message || '导入失败'
        this.feedbackPrompt = buildImportFeedbackPrompt(this.importText, this.parseError)
      }
    }
  }
}
</script>

<style>
.page {
  min-height: 100vh;
  padding: 40rpx 32rpx 80rpx;
  background: #f5f6f8;
  color: #111827;
  box-sizing: border-box;
}

.hero {
  margin-bottom: 24rpx;
}

.eyebrow {
  display: block;
  margin-bottom: 10rpx;
  color: #8b6f72;
  font-size: 24rpx;
}

.title {
  display: block;
  font-size: 50rpx;
  line-height: 1.18;
  font-weight: 700;
  color: #23181a;
}

.lead {
  display: block;
  margin-top: 14rpx;
  color: #5f5558;
  font-size: 26rpx;
  line-height: 1.6;
}

.panel {
  margin-bottom: 18rpx;
  padding: 28rpx 26rpx;
  border-radius: 20rpx;
  background: #ffffff;
}

.section-title {
  display: block;
  margin-bottom: 14rpx;
  color: #23181a;
  font-size: 30rpx;
  font-weight: 700;
}

.paragraph,
.step,
.hint,
.error-text,
.summary-meta,
.course-meta {
  display: block;
  color: #5f5558;
  font-size: 26rpx;
  line-height: 1.75;
}

.paragraph + .paragraph {
  margin-top: 10rpx;
}

.step + .step {
  margin-top: 6rpx;
}

.hint {
  margin-top: 12rpx;
  color: #6b7280;
  font-size: 24rpx;
}

.primary-button,
.ghost-button {
  margin-top: 20rpx;
  height: 84rpx;
  border-radius: 14rpx;
  font-size: 28rpx;
  line-height: 84rpx;
}

.primary-button {
  color: #ffffff;
  background: #111827;
}

.ghost-button {
  color: #111827;
  background: #eef2f7;
}

.prompt-box,
.result-box,
.feedback-box {
  width: 100%;
  min-height: 300rpx;
  margin-top: 8rpx;
  padding: 22rpx;
  border-radius: 16rpx;
  background: #f8fafc;
  color: #111827;
  font-size: 24rpx;
  line-height: 1.7;
  box-sizing: border-box;
}

.result-box,
.feedback-box {
  min-height: 360rpx;
}

.tool-row {
  display: flex;
  gap: 16rpx;
  margin-top: 16rpx;
}

.compact-button {
  margin-top: 0;
  height: 72rpx;
  line-height: 72rpx;
  font-size: 26rpx;
}

.warning-inline {
  display: block;
  margin-top: 12rpx;
  color: #b45309;
  font-size: 24rpx;
  line-height: 1.7;
}

.error-panel {
  border: 2rpx solid #fecaca;
  background: #fff7f7;
}

.warning-panel {
  border: 2rpx solid #fde68a;
  background: #fffbeb;
}

.warning-text {
  display: block;
  color: #92400e;
  font-size: 26rpx;
  font-weight: 600;
  line-height: 1.75;
}

.error-text {
  color: #b91c1c;
  font-weight: 600;
}

.summary-card {
  padding: 22rpx;
  border-radius: 16rpx;
  background: #f8fafc;
}

.summary-title {
  display: block;
  color: #111827;
  font-size: 30rpx;
  font-weight: 700;
  line-height: 1.5;
}

.preview-list {
  display: flex;
  flex-direction: column;
  gap: 14rpx;
  margin-top: 18rpx;
}

.course-card {
  padding: 22rpx;
  border-radius: 16rpx;
  background: #f8fafc;
}

.course-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  margin-bottom: 8rpx;
}

.course-name {
  flex: 1;
  min-width: 0;
  color: #111827;
  font-size: 30rpx;
  font-weight: 700;
  line-height: 1.4;
}

.course-tag {
  flex-shrink: 0;
  padding: 4rpx 14rpx;
  border-radius: 999rpx;
  background: #e5e7eb;
  color: #374151;
  font-size: 22rpx;
}

.action-row {
  display: flex;
  gap: 16rpx;
  margin-top: 8rpx;
}

.half-button {
  flex: 1;
}
</style>
