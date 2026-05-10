# 1mhabit

1mhabit（1 分钟习惯）是一款微信小程序 MVP，用于帮助用户通过“动作启动”和“1 分钟启动”建立微习惯。

## 产品定位

产品核心不是监督用户自律，而是帮助用户跨过开始前的阻力。

核心流程：

```text
动作启动：触发场景 → 完成一个极小动作 → 记录
计时启动：触发场景 → 1 分钟启动 → 5 分钟沉浸 → 记录
```

## 已实现功能

- 今日页：展示活跃微习惯，区分动作启动和计时启动
- 创建页：模板选择、启动方式切换、创建微习惯
- 1 分钟启动页：倒计时、暂停、完成、进入 5 分钟
- 5 分钟沉浸页：倒计时、再来 5 分钟、完成记录
- 记录页：全部习惯记录总览
- 详情页：单个习惯记录、累计完成、恢复速度、月历、删除习惯
- 成就页：轻量徽章反馈
- 本地存储：使用 `wx.getStorageSync` / `wx.setStorageSync`

## 目录结构

```text
.
├── app.js
├── app.json
├── app.wxss
├── pages
│   ├── today
│   ├── create
│   ├── timer
│   ├── focus
│   ├── record
│   ├── detail
│   └── achievement
├── utils
│   ├── date.js
│   └── store.js
├── PRD.md
├── DEVELOPMENT.md
└── micro-habit-prototype.html
```

## 如何运行

1. 打开微信开发者工具。
2. 选择“导入项目”。
3. 项目目录选择本仓库根目录。
4. AppID 可先使用测试号或在 `project.config.json` 中替换为正式 AppID。
5. 点击“编译”运行。

## 数据说明

MVP 暂不接后端，所有数据保存在本地缓存中。

主要数据模型：

- `Habit`：习惯
- `HabitLog`：完成记录
- `Achievement`：成就

删除习惯当前采用归档逻辑：今日页不再展示该习惯，但历史记录保留在本地。

## 文档

- [产品需求文档](./PRD.md)
- [开发文档](./DEVELOPMENT.md)
- [HTML 交互原型](./micro-habit-prototype.html)

## 后续计划

- 接入微信登录和云开发
- 增加提醒通知
- 增加习惯暂停和恢复管理
- 增加数据同步
- 增加更完整的成就体系
