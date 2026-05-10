const store = require("../../utils/store");

Page({
  data: {
    habit: {}
  },

  onLoad(options) {
    this.habitId = options.habitId;
    this.setData({
      habit: store.findHabit(this.habitId) || {}
    });
  },

  backToday() {
    wx.switchTab({ url: "/pages/today/today" });
  },

  goFocus() {
    wx.redirectTo({ url: `/pages/focus/focus?habitId=${this.habitId}` });
  },

  goDetail() {
    wx.redirectTo({ url: `/pages/detail/detail?habitId=${this.habitId}` });
  }
});
