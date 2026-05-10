const store = require("../../utils/store");
const { todayString } = require("../../utils/date");

Page({
  data: {
    todayText: "",
    streak: 7,
    recommendedHabit: null,
    habits: [],
    pausedHabits: []
  },

  onShow() {
    this.load();
  },

  load() {
    const habits = store.activeHabits().map((habit) => ({
      ...habit,
      doneToday: store.isHabitDoneToday(habit.id)
    }));
    const recommendedHabit = habits.find((habit) => !habit.doneToday) || habits[0] || null;
    this.setData({
      todayText: todayString().slice(5).replace("-", " 月 ") + " 日",
      recommendedHabit,
      habits,
      pausedHabits: store.pausedHabits()
    });
  },

  goCreate() {
    wx.switchTab({ url: "/pages/create/create" });
  },

  startHabit(event) {
    const { id, mode } = event.currentTarget.dataset;
    if (mode === "timer") {
      wx.navigateTo({ url: `/pages/timer/timer?habitId=${id}` });
      return;
    }

    store.upsertLog(id, "action", 0, 0);
    wx.showToast({ title: "动作已完成", icon: "success" });
    wx.navigateTo({ url: `/pages/detail/detail?habitId=${id}` });
  },

  restoreHabit(event) {
    try {
      store.restoreHabit(event.currentTarget.dataset.id);
      wx.showToast({ title: "已接上", icon: "success" });
      this.load();
    } catch (error) {
      wx.showToast({ title: error.message, icon: "none" });
    }
  }
});
