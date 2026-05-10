const store = require("../../utils/store");

function format(seconds) {
  const m = String(Math.floor(seconds / 60)).padStart(2, "0");
  const s = String(seconds % 60).padStart(2, "0");
  return `${m}:${s}`;
}

Page({
  data: {
    habit: {},
    remaining: 300,
    rounds: 0,
    timeText: "05:00"
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
    this.timer = setInterval(() => {
      const next = Math.max(0, this.data.remaining - 1);
      this.setData({
        remaining: next,
        timeText: format(next)
      });
      if (next === 0) {
        this.stop();
        this.setData({ rounds: this.data.rounds + 1 });
        wx.showToast({ title: "5 分钟完成", icon: "success" });
      }
    }, 1000);
  },

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  },

  moreFive() {
    this.setData({
      remaining: 300,
      rounds: this.data.rounds + 1,
      timeText: "05:00"
    });
    this.start();
  },

  complete() {
    const spent = 300 - this.data.remaining;
    const rounds = this.data.rounds + (spent > 0 ? 1 : 0);
    store.upsertLog(this.habitId, "focus_5m", spent, rounds);
    wx.redirectTo({ url: `/pages/detail/detail?habitId=${this.habitId}` });
  },

  backTimer() {
    wx.redirectTo({ url: `/pages/timer/timer?habitId=${this.habitId}` });
  }
});
