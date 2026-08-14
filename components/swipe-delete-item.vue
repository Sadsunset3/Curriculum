<template>
  <view class="swipe-item" @touchstart="onTouchStart" @touchmove="onTouchMove" @touchend="onTouchEnd">
    <view class="delete-action" @tap.stop="onDelete">删除</view>
    <view class="swipe-content" :style="contentStyle">
      <slot />
    </view>
  </view>
</template>

<script>
export default {
  props: {
    deleteWidthRpx: {
      type: Number,
      default: 136
    }
  },
  data() {
    return {
      startX: 0,
      currentOffset: 0,
      deleteWidth: 80,
      touching: false
    }
  },
  computed: {
    contentStyle() {
      return `transform: translateX(${this.currentOffset}px);`
    }
  },
  mounted() {
    this.deleteWidth = uni.upx2px(this.deleteWidthRpx)
  },
  methods: {
    onTouchStart(event) {
      this.startX = event.changedTouches[0].pageX
      this.touching = true
    },
    onTouchMove(event) {
      if (!this.touching) return
      const deltaX = event.changedTouches[0].pageX - this.startX
      const baseOffset = this.currentOffset < 0 ? -this.deleteWidth : 0
      const nextOffset = Math.min(0, Math.max(-this.deleteWidth, baseOffset + deltaX))
      this.currentOffset = nextOffset
    },
    onTouchEnd() {
      if (!this.touching) return
      this.touching = false
      this.currentOffset = Math.abs(this.currentOffset) > this.deleteWidth / 2 ? -this.deleteWidth : 0
    },
    close() {
      this.currentOffset = 0
    },
    onDelete() {
      this.close()
      this.$emit('delete')
    }
  }
}
</script>

<style>
.swipe-item {
  position: relative;
  width: 100%;
  overflow: hidden;
  border-radius: 20rpx;
}

.delete-action {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 136rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #eceff3;
  color: #b42318;
  font-size: 26rpx;
  font-weight: 600;
}

.swipe-content {
  width: 100%;
  display: block;
  position: relative;
  z-index: 1;
  border-radius: 20rpx;
  background: #ffffff;
  transition: transform 180ms ease-out;
  will-change: transform;
}
</style>
