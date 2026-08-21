/* ============================================================
   TalentOS 视图渲染 —— M0 为五视图外壳（身份色块 hero + 占位），
   M1+ 逐视图填充真实内容
   ============================================================ */
(function () {
  const D = window.TOS_DATA;
  const R = window.TOSRouter;

  const STEPS = [
    { hash: "pretest", label: "前测", identity: "--c-block-mint" },
    { hash: "learn", label: "学习", identity: "--c-block-lime" },
    { hash: "tutor", label: "AI 导师", identity: "--c-block-lilac" },
    { hash: "sandbox", label: "沙盘演练", identity: "navy" },
    { hash: "report", label: "成长报告", identity: "--c-block-mint" },
  ];

  function identityColor(identity) {
    return identity === "navy" ? "var(--c-block-navy)" : `var(${identity})`;
  }

  function renderSidebar(active) {
    return STEPS.map((s, i) => `
      <a class="sidebar-item ${s.hash === active ? "active" : ""}" href="#/${s.hash}">
        <span class="dot" style="background:${identityColor(s.identity)}"></span>
        ${s.label}
        <span class="step-no">0${i + 1}</span>
      </a>`).join("");
  }

  function hero(route) {
    const isNavy = route.identity === "navy";
    const bg = isNavy ? "var(--c-block-navy)" : `var(${route.identity})`;
    const color = isNavy ? "var(--c-inverse-ink)" : "var(--c-ink)";
    return `
      <div class="view-hero" style="background:${bg};color:${color}">
        <div class="eyebrow">${isNavy ? "SCENARIO LAB" : "TALENT OS"}</div>
        <h1>${route.title}</h1>
        <p>这里将呈现：${route.desc || "本模块内容（下一迭代填充）"}</p>
      </div>`;
  }

  /* —— 五个视图（M0 占位版）—— */
  const views = {
    viewPretest() {
      const p = D.studentProfile;
      return `
        <div class="grid grid-3">
          <div class="card"><div class="card-title">能力雷达基线</div><p class="placeholder-note">M1：ECharts 雷达图（五域基线 vs 岗位标准）</p></div>
          <div class="card"><div class="card-title">岗位差距分析</div><p class="body-sm">${p.gapSummary}</p><p class="placeholder-note">M1：差距排序与定向建议</p></div>
          <div class="card"><div class="card-title">画像标签</div><p>${p.tags.join(" · ")}</p><p class="placeholder-note">M1：四画像定位说明</p></div>
        </div>`;
    },
    viewLearn() {
      const pk = D.trainingPackages;
      return `
        <div class="section-title">必修（${D.meta.teacher.name} 老师配置）</div>
        <div class="grid grid-2">
          ${pk.required.map(r => `
            <div class="card"><div class="card-title">${r.title}</div>
              <p class="body-sm">配置人：${r.assignedBy} · ${r.lessons} 讲 · 关联能力域：${r.linkedDomains.join("/")}</p></div>`).join("")}
        </div>
        <div class="section-title" style="margin-top:var(--sp-xl)">选修（自主探索）</div>
        <div class="grid grid-3">
          ${pk.elective.map(e => `
            <div class="card-soft"><div class="card-title">${e.title}</div>
              <p class="body-sm">关联：${e.linkedDomains.join("/")}</p></div>`).join("")}
        </div>`;
    },
    viewTutor() {
      return `
        <div class="chat-wrap">
          <div class="chat-bubble user">导师你好，我现在学到评测集设计，不太明白为什么要先写"坏例子"。</div>
          <div class="chat-bubble agent">
            <span class="agent-chip" style="background:var(--c-block-lilac)">AI 导师</span><br>
            先不急着定义——如果让你判断一个客服机器人"答得好不好"，你会先准备什么材料？
          </div>
          <p class="placeholder-note">M2：苏格拉底式分支对话脚本（含打字机效果与追问链）</p>
        </div>`;
    },
    viewSandbox() {
      const s = D.trainingPackages.sandbox;
      return `
        <div style="background:var(--c-block-navy);color:var(--c-inverse-ink);border-radius:var(--r-xl);padding:var(--sp-xl)">
          <div class="agent-chip" style="background:var(--c-block-coral)">CEO</div>
          <div class="chat-bubble dark">张同学，智能客服升级这个事，董事会只给三个月，你要先告诉我：第一期到底解决什么、不解决什么。</div>
          <p class="placeholder-note" style="color:rgba(255,255,255,.5)">M3：多 Agent 剧本（${s.roles.join("/")}）+ 客户 Agent 真 AI 实时回话（magenta 标识）</p>
        </div>`;
    },
    viewReport() {
      const g = D.growthReport;
      return `
        <div class="grid grid-2">
          <div class="card"><div class="card-title">前后测对比雷达</div>
            <p class="mono">前测 ${Object.values(D.studentProfile.baseline).join(" / ")}</p>
            <p class="mono">后测 ${Object.values(g.post).join(" / ")}</p>
            <p class="placeholder-note">M4：ECharts 对比雷达 + 成长曲线 + 证据链点开</p></div>
          <div class="card"><div class="card-title">证据链</div>
            <p class="placeholder-note">M4：每项得分可点开看出处（演练产出/对话片段）</p></div>
        </div>`;
    },
  };

  /* 路由描述补充 */
  Object.assign(R.routes.pretest, { desc: "能力基线测评：五域能力雷达 + 对标岗位标准的差距分析，生成你的定制化培训包" });
  Object.assign(R.routes.learn,   { desc: "李老师配置的必修课 + 按兴趣探索的选修课 + 今日任务卡" });
  Object.assign(R.routes.tutor,   { desc: "AI 导师 7×24 实时答疑：不直接给答案，用追问引导你找到答案" });
  Object.assign(R.routes.sandbox, { desc: "虚拟项目组：CEO/客户/算法/法务由 AI 扮演，" + D.meta.caseSource });
  Object.assign(R.routes.report,  { desc: "后测成长报告：前后对比 + 成长曲线 + 每一分都可点开证据" });

  function render() {
    const active = R.current();
    const route = R.routes[active];
    document.getElementById("sidebar").innerHTML = renderSidebar(active);
    document.getElementById("view").innerHTML = hero(route) + (views[route.view] ? views[route.view]() : "");
    document.querySelectorAll(".sidebar-item").forEach(el =>
      el.classList.toggle("active", el.getAttribute("href") === "#/" + active));
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("student-chip").textContent =
      `${D.meta.student.name} · ${D.meta.student.grade}${D.meta.student.major.replace("信息管理与信息系统", "信管")}`;
    R.onRouteChange(render);
    render();
  });
})();
