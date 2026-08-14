<template>
	<view>
		<!-- 触发按钮 -->
		<!-- <view class="my-time-trigger" @click="openPicker" v-if="!isInternalMode">
			<slot>
				<view class="default-trigger">
					<text class="trigger-text">{{ displayValue || placeholder }}</text>
					<text class="trigger-icon">122</text>
				</view>
			</slot>
		</view> -->

		<!-- 弹框遮罩 -->
		<view class="modal-overlay" :class="{ 'show': showModal }" @click="closePicker" v-if="!isInternalMode"></view>

		<!-- 弹框容器 -->
		<view class="modal-container" :class="{ 'show': showModal }" v-if="!isInternalMode">
			<view class="modal-header">
				<text class="modal-title">{{ modeConfig.name }}</text>
			</view>

			<view class="modal-content">
				<view class="my-time-picker">
					<picker-view class="picker-view" :value="indexArr" @change="onChange">
						<picker-view-column class="picker-view-column" v-for="(col, colIdx) in timeConfig"
							:key="colIdx">
							<view v-for="(item, idx) in col" :key="idx">{{ item }}</view>
						</picker-view-column>
					</picker-view>
				</view>
			</view>

			<view class="modal-footer">
				<view class="footer-button cancel-btn" @click="cancelPicker">
					<text>取消</text>
				</view>
				<view class="footer-button reset-btn" @click="resetPicker">
					<text>重置</text>
				</view>
				<view class="footer-button confirm-btn" @click="confirmPicker">
					<text>确认</text>
				</view>
			</view>
		</view>

		<!-- 内部模式：直接显示选择器 -->
		<view class="my-time-picker" v-if="isInternalMode">
			<picker-view class="picker-view" :value="indexArr" @change="onChange">
				<picker-view-column class="picker-view-column" v-for="(col, colIdx) in timeConfig" :key="colIdx">
					<view v-for="(item, idx) in col" :key="idx">{{ item }}</view>
				</picker-view-column>
			</picker-view>
		</view>
	</view>
</template>

<script>
	// 日期时间选择模式
	const LOOP_COUNT = 21;
	const LOOP_MIDDLE = Math.floor(LOOP_COUNT / 2);

	const TIME_TYPES = {
	  // 年份
	  Y: 1,
	  // 年月
	  YM: 2,
	  // 年月日
	  YMD: 3,
	  // 年月日时分
	  'YMD-HM': 4,
	  // 年月日时分秒
	  'YMD-HMS': 5,
	  // 时分
	  HM: 7,
	  // 时分秒
	  HMS: 8
	};

	export default {
		name: 'MyTime',
		props: {
			// 模式：1年份，2年月，3年月日，4年月日时分，5年月日时分秒，7时分，8时分秒
			mode: {
				type: Number,
				default: TIME_TYPES.YMD
			},
			// 默认值
			value: {
				type: String,
				default: ''
			},
			// 占位符
			placeholder: {
				type: String,
				default: '请选择'
			},
			// 可选的最小日期
			minDate: {
				type: String,
				default: ''
			},
			// 可选的最大日期
			maxDate: {
				type: String,
				default: ''
			},
			// 可选的最小时间
			minTime: {
				type: String,
				default: ''
			},
			// 可选的最大时间
			maxTime: {
				type: String,
				default: ''
			},
			// 是否为内部模式（直接显示选择器，不显示弹框）
			isInternalMode: {
				type: Boolean,
				default: false
			},
			// 控制弹框显示隐藏
			show: {
				type: Boolean,
				default: false
			}
		},
		data() {
			return {
				showModal: false,
				displayValue: '',
				tempValue: '',
				lastIndexArr: [],
				selectYear: new Date().getFullYear(),
				selectMonth: new Date().getMonth() + 1,
				selectDay: new Date().getDate(),
				selectHour: new Date().getHours(),
				selectMinute: new Date().getMinutes(),
				selectSecond: new Date().getSeconds()
			};
		},
		computed: {
			// 模式配置
			modeConfig() {
				const configs = {
					[TIME_TYPES.Y]: {
						name: '选择年份',
						format: 'YYYY'
					},
					[TIME_TYPES.YM]: {
						name: '选择年月',
						format: 'YYYY-MM'
					},
					[TIME_TYPES.YMD]: {
						name: '选择年月日',
						format: 'YYYY-MM-DD'
					},
					[TIME_TYPES['YMD-HM']]: {
						name: '选择年月日时分',
						format: 'YYYY-MM-DD HH:mm'
					},
					[TIME_TYPES['YMD-HMS']]: {
						name: '选择年月日时分秒',
						format: 'YYYY-MM-DD HH:mm:ss'
					},
					[TIME_TYPES.HM]: {
						name: '选择时分',
						format: 'HH:mm'
					},
					[TIME_TYPES.HMS]: {
						name: '选择时分秒',
						format: 'HH:mm:ss'
					}
				};
				return configs[this.mode] || configs[TIME_TYPES.YMD];
			},

			// 最小日期对象
			minDateObj() {
				if (this.minDate) {
					return new Date(this.minDate.replace(/\-/g, '/'));
				}
				return new Date(new Date().getFullYear() - 10, 0, 1);
			},

			// 最大日期对象
			maxDateObj() {
				if (this.maxDate) {
					return new Date(this.maxDate.replace(/\-/g, '/'));
				}
				return new Date(new Date().getFullYear() + 10, 11, 31);
			},

			// 最小时间对象
			minTimeObj() {
				if (this.minTime) {
					return this.parseTimeString(this.minTime);
				}
				return {
					hour: 0,
					minute: 0,
					second: 0
				};
			},

			// 最大时间对象
			maxTimeObj() {
				if (this.maxTime) {
					return this.parseTimeString(this.maxTime);
				}
				return {
					hour: 23,
					minute: 59,
					second: 59
				};
			},

			// 年份选项
			years() {
				let years = [];
				let minYear = this.minDateObj.getFullYear();
				let maxYear = this.maxDateObj.getFullYear();
				for (let i = minYear; i <= maxYear; i++) {
					years.push(i);
				}
				return years;
			},

			// 月份选项
			months() {
				let months = [];
				let minMonth = 1;
				let maxMonth = 12;

				if (this.selectYear == this.minDateObj.getFullYear()) {
					minMonth = this.minDateObj.getMonth() + 1;
				}
				if (this.selectYear == this.maxDateObj.getFullYear()) {
					maxMonth = this.maxDateObj.getMonth() + 1;
				}

				for (let i = minMonth; i <= maxMonth; i++) {
					months.push(i);
				}
				return months;
			},

			// 日期选项
			days() {
				let monthDaysConfig = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
				if (this.selectMonth == 2 && this.selectYear % 4 == 0) {
					monthDaysConfig[1] = 29;
				}

				let minDay = 1;
				let maxDay = monthDaysConfig[this.selectMonth - 1];

				if (this.selectYear == this.minDateObj.getFullYear() && this.selectMonth == this.minDateObj.getMonth() +
					1) {
					minDay = this.minDateObj.getDate();
				}
				if (this.selectYear == this.maxDateObj.getFullYear() && this.selectMonth == this.maxDateObj.getMonth() +
					1) {
					maxDay = this.maxDateObj.getDate();
				}

				let days = [];
				for (let i = minDay; i <= maxDay; i++) {
					days.push(i);
				}
				return days;
			},

			// 小时选项
			hours() {
				let hours = [];
				let minHour = this.minTimeObj.hour;
				let maxHour = this.maxTimeObj.hour;

				for (let i = minHour; i <= maxHour; i++) {
					hours.push(i);
				}
				return hours;
			},

			// 分钟选项
			minutes() {
				let minutes = [];
				let minMinute = this.minTimeObj.minute;
				let maxMinute = this.maxTimeObj.minute;

				if (this.selectHour === this.minTimeObj.hour) {
					minMinute = this.minTimeObj.minute;
				} else {
					minMinute = 0;
				}

				if (this.selectHour === this.maxTimeObj.hour) {
					maxMinute = this.maxTimeObj.minute;
				} else {
					maxMinute = 59;
				}

				for (let i = minMinute; i <= maxMinute; i++) {
					minutes.push(i);
				}
				return minutes;
			},

			// 秒选项
			seconds() {
				let seconds = [];
				let minSecond = this.minTimeObj.second;
				let maxSecond = this.maxTimeObj.second;

				if (this.selectHour === this.minTimeObj.hour && this.selectMinute === this.minTimeObj.minute) {
					minSecond = this.minTimeObj.second;
				} else {
					minSecond = 0;
				}

				if (this.selectHour === this.maxTimeObj.hour && this.selectMinute === this.maxTimeObj.minute) {
					maxSecond = this.maxTimeObj.second;
				} else {
					maxSecond = 59;
				}

				for (let i = minSecond; i <= maxSecond; i++) {
					seconds.push(i);
				}
				return seconds;
			},

			// 传给pickerView组件的数组
			timeConfig() {
				let years = this.years.map((y) => y + '年');
				let months = this.repeatColumn(this.months, (m) => m + '月');
				let days = this.repeatColumn(this.days, (d) => d + '日');
				let hours = this.repeatColumn(this.hours, (h) => this.padZero(h) + '时');
				let minutes = this.repeatColumn(this.minutes, (m) => this.padZero(m) + '分');
				let seconds = this.repeatColumn(this.seconds, (s) => this.padZero(s) + '秒');

				let ret = [];
				switch (this.mode) {
					case TIME_TYPES.Y:
						ret = [years];
						break;
					case TIME_TYPES.YM:
						ret = [years, months];
						break;
					case TIME_TYPES.YMD:
						ret = [years, months, days];
						break;
					case TIME_TYPES['YMD-HM']:
						ret = [years, months, days, hours, minutes];
						break;
					case TIME_TYPES['YMD-HMS']:
						ret = [years, months, days, hours, minutes, seconds];
						break;
					case TIME_TYPES.HM:
						ret = [hours, minutes];
						break;
					case TIME_TYPES.HMS:
						ret = [hours, minutes, seconds];
						break;
				}

				return ret;
			},

			// 当前选中值索引
			indexArr() {
				let ret = [];
				switch (this.mode) {
					case TIME_TYPES.Y:
						ret = [this.years.findIndex(y => y === this.selectYear)];
						break;
					case TIME_TYPES.YM:
						ret = [
							this.years.findIndex(y => y === this.selectYear),
							this.loopIndex(this.months, this.selectMonth)
						];
						break;
					case TIME_TYPES.YMD:
						ret = [
							this.years.findIndex(y => y === this.selectYear),
							this.loopIndex(this.months, this.selectMonth),
							this.loopIndex(this.days, this.selectDay)
						];
						break;
					case TIME_TYPES['YMD-HM']:
						ret = [
							this.years.findIndex(y => y === this.selectYear),
							this.loopIndex(this.months, this.selectMonth),
							this.loopIndex(this.days, this.selectDay),
							this.loopIndex(this.hours, this.selectHour),
							this.loopIndex(this.minutes, this.selectMinute)
						];
						break;
					case TIME_TYPES['YMD-HMS']:
						ret = [
							this.years.findIndex(y => y === this.selectYear),
							this.loopIndex(this.months, this.selectMonth),
							this.loopIndex(this.days, this.selectDay),
							this.loopIndex(this.hours, this.selectHour),
							this.loopIndex(this.minutes, this.selectMinute),
							this.loopIndex(this.seconds, this.selectSecond)
						];
						break;
					case TIME_TYPES.HM:
						ret = [
							this.loopIndex(this.hours, this.selectHour),
							this.loopIndex(this.minutes, this.selectMinute)
						];
						break;
					case TIME_TYPES.HMS:
						ret = [
							this.loopIndex(this.hours, this.selectHour),
							this.loopIndex(this.minutes, this.selectMinute),
							this.loopIndex(this.seconds, this.selectSecond)
						];
						break;
				}
				return ret.map(index => index < 0 ? 0 : index);
			}
		},
		watch: {
			value: {
				immediate: true,
				handler(val) {
					if (val) {
						this.parseValue(val);
						this.displayValue = val;
					} else {
						this.displayValue = '';
					}
				}
			},
			show: {
				immediate: true,
				handler(val) {
					if (val) {
						if (!this.value && !this.displayValue) {
							this.setNow();
						}
						this.lastIndexArr = this.indexArr.slice();
					}
					this.showModal = val;
				}
			}
		},
		methods: {
			repeatColumn(list, formatter) {
				if (!list.length) return [];
				let ret = [];
				for (let i = 0; i < LOOP_COUNT; i++) {
					ret = ret.concat(list.map(formatter));
				}
				return ret;
			},

			loopIndex(list, value) {
				if (!list.length) return 0;
				const index = list.findIndex(item => item === value);
				return (index < 0 ? 0 : index) + list.length * LOOP_MIDDLE;
			},

			loopValue(list, index) {
				if (!list.length) return undefined;
				const safeIndex = Number(index) || 0;
				return list[((safeIndex % list.length) + list.length) % list.length];
			},

			setNow() {
				const now = new Date();
				this.selectYear = now.getFullYear();
				this.selectMonth = now.getMonth() + 1;
				this.selectDay = now.getDate();
				this.selectHour = now.getHours();
				this.selectMinute = now.getMinutes();
				this.selectSecond = now.getSeconds();
			},

			// 解析时间字符串
			parseTimeString(timeStr) {
				const parts = timeStr.split(':');
				return {
					hour: parseInt(parts[0]) || 0,
					minute: parseInt(parts[1]) || 0,
					second: parseInt(parts[2]) || 0
				};
			},

			// 解析传入的值
			parseValue(val) {
				if (!val) return;

				if (this.mode === TIME_TYPES.Y) {
					this.selectYear = parseInt(val);
				} else if (this.mode === TIME_TYPES.YM) {
					const [year, month] = val.split('-');
					this.selectYear = parseInt(year);
					this.selectMonth = parseInt(month);
				} else if (this.mode === TIME_TYPES.YMD) {
					const [year, month, day] = val.split('-');
					this.selectYear = parseInt(year);
					this.selectMonth = parseInt(month);
					this.selectDay = parseInt(day);
				} else if (this.mode === TIME_TYPES['YMD-HM']) {
					const [datePart, timePart] = val.split(' ');
					const [year, month, day] = datePart.split('-');
					const [hour, minute] = timePart.split(':');
					this.selectYear = parseInt(year);
					this.selectMonth = parseInt(month);
					this.selectDay = parseInt(day);
					this.selectHour = parseInt(hour);
					this.selectMinute = parseInt(minute);
				} else if (this.mode === TIME_TYPES['YMD-HMS']) {
					const [datePart, timePart] = val.split(' ');
					const [year, month, day] = datePart.split('-');
					const [hour, minute, second] = timePart.split(':');
					this.selectYear = parseInt(year);
					this.selectMonth = parseInt(month);
					this.selectDay = parseInt(day);
					this.selectHour = parseInt(hour);
					this.selectMinute = parseInt(minute);
					this.selectSecond = parseInt(second);
				} else if (this.mode === TIME_TYPES.HM) {
					const [hour, minute] = val.split(':');
					this.selectHour = parseInt(hour);
					this.selectMinute = parseInt(minute);
				} else if (this.mode === TIME_TYPES.HMS) {
					const [hour, minute, second] = val.split(':');
					this.selectHour = parseInt(hour);
					this.selectMinute = parseInt(minute);
					this.selectSecond = parseInt(second);
				}
			},

			// 补零
			padZero(num) {
				return num < 10 ? '0' + num : num.toString();
			},

			// 格式化当前值
			formatCurrentValue() {
				switch (this.mode) {
					case TIME_TYPES.Y:
						return `${this.selectYear}`;
					case TIME_TYPES.YM:
						return `${this.selectYear}-${this.padZero(this.selectMonth)}`;
					case TIME_TYPES.YMD:
						return `${this.selectYear}-${this.padZero(this.selectMonth)}-${this.padZero(this.selectDay)}`;
					case TIME_TYPES['YMD-HM']:
						return `${this.selectYear}-${this.padZero(this.selectMonth)}-${this.padZero(this.selectDay)} ${this.padZero(this.selectHour)}:${this.padZero(this.selectMinute)}`;
					case TIME_TYPES['YMD-HMS']:
						return `${this.selectYear}-${this.padZero(this.selectMonth)}-${this.padZero(this.selectDay)} ${this.padZero(this.selectHour)}:${this.padZero(this.selectMinute)}:${this.padZero(this.selectSecond)}`;
					case TIME_TYPES.HM:
						return `${this.padZero(this.selectHour)}:${this.padZero(this.selectMinute)}`;
					case TIME_TYPES.HMS:
						return `${this.padZero(this.selectHour)}:${this.padZero(this.selectMinute)}:${this.padZero(this.selectSecond)}`;
					default:
						return '';
				}
			},

			// 打开选择器
			openPicker() {
				if (!this.value && !this.displayValue) {
					this.setNow();
				}
				this.tempValue = this.displayValue;
				this.lastIndexArr = this.indexArr.slice();
				this.showModal = true;
			},

			// 关闭选择器
			closePicker() {
				this.showModal = false;
				this.$emit('update:show', false);
			},

			// 取消选择
			cancelPicker() {
				this.closePicker();
			},

			// 重置选择
			resetPicker() {
				this.$emit('input','');
				this.$emit('change', {
					value: '',
					year: '',
					month: '',
					day: '',
					hour: '',
					minute: '',
					second: '',
					format: ''
				});
				this.closePicker();
				// const now = new Date();
				// this.selectYear = now.getFullYear();
				// this.selectMonth = now.getMonth() + 1;
				// this.selectDay = now.getDate();
				// this.selectHour = now.getHours();
				// this.selectMinute = now.getMinutes();
				// this.selectSecond = now.getSeconds();
			},

			// 确认选择
			confirmPicker() {
				const value = this.formatCurrentValue();
				this.displayValue = value;
				this.$emit('input', value);
				this.$emit('change', {
					value: value,
					year: this.selectYear,
					month: this.selectMonth,
					day: this.selectDay,
					hour: this.selectHour,
					minute: this.selectMinute,
					second: this.selectSecond,
					format: this.modeConfig.format
				});
				this.closePicker();
			},

			// 选择器值变化
			onChange(e) {
				const {
					value
				} = e.detail;
				const oldValue = this.lastIndexArr || [];

				switch (this.mode) {
					case TIME_TYPES.Y:
						if (value[0] !== undefined) {
							this.selectYear = this.years[value[0]];
						}
						break;
					case TIME_TYPES.YM:
						if (value[0] !== undefined) this.selectYear = this.years[value[0]];
						if (value[1] !== undefined) this.selectMonth = this.loopValue(this.months, value[1]);
						break;
					case TIME_TYPES.YMD:
						if (value[0] !== undefined) this.selectYear = this.years[value[0]];
						if (value[1] !== undefined) this.selectMonth = this.loopValue(this.months, value[1]);
						if (value[2] !== undefined) {
							this.selectDay = value[2] === oldValue[2] ? Math.min(this.selectDay, this.days[this.days.length - 1]) : this.loopValue(this.days, value[2]);
						}
						break;
					case TIME_TYPES['YMD-HM']:
						if (value[0] !== undefined) this.selectYear = this.years[value[0]];
						if (value[1] !== undefined) this.selectMonth = this.loopValue(this.months, value[1]);
						if (value[2] !== undefined) {
							this.selectDay = value[2] === oldValue[2] ? Math.min(this.selectDay, this.days[this.days.length - 1]) : this.loopValue(this.days, value[2]);
						}
						if (value[3] !== undefined) this.selectHour = this.loopValue(this.hours, value[3]);
						if (value[4] !== undefined) this.selectMinute = this.loopValue(this.minutes, value[4]);
						break;
					case TIME_TYPES['YMD-HMS']:
						if (value[0] !== undefined) this.selectYear = this.years[value[0]];
						if (value[1] !== undefined) this.selectMonth = this.loopValue(this.months, value[1]);
						if (value[2] !== undefined) {
							this.selectDay = value[2] === oldValue[2] ? Math.min(this.selectDay, this.days[this.days.length - 1]) : this.loopValue(this.days, value[2]);
						}
						if (value[3] !== undefined) this.selectHour = this.loopValue(this.hours, value[3]);
						if (value[4] !== undefined) this.selectMinute = this.loopValue(this.minutes, value[4]);
						if (value[5] !== undefined) this.selectSecond = this.loopValue(this.seconds, value[5]);
						break;
					case TIME_TYPES.HM:
						if (value[0] !== undefined) this.selectHour = this.loopValue(this.hours, value[0]);
						if (value[1] !== undefined) this.selectMinute = this.loopValue(this.minutes, value[1]);
						break;
					case TIME_TYPES.HMS:
						if (value[0] !== undefined) this.selectHour = this.loopValue(this.hours, value[0]);
						if (value[1] !== undefined) this.selectMinute = this.loopValue(this.minutes, value[1]);
						if (value[2] !== undefined) this.selectSecond = this.loopValue(this.seconds, value[2]);
						break;
				}
				this.lastIndexArr = value.slice();

				// 如果是内部模式，直接触发事件
				if (this.isInternalMode) {
					const currentValue = this.formatCurrentValue();
					this.$emit('input', currentValue);
					this.$emit('change', {
						value: currentValue,
						year: this.selectYear,
						month: this.selectMonth,
						day: this.selectDay,
						hour: this.selectHour,
						minute: this.selectMinute,
						second: this.selectSecond,
						format: this.modeConfig.format
					});
				}
			}
		}
	};
</script>

<style lang="scss" scoped>
	/* 触发器样式 */
	.my-time-trigger {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 12px 16px;
		border: 1px solid #dcdfe6;
		border-radius: 4px;
		background-color: #fff;
		cursor: pointer;
		transition: border-color 0.2s;

		&:hover {
			border-color: #007aff;
		}
	}

	.default-trigger {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;

		.trigger-text {
			color: #606266;
			font-size: 14px;
		}

		.trigger-icon {
			color: #c0c4cc;
			font-size: 16px;
		}
	}

	/* 选择器样式 */
	.my-time-picker {
		width: 100%;
		height: 200px;
		position: relative;
	}

	.picker-view {
		width: 100%;
		height: 100%;
	}

	.picker-view-column {
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 16px;
		color: #333;
		text-align: center;
	}

	.picker-view-column view {
		line-height: 34px;
		padding: 0 10px;
	}

	/* 弹框遮罩 */
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(0, 0, 0, 0.5);
		z-index: 999;
		opacity: 0;
		visibility: hidden;
		transition: all 0.3s ease;

		&.show {
			opacity: 1;
			visibility: visible;
		}
	}

	/* 弹框容器 */
	.modal-container {
		position: fixed;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: #fff;
		border-radius: 20px 20px 0 0;
		z-index: 1000;
		max-height: 70vh;
		transform: translateY(100%);
		transition: transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);

		&.show {
			transform: translateY(0);
		}
	}

	.modal-header {
		padding: 20px 20px 10px;
		border-bottom: 1px solid #eee;

		.modal-title {
			font-size: 18px;
			font-weight: bold;
			color: #333;
			text-align: center;
		}
	}

	.modal-content {
		padding: 20px;
		max-height: 50vh;
		overflow-y: auto;
	}

	.modal-footer {
		display: flex;
		padding: 15px 20px 20px;
		border-top: 1px solid #eee;
		gap: 10px;
	}

	.footer-button {
		flex: 1;
		height: 44px;
		border-radius: 8px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 16px;
		font-weight: 500;
		transition: all 0.2s ease;

		&:active {
			transform: scale(0.95);
		}

		text {
			color: inherit;
		}
	}

	.cancel-btn {
		background-color: #f5f5f5;
		color: #666;

		&:active {
			background-color: #e0e0e0;
		}
	}

	.reset-btn {
		background-color: #ff9500;
		color: #fff;

		&:active {
			background-color: #e6850e;
		}
	}

	.confirm-btn {
		background-color: #007aff;
		color: #fff;

		&:active {
			background-color: #0056cc;
		}
	}
</style>
