const store = require("../../utils/store");

Page({
  data: {
    detail: null,
    hintTitle: "",
    hintCopy: ""
  },

  onLoad(options) {
    this.habitId = options.habitId;
  },

  onShow() {
    const detail = store.getHabitDetail(this.habitId);
    if (!detail) return;

    const isAction = detail.habit.startMode === "action";
    this.setData({
      detail,
      hintTitle: isAction ? "一个小动作已经完成启动" : "今天只开始 1 分钟也算接上",
      hintCopy: isAction
        ? "动作型习惯记录的是当前动作本身，不会混入其他习惯的数据。"
        : "系统记录你重新开始的速度，而不是惩罚断开。"
    });
  },

  deleteHabit() {
    wx.showModal({
      title: "归档并隐藏",
      content: "归档后今日页不再显示该习惯，历史记录会保留在本地。",
      confirmText: "归档",
      confirmColor: "#ff3b30",
      success: (res) => {
        if (!res.confirm) return;
        store.archiveHabit(this.habitId);
        wx.showToast({ title: "已归档", icon: "success" });
        wx.switchTab({ url: "/pages/today/today" });
      }
    });
  },

  pauseHabit() {
    wx.showModal({
      title: "暂停习惯",
      content: "暂停后今日页会放到“可以接上的习惯”，你随时可以恢复。",
      confirmText: "暂停",
      confirmColor: "#007aff",
      success: (res) => {
        if (!res.confirm) return;
        store.pauseHabit(this.habitId);
        wx.showToast({ title: "已暂停", icon: "success" });
        wx.switchTab({ url: "/pages/today/today" });
      }
    });
  }
});
