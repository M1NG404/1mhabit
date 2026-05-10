const store = require("../../utils/store");

const templates = [
  {
    id: "read",
    symbol: "读",
    color: "#007aff",
    title: "读 1 页书",
    trigger: "午饭后，收拾餐具之后",
    startMode: "timer",
    minimumTarget: "1 分钟启动",
    extensionTarget: "5 分钟沉浸，可重复延长"
  },
  {
    id: "squat",
    symbol: "动",
    color: "#34c759",
    title: "做 1 个深蹲",
    trigger: "早上刷牙之后",
    startMode: "action",
    minimumTarget: "做完 1 个深蹲",
    extensionTarget: "可以再做 5 个"
  },
  {
    id: "write",
    symbol: "写",
    color: "#af52de",
    title: "写 1 句话",
    trigger: "睡前手机充电之后",
    startMode: "timer",
    minimumTarget: "1 分钟启动",
    extensionTarget: "继续写 5 分钟"
  }
];

Page({
  data: {
    templates,
    startMode: "timer",
    titleValue: "读 1 页书",
    triggerValue: "午饭后，收拾餐具之后",
    minimumValue: "1 分钟启动",
    extensionValue: "5 分钟沉浸，可重复延长"
  },

  switchMode(event) {
    const startMode = event.currentTarget.dataset.mode;
    this.setData({
      startMode,
      minimumValue: startMode === "timer" ? "1 分钟启动" : "做完一个小动作"
    });
  },

  selectTemplate(event) {
    const template = templates.find((item) => item.id === event.currentTarget.dataset.id);
    if (!template) return;
    this.setData({
      startMode: template.startMode,
      titleValue: template.title,
      triggerValue: template.trigger,
      minimumValue: template.minimumTarget,
      extensionValue: template.extensionTarget
    });
  },

  onInput(event) {
    this.setData({
      [event.currentTarget.dataset.field]: event.detail.value
    });
  },

  saveHabit() {
    const { titleValue, triggerValue, minimumValue, extensionValue, startMode } = this.data;
    if (!titleValue.trim() || !triggerValue.trim()) {
      wx.showToast({ title: "请补全微动作和触发场景", icon: "none" });
      return;
    }

    try {
      store.createHabit({
        title: titleValue,
        trigger: triggerValue,
        minimumTarget: minimumValue,
        extensionTarget: extensionValue,
        startMode
      });
      wx.showToast({ title: "已创建", icon: "success" });
      wx.switchTab({ url: "/pages/today/today" });
    } catch (error) {
      wx.showToast({ title: error.message, icon: "none" });
    }
  }
});
