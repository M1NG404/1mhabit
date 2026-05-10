const store = require("../../utils/store");

Page({
  data: {
    overview: {
      todayCompleted: 0,
      todayTotal: 0,
      weeklyStarts: 0,
      habits: []
    },
    suggestion: null
  },

  onShow() {
    const overview = store.getRecordOverview();
    const paused = store.pausedHabits();
    this.setData({
      overview,
      suggestion: paused[0] || overview.habits.find((habit) => habit.weeklyCompleted === 0) || overview.habits[0] || null
    });
  },

  goDetail(event) {
    const habitId = event.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/detail/detail?habitId=${habitId}` });
  },

  handleSuggestion() {
    if (!this.data.suggestion) return;
    if (this.data.suggestion.status === "paused") {
      try {
        store.restoreHabit(this.data.suggestion.id);
        wx.showToast({ title: "已接上", icon: "success" });
        this.onShow();
      } catch (error) {
        wx.showToast({ title: error.message, icon: "none" });
      }
      return;
    }
    wx.navigateTo({ url: `/pages/detail/detail?habitId=${this.data.suggestion.id}` });
  }
});
