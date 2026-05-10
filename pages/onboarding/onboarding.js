const store = require("../../utils/store");

Page({
  onLoad() {
    if (store.hasSeenOnboarding()) {
      wx.switchTab({ url: "/pages/today/today" });
    }
  },

  start() {
    store.markOnboardingSeen();
    wx.switchTab({ url: "/pages/today/today" });
  }
});
