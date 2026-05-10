const store = require("../../utils/store");

function format(seconds) {
  const m = String(Math.floor(seconds / 60)).padStart(2, "0");
  const s = String(seconds % 60).padStart(2, "0");
  return `${m}:${s}`;
}

Page({
  data: {
    habit: {},
    remaining: 60,
    timeText: "01:00",
    running: true
  },

  onLoad(options) {
    this.habitId = options.habitId;
    this.setData({
      habit: store.findHabit(this.habitId) || {}
    });
  },

  onShow() {
    this.start();
  },

  onHide() {
    this.stop();
  },

  onUnload() {
    this.stop();
  },

  start() {
    this.stop();
    this.setData({ running: true });
    this.timer = setInterval(() => {
      if (!this.data.running) return;
      const next = Math.max(0, this.data.remaining - 1);
      this.setData({
        remaining: next,
        timeText: format(next)
      });
      if (next === 0) {
        this.stop();
        store.upsertLog(this.habitId, "timer_1m", 60, 0);
        wx.redirectTo({ url: `/pages/complete/complete?habitId=${this.habitId}` });
      }
    }, 1000);
  },

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  },

  togglePause() {
    this.setData({ running: !this.data.running });
  },

  complete() {
    const duration = 60 - this.data.remaining;
    store.upsertLog(this.habitId, "timer_1m", Math.max(duration, 10), 0);
    wx.redirectTo({ url: `/pages/complete/complete?habitId=${this.habitId}` });
  },

  goFocus() {
    const duration = 60 - this.data.remaining;
    store.upsertLog(this.habitId, "timer_1m", Math.max(duration, 10), 0);
    wx.redirectTo({ url: `/pages/focus/focus?habitId=${this.habitId}` });
  },

  cancel() {
    wx.navigateBack();
  }
});
