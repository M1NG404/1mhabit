const store = require("../../utils/store");

const templates = [
  {
    id: "read",
    symbol: "读",
    name: "读书",
    color: "#007aff",
    title: "读 1 页书",
    trigger: "午饭后",
    startMode: "timer",
    minimumTarget: "1 分钟启动",
    extensionTarget: "5 分钟沉浸"
  },
  {
    id: "write",
    symbol: "写",
    name: "写作",
    color: "#af52de",
    title: "写 1 句话",
    trigger: "睡前",
    startMode: "timer",
    minimumTarget: "1 分钟启动",
    extensionTarget: "继续写 5 分钟"
  },
  {
    id: "study",
    symbol: "学",
    name: "学习",
    color: "#5856d6",
    title: "学 1 个知识点",
    trigger: "打开电脑后",
    startMode: "timer",
    minimumTarget: "1 分钟启动",
    extensionTarget: "继续学习 5 分钟"
  },
  {
    id: "sport",
    symbol: "动",
    name: "运动",
    color: "#34c759",
    title: "做 1 个深蹲",
    trigger: "刷牙后",
    startMode: "action",
    minimumTarget: "做完 1 个深蹲",
    extensionTarget: "可以再做 5 个"
  },
  {
    id: "water",
    symbol: "水",
    name: "喝水",
    color: "#32ade6",
    title: "喝一杯水",
    trigger: "起床后",
    startMode: "action",
    minimumTarget: "喝完一杯水",
    extensionTarget: ""
  },
  {
    id: "tidy",
    symbol: "理",
    name: "整理",
    color: "#ff9f0a",
    title: "整理桌面 1 件物品",
    trigger: "下班到家后",
    startMode: "action",
    minimumTarget: "整理 1 件物品",
    extensionTarget: "继续整理 5 分钟"
  },
  {
    id: "meditate",
    symbol: "静",
    name: "冥想",
    color: "#5e5ce6",
    title: "闭眼呼吸 1 分钟",
    trigger: "睡前",
    startMode: "timer",
    minimumTarget: "1 分钟启动",
    extensionTarget: "继续冥想 5 分钟"
  },
  {
    id: "sleep",
    symbol: "眠",
    name: "睡眠",
    color: "#1c1c1e",
    title: "手机充电后放下手机",
    trigger: "手机充电后",
    startMode: "action",
    minimumTarget: "放下手机 1 分钟",
    extensionTarget: ""
  }
];

const triggerOptions = [
  "起床后",
  "刷牙后",
  "早餐后",
  "午饭后",
  "打开电脑后",
  "下班到家后",
  "睡前",
  "手机充电后"
];

function applyTemplate(template) {
  return {
    selectedTemplateId: template.id,
    startMode: template.startMode,
    titleValue: template.title,
    triggerValue: template.trigger,
    minimumValue: template.minimumTarget,
    extensionValue: template.extensionTarget
  };
}

Page({
  data: {
    templates,
    triggerOptions,
    selectedTemplateId: "read",
    showAdvanced: false,
    startMode: "timer",
    titleValue: "读 1 页书",
    triggerValue: "午饭后",
    minimumValue: "1 分钟启动",
    extensionValue: "5 分钟沉浸"
  },

  selectTemplate(event) {
    const template = templates.find((item) => item.id === event.currentTarget.dataset.id);
    if (!template) return;
    this.setData(applyTemplate(template));
  },

  selectTrigger(event) {
    this.setData({
      triggerValue: event.currentTarget.dataset.value
    });
  },

  toggleAdvanced() {
    this.setData({
      showAdvanced: !this.data.showAdvanced
    });
  },

  switchMode(event) {
    const startMode = event.currentTarget.dataset.mode;
    this.setData({
      startMode,
      minimumValue: startMode === "timer" ? "1 分钟启动" : "做完一个小动作",
      extensionValue: startMode === "timer" ? "5 分钟沉浸" : this.data.extensionValue
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
      wx.showToast({ title: "请补全微动作和开始时机", icon: "none" });
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
