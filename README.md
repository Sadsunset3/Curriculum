# 知白课程表 (Curriculum)

一款面向在校学生的**本地优先**极简课程表 App。基于 [uni-app](https://uniapp.dcloud.net.cn/)（Vue 3）构建，可运行于微信小程序、App 及 H5。

打开快、操作直接、不依赖登录和联网——所有课程、便签、事件与学期信息均只保存在本地设备上。

## 功能特性

- **今日课程** — 按当天星期与当前教学周自动过滤，只展示今天要上的课，一眼看清。
- **周课表** — 横向滚动的周视图，展示 7 天 × 12 节的全部课时，支持周次前后切换与课表分享。
- **课程管理** — 本地课程的增删改查，可设置课程名称、星期、节次、周次范围、单双周、教室与教师，并自动分配柔和的主题色。
- **学期设置** — 配置学年、学期、开学日期与总周数，自动推算当前教学周（未开学 / 进行中 / 已结束）。
- **安排** — 课程相关的轻量记录：两栏便签墙 + 带日期的待办事件，支持完成勾选与滑动删除。
- **智能导入** — 借助外部 AI（推荐 DeepSeek）把课表截图 / PDF / Excel 整理成结构化 JSON，App 内完成校验、预览与导入，解析失败还会生成反馈 Prompt 让 AI 自动修正。

## 技术栈

| 项目 | 说明 |
| --- | --- |
| 框架 | uni-app（Vue 3，`vueVersion: 3`） |
| 构建工具 | HBuilderX |
| 状态与存储 | 本地优先，全部基于 `uni.setStorageSync` 持久化，无后端、无登录 |
| UI 组件 | 自研 `swipe-delete-item`（滑动删除）、uni_modules `d-datetime-picker`（日期时间选择） |

## 项目结构

```
Curriculum/
├── App.vue                  # 应用入口与全局样式
├── main.js                  # 应用启动（Vue 3）
├── pages.json               # 页面路由与 tabBar 配置
├── manifest.json            # 应用配置（各平台打包设置）
├── uni.scss                 # 全局 SCSS 变量
├── pages/                   # 页面
│   ├── index/               # 今日课程
│   ├── week/                # 周课表
│   ├── courses/             # 课程管理 + 学期设置
│   ├── course-form/         # 添加 / 编辑课程
│   ├── arrange/             # 安排（便签 + 事件）
│   └── import-story/        # 智能导入
├── components/
│   └── swipe-delete-item.vue
├── utils/                   # 业务逻辑层
│   ├── courseStorage.js     # 课程数据读写
│   ├── courseFormat.js      # 节次 / 星期 / 单双周等格式化与过滤逻辑
│   ├── arrangementStorage.js# 便签与事件数据读写
│   ├── termConfig.js        # 学期配置与当前周推算
│   └── scheduleImport.js    # 智能导入：Prompt、JSON 校验、导入
├── static/                  # 静态资源（图标、tabBar 图标）
└── uni_modules/             # uni 插件（d-datetime-picker）
```

## 本地数据模型

所有数据保存在本机 storage 中，对应 key 前缀 `curriculum_*`：

- **课程**：`名称 / 星期(1-7) / 节次([1,2]…) / 周次范围([开始周,结束周]) / 单双周模式(all|odd|even) / 教室 / 教师 / 主题色`
- **学期**：`学年 / 学期(1|2) / 开学日期 / 总周数`
- **安排**：`便签(content) 与 事件(title + 日期时间 + 完成状态)`

## 快速开始

本项目使用 HBuilderX 开发，无 `package.json`（不需要 npm 安装依赖）。

1. 安装 [HBuilderX](https://www.dcloud.io/hbuilderx.html)（建议使用 `cli` 项目模式或直接打开工程目录）。
2. 用 HBuilderX 打开本目录。
3. 选择运行目标（微信小程序 / App / H5），点击「运行」即可。

> 微信小程序端需先在 `manifest.json` 的 `mp-weixin.appid` 中填入自己的小程序 AppID。

## 智能导入工作流

「课程管理 → 智能导入」通过外部 AI 完成课表录入，全程无需手动逐条添加：

1. 复制内置的导入 Prompt，连同课表截图 / PDF / Excel 一起发给外部 AI（如 DeepSeek）。
2. AI 严格返回结构化 JSON（`termConfig` + `courses`）。
3. 将 JSON 粘贴或从剪贴板读取进 App，点击「解析 JSON」完成校验与预览。
4. 确认无误后导入，会自动覆盖本地课程与学期信息。

内置了严格的字段校验（星期、节次、周次、单双周等），解析失败时生成的反馈 Prompt 可引导 AI 自动修正后重新返回。

## 设计理念

克制品、安静、可靠。整体气质偏轻量工具而非效率平台：

- 本地优先，重要信息尽量在当前页面完成。
- 交互短路径，新增、查看、删除一眼可懂。
- 视觉安静，白底与浅灰卡片服务内容，不制造干扰。
- 课程表与安排墙使用同一产品语言，组件语气一致。
- 新增能力优先降低认知负担，而不是增加管理维度。

> 详细的产品定位与设计规范见 [`PRODUCT.md`](./PRODUCT.md)。
