/* hash 路由：#/pretest /#/learn /#/tutor /#/sandbox /#/report */
window.TOSRouter = {
  routes: {
    "pretest": { title: "前测 · 能力基线", identity: "--c-block-mint", view: "viewPretest" },
    "learn":   { title: "学习首页 · 培训包", identity: "--c-block-lime", view: "viewLearn" },
    "tutor":   { title: "AI 导师 · 实时答疑", identity: "--c-block-lilac", view: "viewTutor" },
    "sandbox": { title: "沙盘演练 · 虚拟项目组", identity: "navy", view: "viewSandbox" },
    "report":  { title: "成长报告 · 后测", identity: "--c-block-mint", view: "viewReport" },
  },

  current() {
    const h = (location.hash || "#/pretest").replace("#/", "");
    return this.routes[h] ? h : "pretest";
  },

  navigate(hash) { location.hash = "#/" + hash; },

  onRouteChange(callback) {
    window.addEventListener("hashchange", () => callback(this.current()));
  },
};
