const { todayString, isThisWeek } = require("./date");

const HABITS_KEY = "micro_habits";
const LOGS_KEY = "micro_habit_logs";
const ACHIEVEMENTS_KEY = "micro_achievements";

function uid(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function read(key, fallback) {
  const value = wx.getStorageSync(key);
  return value || fallback;
}

function write(key, value) {
  wx.setStorageSync(key, value);
}

function getHabits() {
  return read(HABITS_KEY, []);
}

function saveHabits(habits) {
  write(HABITS_KEY, habits);
}

function getLogs() {
  return read(LOGS_KEY, []);
}

function saveLogs(logs) {
  write(LOGS_KEY, logs);
}

function getAchievements() {
  return read(ACHIEVEMENTS_KEY, []);
}

function saveAchievements(achievements) {
  write(ACHIEVEMENTS_KEY, achievements);
}

function ensureSeedData() {
  if (getHabits().length) return;

  const now = new Date().toISOString();
  const habits = [
    {
      id: "read",
      title: "读 1 页书",
      trigger: "午饭后，收拾餐具之后",
      startMode: "timer",
      minimumTarget: "1 分钟启动",
      extensionTarget: "5 分钟沉浸，可重复延长",
      frequency: "daily",
      status: "active",
      createdAt: now,
      updatedAt: now
    },
    {
      id: "squat",
      title: "做 1 个深蹲",
      trigger: "早上刷牙之后",
      startMode: "action",
      minimumTarget: "做完 1 个深蹲",
      extensionTarget: "可以再做 5 个",
      frequency: "daily",
      status: "active",
      createdAt: now,
      updatedAt: now
    },
    {
      id: "write",
      title: "写 1 句话",
      trigger: "睡前手机充电之后",
      startMode: "timer",
      minimumTarget: "1 分钟启动",
      extensionTarget: "继续写 5 分钟",
      frequency: "daily",
      status: "paused",
      createdAt: now,
      updatedAt: now
    }
  ];

  const days = [1, 2, 4, 5, 6, 7, 9, 10];
  const logs = days.map((day, index) => ({
    id: uid("log"),
    habitId: index % 2 === 0 ? "read" : "squat",
    date: `2026-05-${String(day).padStart(2, "0")}`,
    status: "completed",
    source: index % 2 === 0 ? "timer_1m" : "action",
    durationSeconds: index % 2 === 0 ? 60 : 0,
    focusRounds: 0,
    createdAt: now,
    updatedAt: now
  }));

  saveHabits(habits);
  saveLogs(logs);
  saveAchievements([]);
}

function activeHabits() {
  return getHabits().filter((habit) => habit.status === "active");
}

function findHabit(habitId) {
  return getHabits().find((habit) => habit.id === habitId);
}

function createHabit(input) {
  const activeCount = activeHabits().length;
  if (activeCount >= 3) {
    throw new Error("最多同时保持 3 个活跃微习惯");
  }

  const now = new Date().toISOString();
  const habit = {
    id: uid("habit"),
    title: input.title.trim(),
    trigger: input.trigger.trim(),
    startMode: input.startMode,
    minimumTarget: input.minimumTarget.trim(),
    extensionTarget: input.extensionTarget.trim(),
    frequency: "daily",
    status: "active",
    createdAt: now,
    updatedAt: now
  };

  saveHabits([habit, ...getHabits()]);
  return habit;
}

function archiveHabit(habitId) {
  const now = new Date().toISOString();
  const habits = getHabits().map((habit) => {
    if (habit.id !== habitId) return habit;
    return {
      ...habit,
      status: "archived",
      updatedAt: now
    };
  });
  saveHabits(habits);
}

function upsertLog(habitId, source, durationSeconds = 0, focusRounds = 0) {
  const today = todayString();
  const now = new Date().toISOString();
  const logs = getLogs();
  const index = logs.findIndex((log) => log.habitId === habitId && log.date === today);
  const existing = index >= 0 ? logs[index] : null;
  const next = {
    id: existing ? existing.id : uid("log"),
    habitId,
    date: today,
    status: "completed",
    source,
    durationSeconds: (existing ? existing.durationSeconds : 0) + durationSeconds,
    focusRounds: (existing ? existing.focusRounds : 0) + focusRounds,
    createdAt: existing ? existing.createdAt : now,
    updatedAt: now
  };

  if (index >= 0) {
    logs[index] = next;
  } else {
    logs.unshift(next);
  }

  saveLogs(logs);
  updateAchievements();
  return next;
}

function isHabitDoneToday(habitId) {
  const today = todayString();
  return getLogs().some((log) => (
    log.habitId === habitId &&
    log.date === today &&
    log.status === "completed"
  ));
}

function totalCompleted(habitId) {
  return getLogs().filter((log) => (
    log.habitId === habitId &&
    log.status === "completed"
  )).length;
}

function weeklyCompleted(habitId) {
  return getLogs().filter((log) => (
    log.habitId === habitId &&
    log.status === "completed" &&
    isThisWeek(log.date)
  )).length;
}

function getRecordOverview() {
  const habits = activeHabits();
  const logs = getLogs();
  const today = todayString();
  const todayCompleted = new Set(
    logs
      .filter((log) => log.date === today && log.status === "completed")
      .map((log) => log.habitId)
  ).size;
  const weeklyStarts = logs.filter((log) => log.status === "completed" && isThisWeek(log.date)).length;

  return {
    todayCompleted,
    todayTotal: habits.length,
    weeklyStarts,
    habits: habits.map((habit) => {
      const total = totalCompleted(habit.id);
      const weekly = weeklyCompleted(habit.id);
      return {
        ...habit,
        totalCompleted: total,
        weeklyCompleted: weekly,
        progress: Math.min(100, weekly * 14)
      };
    })
  };
}

function getCalendarDays(habitId) {
  const logs = getLogs().filter((log) => log.habitId === habitId);
  const map = {};
  logs.forEach((log) => {
    const day = Number(log.date.slice(-2));
    map[day] = log.status === "completed" ? "done" : "pause";
  });

  return Array.from({ length: 28 }, (_, index) => {
    const day = index + 1;
    return {
      day,
      status: map[day] || "empty"
    };
  });
}

function recoverySpeedText(habitId) {
  const days = getCalendarDays(habitId);
  const lastPause = [...days].reverse().find((day) => day.status === "pause" || day.status === "empty");
  if (!lastPause) return "连续中";
  const nextDone = days.find((day) => day.day > lastPause.day && day.status === "done");
  if (!nextDone) return "待恢复";
  const diff = nextDone.day - lastPause.day;
  return diff <= 0 ? "当天" : `${diff} 天`;
}

function getHabitDetail(habitId) {
  const habit = findHabit(habitId) || activeHabits()[0];
  if (!habit) return null;

  return {
    habit,
    totalCompleted: totalCompleted(habit.id),
    weeklyCompleted: weeklyCompleted(habit.id),
    recoverySpeedText: recoverySpeedText(habit.id),
    calendarDays: getCalendarDays(habit.id)
  };
}

function updateAchievements() {
  const logs = getLogs().filter((log) => log.status === "completed");
  const total = logs.length;
  const current = getAchievements();
  const codes = new Set(current.map((item) => item.code));
  const now = new Date().toISOString();
  const rules = [
    { code: "complete_3", title: "三天启动", description: "累计完成 3 次小动作", count: 3 },
    { code: "complete_7", title: "一周连续", description: "累计完成 7 次启动", count: 7 },
    { code: "complete_25", title: "小动作 25 次", description: "累计完成 25 次", count: 25 }
  ];

  rules.forEach((rule) => {
    if (total >= rule.count && !codes.has(rule.code)) {
      current.push({
        id: uid("achievement"),
        code: rule.code,
        title: rule.title,
        description: rule.description,
        unlockedAt: now
      });
    }
  });

  saveAchievements(current);
}

module.exports = {
  ensureSeedData,
  getHabits,
  activeHabits,
  createHabit,
  archiveHabit,
  findHabit,
  upsertLog,
  isHabitDoneToday,
  getRecordOverview,
  getHabitDetail,
  getAchievements,
  totalCompleted
};
