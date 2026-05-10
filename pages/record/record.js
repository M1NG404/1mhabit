const store = require("../../utils/store");

Page({
  data: {
    overview: {
      todayCompleted: 0,
      todayTotal: 0,
      weeklyStarts: 0,
      habits: []
    }
  },

  onShow() {
    this.setData({
      overview: store.getRecordOverview()
    });
  },

  goDetail(event) {
    const habitId = event.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/detail/detail?habitId=${habitId}` });
  }
});
