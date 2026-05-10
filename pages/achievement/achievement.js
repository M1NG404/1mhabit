const store = require("../../utils/store");

Page({
  data: {
    total: 0,
    achievements: []
  },

  onShow() {
    const overview = store.getRecordOverview();
    const total = overview.habits.reduce((sum, habit) => sum + habit.totalCompleted, 0);
    this.setData({
      total,
      achievements: store.getAchievements()
    });
  }
});
