# 微习惯 App 开发文档

## 1. 技术目标

MVP 目标是在移动端实现完整单机闭环：

```text
创建习惯 → 今日启动 → 计时或动作完成 → 写入记录 → 查看总览和详情 → 获得成就反馈
```

优先保证本地体验稳定、交互顺滑、数据口径清晰。MVP 不依赖服务端。

## 2. 推荐技术方案

### 2.1 客户端

推荐优先级：

1. iOS 原生 SwiftUI。
2. 如果需要跨端，使用 Flutter。
3. Web MVP 可使用 React + Vite + IndexedDB。

当前 HTML 原型仅用于产品交互验证，不建议直接作为生产代码。

### 2.2 本地存储

iOS 原生：

1. SwiftData 或 Core Data。
2. UserDefaults 仅用于轻量配置，不存核心记录。

Web MVP：

1. IndexedDB 存 habits、logs、achievements。
2. localStorage 仅存 UI 设置。

### 2.3 通知

MVP 使用本地通知：

1. iOS：UNUserNotificationCenter。
2. Web：Notification API，能力不足时降级为无提醒。

## 3. 模块划分

```text
Habit
  HabitList
  HabitCreate
  HabitDetail

Session
  ActionComplete
  OneMinuteTimer
  FiveMinuteFocus

Record
  RecordOverview
  RecordCalendar

Achievement
  AchievementList

Infrastructure
  Storage
  Notification
  Analytics
```

## 4. 数据模型

### 4.1 Habit

```ts
type StartMode = "action" | "timer";
type HabitStatus = "active" | "paused" | "archived";

interface Habit {
  id: string;
  title: string;
  trigger: string;
  startMode: StartMode;
  minimumTarget: string;
  extensionTarget?: string;
  frequency: "daily";
  reminderTime?: string;
  status: HabitStatus;
  createdAt: string;
  updatedAt: string;
}
```

### 4.2 HabitLog

```ts
type LogStatus = "completed" | "paused" | "skipped";
type LogSource = "action" | "timer_1m" | "focus_5m";

interface HabitLog {
  id: string;
  habitId: string;
  date: string;
  status: LogStatus;
  source: LogSource;
  durationSeconds: number;
  focusRounds: number;
  createdAt: string;
  updatedAt: string;
}
```

### 4.3 Achievement

```ts
interface Achievement {
  id: string;
  code: string;
  title: string;
  description: string;
  unlockedAt?: string;
}
```

## 5. 存储表设计

### 5.1 habits

主键：id

索引：

1. status。
2. createdAt。
3. startMode。

### 5.2 habit_logs

主键：id

唯一约束：

```text
habitId + date
```

原因：同一个习惯同一天只能有一条主记录。重复完成时更新记录的 durationSeconds、focusRounds 和 updatedAt。

索引：

1. habitId。
2. date。
3. habitId + date。
4. source。

### 5.3 achievements

主键：id  
唯一约束：code

## 6. 核心业务规则

### 6.1 活跃习惯上限

MVP 限制最多 3 个 active 习惯。

```ts
function canCreateHabit(activeHabitCount: number): boolean {
  return activeHabitCount < 3;
}
```

### 6.2 创建习惯

校验：

1. title 非空。
2. trigger 非空。
3. startMode 必须为 action 或 timer。
4. timer 模式 minimumTarget 固定为 1 分钟启动。
5. active 数量不能超过 3。

### 6.3 完成动作型习惯

输入：habitId

逻辑：

```text
读取今天是否已有该 habitId 记录
如果没有，创建 completed 记录
如果已有，更新为 completed
source = action
durationSeconds = 0
focusRounds = 0
刷新今日页
打开单习惯详情
触发成就检测
```

### 6.4 完成 1 分钟启动

输入：habitId、durationSeconds

逻辑：

```text
durationSeconds >= 1 即可记录启动
如果用户完整完成 60 秒，durationSeconds = 60
source = timer_1m
status = completed
```

注意：MVP 中“开始 1 分钟后提前退出是否算完成”由产品策略决定。建议超过 10 秒且用户主动点击完成时算 completed，否则不记录。

### 6.5 完成 5 分钟沉浸

输入：habitId、rounds、durationSeconds

逻辑：

```text
写入或更新当天记录
source = focus_5m
durationSeconds += 本次沉浸时长
focusRounds += rounds
status = completed
```

### 6.6 全部记录总览

查询：

1. active habits。
2. 今日 completed logs。
3. 本周 completed logs。
4. 每个 habit 的累计完成和本周完成。

输出：

```ts
interface RecordOverview {
  todayCompleted: number;
  todayTotal: number;
  weeklyStarts: number;
  habits: HabitSummary[];
}

interface HabitSummary {
  habitId: string;
  title: string;
  trigger: string;
  totalCompleted: number;
  weeklyCompleted: number;
  progress: number;
}
```

### 6.7 单习惯详情

查询：

1. habit by id。
2. habit_logs by habitId。
3. 当月日志。
4. 恢复速度。

输出：

```ts
interface HabitDetail {
  habit: Habit;
  totalCompleted: number;
  recoverySpeedText: string;
  monthDays: CalendarDay[];
}

interface CalendarDay {
  date: string;
  status: "done" | "pause" | "empty";
}
```

## 7. 统计算法

### 7.1 今日完成数

```ts
function getTodayCompleted(logs: HabitLog[], today: string): number {
  return new Set(
    logs
      .filter((log) => log.date === today && log.status === "completed")
      .map((log) => log.habitId)
  ).size;
}
```

### 7.2 累计完成

```ts
function getTotalCompleted(logs: HabitLog[], habitId: string): number {
  return logs.filter(
    (log) => log.habitId === habitId && log.status === "completed"
  ).length;
}
```

### 7.3 恢复速度

定义：最近一次非 completed 日期之后，到下一次 completed 的间隔。

简化实现：

```ts
function getRecoverySpeed(days: CalendarDay[]): string {
  const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date));
  let lastBreakIndex = -1;

  for (let i = sorted.length - 1; i >= 0; i -= 1) {
    if (sorted[i].status === "pause" || sorted[i].status === "empty") {
      lastBreakIndex = i;
      break;
    }
  }

  if (lastBreakIndex === -1) return "连续中";

  const nextDoneIndex = sorted.findIndex(
    (day, index) => index > lastBreakIndex && day.status === "done"
  );

  if (nextDoneIndex === -1) return "待恢复";

  const interval = nextDoneIndex - lastBreakIndex;
  return interval === 0 ? "当天" : `${interval} 天`;
}
```

生产实现需要按真实日期差计算，不能只按数组下标。

## 8. 页面开发说明

### 8.1 TodayView

职责：

1. 拉取 active habits。
2. 拉取今日 logs。
3. 合并得到今日状态。
4. 根据 startMode 渲染不同按钮。

关键交互：

1. action 点击：调用 completeActionHabit(habitId)。
2. timer 点击：打开 OneMinuteTimerView(habitId)。
3. create 点击：打开 HabitCreateView。

### 8.2 HabitCreateView

职责：

1. 展示模板。
2. 切换 startMode。
3. 编辑 title、trigger、minimumTarget、extensionTarget。
4. 创建 habit。

模板结构：

```ts
interface HabitTemplate {
  id: string;
  title: string;
  trigger: string;
  startMode: StartMode;
  minimumTarget: string;
  extensionTarget?: string;
}
```

### 8.3 OneMinuteTimerView

状态：

```ts
interface TimerState {
  habitId: string;
  duration: 60;
  remaining: number;
  isRunning: boolean;
}
```

规则：

1. 页面出现自动开始。
2. pause 切换 isRunning。
3. complete 写入 timer_1m log。
4. continue 打开 FiveMinuteFocusView。

### 8.4 FiveMinuteFocusView

状态：

```ts
interface FocusState {
  habitId: string;
  duration: 300;
  remaining: number;
  rounds: number;
  isRunning: boolean;
}
```

规则：

1. 页面出现自动开始。
2. 完成一轮后 rounds + 1。
3. 再来 5 分钟重置 remaining = 300。
4. 完成并记录写入 focus_5m log。

### 8.5 RecordOverviewView

职责：

1. 展示全部习惯统计。
2. 点击 habit summary 打开 HabitDetailView。

注意：底部导航“记录”必须进入 RecordOverviewView，不应直接进入某个 HabitDetailView。

### 8.6 HabitDetailView

职责：

1. 接收 habitId。
2. 查询单个 habit 和 logs。
3. 渲染当前习惯自己的日历和统计。

注意：从“动作完成”或“计时完成”跳转过来时，必须传入对应 habitId。

## 9. 路由设计

```text
/today
/create
/timer/:habitId
/focus/:habitId
/records
/records/:habitId
/achievements
```

移动端原生可映射为 NavigationStack：

```text
TabView
  Today
  Create
  Records
  Achievements

Push
  OneMinuteTimer
  FiveMinuteFocus
  HabitDetail
```

## 10. 状态管理

MVP 推荐轻量状态管理。

Web：

1. React Context + reducer。
2. Zustand。

iOS：

1. Observable model。
2. SwiftData query。

核心 Store：

```ts
interface HabitStore {
  habits: Habit[];
  logs: HabitLog[];
  createHabit(input: CreateHabitInput): Promise<Habit>;
  completeActionHabit(habitId: string): Promise<void>;
  completeTimerHabit(habitId: string, durationSeconds: number): Promise<void>;
  completeFocusHabit(habitId: string, durationSeconds: number, rounds: number): Promise<void>;
  getRecordOverview(): RecordOverview;
  getHabitDetail(habitId: string): HabitDetail;
}
```

## 11. 通知实现

### 11.1 权限

首次创建带提醒的习惯时请求权限，不在首次打开 App 时请求。

### 11.2 调度

每个 active habit 可有一个本地通知。

通知 ID：

```text
habit_reminder_${habitId}
```

当 habit paused 或 archived 时取消通知。

## 12. 成就实现

MVP 成就规则：

```ts
const achievementRules = [
  {
    code: "start_3_days",
    title: "三天启动",
    condition: (ctx) => ctx.maxStreak >= 3
  },
  {
    code: "start_7_days",
    title: "一周连续",
    condition: (ctx) => ctx.maxStreak >= 7
  },
  {
    code: "complete_25",
    title: "小动作 25 次",
    condition: (ctx) => ctx.totalCompleted >= 25
  }
];
```

触发时机：

1. 创建完成记录后。
2. App 打开时做一次补偿检查。

## 13. 埋点实现

埋点接口：

```ts
interface Analytics {
  track(eventName: string, properties?: Record<string, unknown>): void;
}
```

MVP 可以先打印到本地日志，后续替换为真实 SDK。

必须接入的事件见 [PRD.md](./PRD.md) 第 13 节。

## 14. 测试用例

### 14.1 创建习惯

1. 输入完整字段，创建成功。
2. 微动作为空，创建失败。
3. 触发场景为空，创建失败。
4. 已有 3 个 active 习惯，再创建失败。

### 14.2 动作启动

1. 点击动作型习惯后写入当天 completed log。
2. 重复点击同一习惯，不重复增加今日完成数。
3. 完成后进入对应 habitId 的详情页。

### 14.3 计时启动

1. 进入 1 分钟页后自动倒计时。
2. 暂停后倒计时停止。
3. 完成 1 分钟后写入 timer_1m log。
4. 进入 5 分钟后写入 focus_5m log。
5. 再来 5 分钟后 rounds 增加。

### 14.4 记录

1. 底部记录入口进入全部记录总览。
2. 点击概览卡进入单习惯详情。
3. 单习惯详情只展示当前 habitId 的 logs。
4. 深蹲完成后详情标题为“做 1 个深蹲”。
5. 读书计时完成后详情标题为“读 1 页书”。

### 14.5 成就

1. 连续 3 天完成后解锁“三天启动”。
2. 同一成就不重复解锁。

## 15. 开发排期建议

### Sprint 1：基础闭环，5 个工作日

1. 数据模型和本地存储。
2. 今日页。
3. 创建页。
4. 动作启动完成。
5. 全部记录总览和单习惯详情。

### Sprint 2：计时与反馈，5 个工作日

1. 1 分钟启动页。
2. 5 分钟沉浸页。
3. 计时状态管理。
4. 完成反馈。
5. 成就页基础版本。

### Sprint 3：质量与发布，4 个工作日

1. 本地通知。
2. 埋点。
3. 边界处理。
4. UI 细节打磨。
5. 测试和 TestFlight。

## 16. 风险与处理

| 风险 | 影响 | 处理 |
|---|---|---|
| 计时后台行为不一致 | 记录不准确 | 使用系统时间戳计算剩余时间 |
| 用户创建过多习惯 | 留存下降 | MVP 限制 3 个 active |
| 用户误解记录页 | 信息架构混乱 | 总览和详情严格拆分 |
| 断签挫败感 | 用户流失 | 用暂停、恢复、接上替代失败文案 |
| 通知权限低 | 提醒效果弱 | 创建时再请求权限，提高授权意愿 |

## 17. 验收清单

1. 首次打开可创建习惯。
2. 创建后今日页显示该习惯。
3. 动作启动和计时启动逻辑分开。
4. 计时页倒计时准确。
5. 完成后写入当天记录。
6. 底部记录为全部总览。
7. 单习惯详情数据按 habitId 隔离。
8. 刷新或重启后本地数据保留。
9. 断签相关文案不出现“失败”“惩罚”。
10. 核心埋点可被触发。

