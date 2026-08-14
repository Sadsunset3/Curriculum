# d-datetime-picker UniApp 日期时间选择器组件


### 此插件已加入长期维护计划：LTS  ⭐⭐⭐⭐⭐

一个功能强大的 UniApp 日期时间选择器组件，支持多种日期时间模式，包含弹框模式和内嵌模式。

````

https://ext.dcloud.net.cn/publisher?id=117346  全部插件入口

已亲测，有问题聊天窗口私聊我  都给你解决，  没问题的话来个好评吧

````


## 功能特性

- 🗓️ 支持多种日期时间模式：年份、年月、年月日、年月日时分、年月日时分秒、时分、时分秒
- 📱 响应式设计，适配移动端
- 🎨 现代化的弹框样式，支持动画过渡
- ⚙️ 支持日期时间范围限制
- 🔄 支持内嵌模式直接显示选择器
- 🎯 支持实时值变化监听

## 安装使用

将组件放置在 `components/datetime/` 目录下，然后在页面中引入使用：

```vue
<template>
  <view>
    <!-- 基础用法 -->
    <my-time 
      v-model="dateValue" 
      :mode="3" 
      placeholder="请选择日期"
      @change="onDateChange"
    />
  </view>
</template>

<script>
export default {
  data() {
    return {
      dateValue: ''
    }
  },
  methods: {
    onDateChange(data) {
      console.log('选择的日期:', data)
    }
  }
}
</script>
```

## Props 属性

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| mode | Number | 3 | 选择模式：1=年份，2=年月，3=年月日，4=年月日时分，5=年月日时分秒，7=时分，8=时分秒 |
| value | String | '' | 默认值，支持 v-model |
| placeholder | String | '请选择' | 占位符文本 |
| minDate | String | '' | 可选的最小日期，格式如：'2020-01-01' |
| maxDate | String | '' | 可选的最大日期，格式如：'2030-12-31' |
| minTime | String | '' | 可选的最小时间，格式如：'08:00:00' |
| maxTime | String | '' | 可选的最大时间，格式如：'18:00:00' |
| isInternalMode | Boolean | false | 是否为内部模式（直接显示选择器，不显示弹框） |
| show | Boolean | false | 控制弹框显示隐藏，支持 .sync 修饰符 |

## Events 事件

| 事件名 | 说明 | 回调参数 |
|--------|------|----------|
| input | 值变化时触发 | 格式化后的日期时间字符串 |
| change | 确认选择时触发 | 包含详细信息的对象 |

### change 事件回调参数

```javascript
{
  value: '2023-12-25 14:30:00',  // 格式化后的完整值
  year: 2023,                   // 年份
  month: 12,                    // 月份
  day: 25,                      // 日期
  hour: 14,                     // 小时
  minute: 30,                   // 分钟
  second: 0,                    // 秒钟
  format: 'YYYY-MM-DD HH:mm:ss' // 格式模板
}
```

## 选择模式说明

| Mode | 值 | 说明 | 返回格式 |
|------|---|------|----------|
| Y | 1 | 年份选择 | 2023 |
| YM | 2 | 年月选择 | 2023-12 |
| YMD | 3 | 年月日选择 | 2023-12-25 |
| YMD-HM | 4 | 年月日时分选择 | 2023-12-25 14:30 |
| YMD-HMS | 5 | 年月日时分秒选择 | 2023-12-25 14:30:00 |
| HM | 7 | 时分选择 | 14:30 |
| HMS | 8 | 时分秒选择 | 14:30:00 |

## 使用示例

### 基础日期选择

```vue
<template>
  <view>
    <my-time 
      v-model="date" 
      :mode="3" 
      placeholder="选择日期"
    />
    <text>选择的日期：{{ date }}</text>
  </view>
</template>

<script>
export default {
  data() {
    return {
      date: ''
    }
  }
}
</script>
```

### 带时间的日期选择

```vue
<template>
  <view>
    <my-time 
      v-model="datetime" 
      :mode="5" 
      placeholder="选择日期时间"
      @change="onDateTimeChange"
    />
  </view>
</template>

<script>
export default {
  data() {
    return {
      datetime: ''
    }
  },
  methods: {
    onDateTimeChange(data) {
      console.log('选择的日期时间:', data.value)
      console.log('年:', data.year, '月:', data.month, '日:', data.day)
      console.log('时:', data.hour, '分:', data.minute, '秒:', data.second)
    }
  }
}
</script>
```

### 时间范围限制

```vue
<template>
  <view>
    <my-time 
      v-model="date" 
      :mode="3" 
      min-date="2020-01-01"
      max-date="2030-12-31"
      placeholder="选择日期"
    />
  </view>
</template>
```

### 时间选择限制

```vue
<template>
  <view>
    <my-time 
      v-model="time" 
      :mode="7" 
      min-time="08:00"
      max-time="18:00"
      placeholder="选择时间"
    />
  </view>
</template>
```

### 内嵌模式

```vue
<template>
  <view>
    <text>选择日期：</text>
    <my-time 
      v-model="date" 
      :mode="3" 
      :is-internal-mode="true"
      @change="onDateChange"
    />
    <text>当前值：{{ date }}</text>
  </view>
</template>
```

### 外部控制显示隐藏

```vue
<template>
  <view>
    <button @click="showPicker = true">打开选择器</button>
    <my-time 
      v-model="date" 
      :mode="3" 
      :show.sync="showPicker"
    />
  </view>
</template>

<script>
export default {
  data() {
    return {
      date: '',
      showPicker: false
    }
  }
}
</script>
```

## 样式定制

组件使用了 scoped 样式，如需定制样式，可以通过以下 CSS 类名进行覆盖：

- `.modal-container` - 弹框容器
- `.modal-header` - 弹框头部
- `.modal-content` - 弹框内容区域
- `.modal-footer` - 弹框底部按钮区域
- `.picker-view` - 选择器视图
- `.picker-view-column` - 选择器列

## 注意事项

1. 组件基于 UniApp 的 `picker-view` 组件实现
2. 日期范围限制时，请确保 `minDate` 和 `maxDate` 格式正确
3. 内嵌模式下会直接触发 `change` 事件，无需确认操作
4. 组件支持双向绑定，推荐使用 `v-model`

## 兼容性

- ✅ H5
- ✅ 小程序（微信、支付宝、百度等）  
- ✅ App（Vue）

## 更新日志

### v1.0.0
- 初始版本发布
- 支持多种日期时间选择模式
- 支持弹框和内嵌两种显示模式
- 支持日期时间范围限制

此插件参考的：https://ext.dcloud.net.cn/plugin?id=7381