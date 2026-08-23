/* ============================================================
   TalentOS M4 v3 · 培训包与课程学习（虚拟入职 · 测学练考）
   - 课程详情：介绍→微课列表(顺序解锁)→情境演练→再评
   - 课程列表：分软技能/硬技能 + 基于初聊报告标"重点学习"
   - 状态按手机号分仓；规则组装纯工程
   ============================================================ */
window.TOS_M4 = (function () {
  const phoneKey = () => localStorage.getItem("tos_demo_last_phone") || "anon";
  const PKG_KEY = () => "tos_pkg_" + phoneKey();

  const COURSE_LIB = [
    { id: "C1", name: "AI 产品经理入职第一课", goal: "建立对 AI 产品岗位的整体认知", cap: "岗位认知", type: "soft", weight: 5, required: true, by: "李雯 老师", chapters: ["岗位地图：AI 产品经理的一天", "AI 产品与传统产品的三个不同", "你的 90 天成长路径"] },
    { id: "C2", name: "企业协作与汇报规范", goal: "实现跨团队沟通的准确与高效", cap: "沟通表达", type: "soft", weight: 4, required: true, by: "李雯 老师", chapters: ["企业沟通链路与例会文化", "结构化汇报：结论-依据-建议", "书面沟通规范"] },
    { id: "C3", name: "大模型基础与边界", goal: "准确判断 AI 能做什么、不能做什么", cap: "AI 技术知识", type: "hard", weight: 5, required: false, by: null, chapters: ["生成机制与幻觉成因", "能力边界判断方法", "成本与安全常识"], drill: "AI 工作场景演练：判断哪些任务适合交给模型" },
    { id: "C4", name: "评测集设计入门", goal: "掌握 AI 功能的基础验收方法", cap: "评测集设计", type: "hard", weight: 4, required: false, by: null, chapters: ["什么是评测集", "覆盖逻辑设计", "Badcase 归因入门"] },
    { id: "C5", name: "需求分析与优先级", goal: "实现需求判断的快与准", cap: "产品方法", type: "hard", weight: 3, required: false, by: null, chapters: ["需求真伪判断", "优先级排序方法"] },
    { id: "C6", name: "结构化表达", goal: "实现复杂问题的清晰表达", cap: "沟通表达", type: "soft", weight: 3, required: false, by: null, chapters: ["先结论后细节", "三段式表达法"] },
  ];

  const QUIZ_BANK = {
    C1: [
      { q: "AI 产品经理和传统产品经理最核心的差异是？", opts: ["会用 AI 工具", "为'概率性输出'设计产品体验与兜底", "写代码更多"], a: 1, why: "AI 产品面对的是不确定输出，人机分工、置信度呈现与兜底设计成为核心功课。" },
      { q: "AI 产品经理的一天里，占比最大的工作通常是？", opts: ["训练模型", "定义问题、对齐预期、验收效果", "做 UI 设计"], a: 1, why: "定义清楚'AI 解决什么、不解决什么'，并对齐各方预期，是岗位最大的价值所在。" },
      { q: "新人前 90 天最应该优先建立的是？", opts: ["人脉", "对岗位能力模型的认知与学习路径", "职级"], a: 1, why: "先看清能力地图，学习投入才有方向——这正是你的入职培训包要做的事。" },
    ],
    C2: [
      { q: "结构化汇报的经典顺序是？", opts: ["细节-过程-结论", "结论-依据-建议", "背景-吐槽-请求"], a: 1, why: "先给结论方便决策，再给依据建立信任，最后给建议推进行动。" },
      { q: "跨团队沟通中信息不同步，最有效的做法是？", opts: ["等对方来问", "约定同步机制并主动公示进展", "上报老板"], a: 1, why: "主动建立同步节奏（例会/文档）比被动等待成本低得多。" },
      { q: "书面沟通的首要规范是？", opts: ["词藻华丽", "结论前置、信息可检索、责任到人", "越长越专业"], a: 1, why: "企业书面沟通的目的是降低协作成本，不是展示文采。" },
    ],
    C3: [
      { q: "大模型「幻觉」指的是什么？", opts: ["模型运行速度慢", "生成看似合理但实际错误的内容", "模型拒绝回答问题"], a: 1, why: "幻觉 = 生成机制导致的『一本正经胡说八道』，必须向业务方讲清的第一件事。" },
      { q: "判断「该任务该不该交给 AI」，最先看什么？", opts: ["任务负责人是谁", "任务是否有明确输入输出与容错空间", "任务预算多少"], a: 1, why: "边界判断三要素：输入输出可描述、结果可验证、错误可容忍。" },
      { q: "以下哪种做法能最直接降低幻觉影响？", opts: ["换更大的模型", "接入真实资料检索并标注来源", "多生成几遍取最长的"], a: 1, why: "检索增强（RAG）让模型基于给定资料回答并引用来源，最工程化的缓解手段。" },
    ],
  };

  const MISSIONS = [
    { id: "M1", name: "智能客服升级项目", from: "改编自某连锁零售集团真实项目（已脱敏）", desc: "作为产品负责人，面对客户投诉率上升，你需要与算法、业务方协作，给出第一期升级方案。" },
    { id: "M2", name: "跨部门协作演练", from: "专家制作 · 通用场景", desc: "你的方案被工程团队质疑不可实现，如何在三天内推动各方达成一致？" },
    { id: "M3", name: "转正述职演练", from: "专家制作 · 结业评估", desc: "用'结论-依据-建议'结构，向评审组汇报你入职期的成长与产出。" },
  ];

  const MENTORS = [
    { id: "T1", role: "课程导师", name: "李雯", tag: "我要学 · 必修课", go: "#/list/required", zone: { x: 2, y: 8, w: 32, h: 26 }, head: { x: 15, y: 18 }, px: 15, py: 18, sayDir: "right", say: ["今天的入职微课安排好了，别忘了课后练习～", "学完一节就做个小练习，记得找我打卡", "课程学完我这边就给你销项啦"] },
    { id: "T2", role: "工作导师", name: "老周", tag: "岗位任务 · 情景演练", go: "#/mission", zone: { x: 65, y: 6, w: 32, h: 30 }, head: { x: 78, y: 18 }, px: 78, py: 18, sayDir: "left", say: ["课修得差不多了就来找我领任务", "客服升级那道题是真实项目改的，够你喝一壶", "演练别慌，我全程带着你"] },
    { id: "T3", role: "选修导师", name: "小雅", tag: "我想学 · 选修课", go: "#/list/elective", zone: { x: 14, y: 62, w: 36, h: 32 }, head: { x: 28, y: 78 }, px: 28, py: 78, sayDir: "right", say: ["根据你的画像挑了几门选修，看看合不合口味", "选修不计考核，感兴趣最重要", "想换课随时来找我聊聊"] },
  ];

  // 正态 CDF（用于欠佳判定，与报告页保持一致）
  function normCdf(z, mu, sd) {
    const zz = (z - mu) / sd;
    const t = 1 / (1 + 0.2316419 * Math.abs(zz));
    const d = 0.3989423 * Math.exp(-zz * zz / 2);
    const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    return zz > 0 ? 1 - p : p;
  }

  const pkg = {
    data: null,
    load() { try { this.data = JSON.parse(localStorage.getItem(PKG_KEY()) || "null"); } catch (e) { this.data = null; } },
    save() { localStorage.setItem(PKG_KEY(), JSON.stringify(this.data)); },
    build(days) {
      days = days || 2;
      let rep = null;
      try {
        const chat = JSON.parse(localStorage.getItem("tos_assess_" + phoneKey()) || "{}");
        rep = JSON.parse(localStorage.getItem("tos_report_" + (chat.sessionId || "")) || "null");
      } catch (e) { rep = null; }
      // 欠佳判定
      const weakCaps = [];
      if (rep) {
        const all = [...(rep.soft || []), ...(rep.hard || [])];
        all.forEach(d => {
          const mid = (d.scoreRange[0] + d.scoreRange[1]) / 2;
          const pct = Math.round(normCdf((mid - 1) / 3, 0.40, 0.23) * 100);
          if (pct < 30 && d.name) weakCaps.push(d.name);
        });
      }
      // 必修池：导师要求（固定）+ 系统推荐（最多 1 门，从选修池选）
      const teacherReq = COURSE_LIB.filter(c => c.required);
      const matchWeak = (weak, course) => {
        const cText = course.cap + course.name + course.goal;
        if (cText.includes(weak) || weak.includes(course.cap)) return true;
        const weakWords = weak.match(/[\u4e00-\u9fff]{2,}|AI|[A-Za-z]{3,}/g) || [];
        return weakWords.some(w => cText.includes(w));
      };
      const sysMax = Math.max(0, 3 - teacherReq.length); // 导师2门→系统最多1门
      const sysRec = COURSE_LIB.filter(c => !c.required && weakCaps.some(w => matchWeak(w, c)))
        .sort((a, b) => b.weight - a.weight).slice(0, sysMax).map(c => c.id);
      // 每日计划课程 = 必修池全部
      const planCourses = [...teacherReq.map(c => c.id), ...sysRec];
      // 按天分配（软硬搭配：每天至少1软1硬，如果课程够的话）
      const softIds = planCourses.filter(id => COURSE_LIB.find(c => c.id === id).type === "soft");
      const hardIds = planCourses.filter(id => COURSE_LIB.find(c => c.id === id).type === "hard");
      const plan = [];
      for (let d = 0; d < days; d++) plan.push({ day: d + 1, courses: [] });
      // 交替分配软硬（轮转填入）
      let si = 0, hi = 0, di = 0;
      const total = softIds.length + hardIds.length;
      for (let k = 0; k < total; k++) {
        const isSoftTurn = (k % 2 === 0 && si < softIds.length) || hi >= hardIds.length;
        if (isSoftTurn && si < softIds.length) plan[di].courses.push(softIds[si++]);
        else if (hi < hardIds.length) plan[di].courses.push(hardIds[hi++]);
        di = (di + 1) % days;
      }
      // 过滤空天（选2天但只有3门课→2天各有课）
      const validPlan = plan.filter(pd => pd.courses.length > 0);
      validPlan.forEach((pd, i) => pd.day = i + 1);
      // 选修池（独立管理，不进必修）：排除已被系统推荐的
      const electivePool = COURSE_LIB.filter(c => !c.required && !sysRec.includes(c.id));
      const suggest = electivePool.sort((a, b) => b.weight - a.weight).slice(0, 2).map(c => c.id);
      const others = electivePool.filter(c => !suggest.includes(c.id)).map(c => c.id);

      this.data = {
        company: "启明科技", days, day: 1,
        plan: validPlan, sysRec, suggest, others,
        courses: Object.fromEntries(COURSE_LIB.map(c => [c.id, { lessons: c.chapters.map(() => ({ d: false, q: false })), drillDone: false, finished: false }])),
        missions: Object.fromEntries(MISSIONS.map(m => [m.id, false])),
        created: new Date().toLocaleDateString("zh-CN"),
      };
      this.save();
    },
    courseIds() { return COURSE_LIB.filter(c => c.required || (this.data.sysRec || []).includes(c.id) || (this.data.suggest || []).includes(c.id)).map(c => c.id); },
    progress() {
      if (!this.data) return 0;
      let done = 0, total = 0;
      this.courseIds().forEach(id => {
        const st = this.data.courses[id];
        st.lessons.forEach(l => { total += 2; done += (l.d ? 1 : 0) + (l.q ? 1 : 0); });
      });
      MISSIONS.forEach(m => { total += 2; done += this.data.missions[m.id] ? 2 : 0; });
      return total ? Math.round(done / total * 100) : 0;
    },
  };

  const state = { course: null, stage: "course", idx: 0, list: "required", missionOpen: null, bubbleTimers: [] };

  function stopBubbles() { state.bubbleTimers.forEach(t => clearInterval(t)); state.bubbleTimers = []; }
  function $app() { return document.getElementById("app"); }
  function toastEl(msg) { if (window.__tosToast) window.__tosToast(msg); }

  // ---------- 入职开场（含天数选择） ----------
  let selectedDays = 2, planOpen = false;
  function viewOnboard() {
    const dayBtns = [1, 2, 3].map(d =>
      `<button class="day-btn ${selectedDays === d ? "on" : ""}" data-action="pick-day" data-d="${d}">${d} 天</button>`
    ).join("");
    return `
      <div class="m-center" style="align-items:flex-start;text-align:left">
        <div class="mentor-badge mint">
          <svg viewBox="0 0 96 96" width="80" height="80" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
            <circle cx="48" cy="34" r="16"/>
            <path d="M22 78c4-16 14-24 26-24s22 8 26 24"/>
            <path d="M40 32h6M52 32h6"/><circle cx="43" cy="32" r="4.5"/><circle cx="55" cy="32" r="4.5"/><path d="M47.5 32h3"/>
            <path d="M44 44c2.5 2 5.5 2 8 0"/>
          </svg>
        </div>
        <div class="mono" style="font-size:var(--fs-caption);letter-spacing:.14em;opacity:.55;margin-top:6px">ONBOARDING</div>
        <h2 style="font-size:22px;font-weight:var(--fw-700);margin:6px 0 4px">欢迎加入 启明科技</h2>
        <p style="opacity:.7;font-size:var(--fs-body-sm);line-height:1.7">我是你的入职导师。为了让你顺利上手 AI 产品经理岗位，我为你准备了一份定制的学习计划。</p>
        <div class="m-block-banner cream" style="margin-top:var(--sp-lg);text-align:left">
          <h2>测 · 学 · 练 · 考</h2>
          <p>初聊画像已完成 ✓ → 微课学习+课后练习 → 情境演练 → 再评</p>
        </div>
        <div style="margin-top:var(--sp-lg)">
          <div style="font-size:14px;font-weight:var(--fw-700);margin-bottom:8px">选择学习计划天数</div>
          <div style="display:flex;gap:8px">${dayBtns}</div>
          <p class="mono" style="font-size:10px;opacity:.5;margin-top:6px">每天最多 3 门课（导师要求 + 系统推荐）</p>
        </div>
        <button data-action="claim-pkg" class="quiz-start" style="height:50px;font-size:17px;margin-top:var(--sp-lg)">领取我的入职培训包</button>
        <button class="m-btn-back" data-action="go-report2">回看我的画像</button>
      </div>`;
  }

// 个人中心独立视图 + 工位简化 + 沙盘按课程存储 + 修复硬技能演练
// 这个文件会被 python 脚本注入到 m4.js

  // ---------- 个人中心（独立路由） ----------
  let profileTab = "info";
  function viewProfile() {
    const p = pkg.data;
    if (!p) return viewOnboard();
    const ph = phoneKey();
    const phone = localStorage.getItem("tos_demo_last_phone") || "";
    const reqCourses = COURSE_LIB.filter(c => c.required || (p.sysRec || []).includes(c.id));
    const todos = reqCourses.filter(c => !p.courses[c.id]?.finished).map(c => {
      const st = p.courses[c.id];
      const lessonDone = st.lessons.filter(l => l.d && l.q).length;
      return `<div class="chapter-row" style="cursor:pointer" data-action="open-course" data-id="${c.id}">
        <span class="chapter-check">${lessonDone}/${c.chapters.length}</span>
        <span style="flex:1;font-size:13px">${c.name}</span>
        <span class="mono" style="font-size:10px;opacity:.4">去学习 →</span>
      </div>`;
    });
    const doneCount = pkg.courseIds().filter(id => p.courses[id]?.finished).length;
    const lessonsDone = pkg.courseIds().reduce((n, id) => n + (p.courses[id]?.lessons.filter(l=>l.d&&l.q).length || 0), 0);
    const missionsDone = MISSIONS.filter(m => p.missions[m.id]).length;
    const growthItems = [];
    try {
      const chat = JSON.parse(localStorage.getItem("tos_assess_" + ph) || "{}");
      if (chat.sessionId) growthItems.push({ type: "初聊画像", date: p.created, action: "go-report2" });
    } catch(e) {}
    pkg.courseIds().forEach(id => {
      if (p.courses[id]?.finished) {
        const c = COURSE_LIB.find(x=>x.id===id);
        growthItems.push({ type: c.name + " · 再评", date: "已完成", action: "open-course", id });
      }
    });
    const tabs = [
      { k: "info", l: "基本信息" }, { k: "todo", l: "今日待办" },
      { k: "achv", l: "我的成就" }, { k: "growth", l: "我的成长" },
    ];
    const tabHtml = tabs.map(t => `<button class="view-tab ${profileTab === t.k ? "selected" : ""}" data-action="pf-tab" data-tab="${t.k}">${t.l}</button>`).join("");
    let content = "";
    if (profileTab === "info") {
      content = `<div class="report-block">
        <div class="chapter-row"><span style="width:70px;font-size:13px;opacity:.6">姓名</span><span style="font-size:14px;font-weight:700">张明远</span></div>
        <div class="chapter-row"><span style="width:70px;font-size:13px;opacity:.6">手机号</span><span class="mono" style="font-size:13px">${phone.slice(0,3)}****${phone.slice(7)}</span></div>
        <div class="chapter-row"><span style="width:70px;font-size:13px;opacity:.6">公司</span><span style="font-size:13px">启明科技</span></div>
        <div class="chapter-row"><span style="width:70px;font-size:13px;opacity:.6">岗位</span><span style="font-size:13px">AI 产品经理（培养中）</span></div>
      </div>`;
    } else if (profileTab === "todo") {
      content = todos.length ? `<div class="report-block">${todos.join("")}</div>` : `<div class="quiz-done">今日必修课已全部完成</div>`;
    } else if (profileTab === "achv") {
      content = `<div class="report-block">
        <div style="display:flex;gap:12px;margin-bottom:12px">
          <div style="flex:1;text-align:center;background:var(--c-block-mint);border-radius:var(--r-lg);padding:12px">
            <div class="mono" style="font-size:24px;font-weight:700">${doneCount}</div>
            <div style="font-size:11px;opacity:.6">完成课程</div></div>
          <div style="flex:1;text-align:center;background:var(--c-block-cream);border-radius:var(--r-lg);padding:12px">
            <div class="mono" style="font-size:24px;font-weight:700">${lessonsDone}</div>
            <div style="font-size:11px;opacity:.6">完成微课</div></div>
          <div style="flex:1;text-align:center;background:var(--c-block-lilac);border-radius:var(--r-lg);padding:12px">
            <div class="mono" style="font-size:24px;font-weight:700">${missionsDone}</div>
            <div style="font-size:11px;opacity:.6">通过演练</div></div>
        </div>
        <div class="chapter-row"><span class="chapter-check" style="background:var(--c-block-mint);border:none">🏅</span><span style="font-size:13px">初来乍到——完成首次能力初聊</span></div>
        ${doneCount >= 1 ? '<div class="chapter-row"><span class="chapter-check" style="background:var(--c-block-mint);border:none">📖</span><span style="font-size:13px">学有所成——完成第一门课程</span></div>' : ""}
      </div>`;
    } else if (profileTab === "growth") {
      content = growthItems.length ? `<div class="report-block">${growthItems.map(g => `
        <div class="chapter-row" style="cursor:pointer" data-action="${g.action}" ${g.id ? `data-id="${g.id}"` : ""}>
          <span class="chapter-check">📊</span>
          <span style="flex:1;font-size:13px">${g.type}</span>
          <span class="mono" style="font-size:10px;opacity:.4">${g.date}</span>
        </div>`).join("")}</div>` : `<div class="report-block" style="text-align:center;padding:24px"><p style="font-size:13px;opacity:.5">暂无报告</p></div>`;
    }
    return `
      <div class="learn-page">
        <button class="m-btn-back" style="margin:0 0 var(--sp-md)" data-action="go" data-to="#/station">← 返回工位</button>
        <div class="sec-tag st-soft">个人中心</div>
        <div class="view-tabs">${tabHtml}</div>
        ${content}
        <button class="m-btn-back" style="width:100%;margin-top:16px;color:var(--c-error)" data-action="logout">退出登录</button>
      </div>`;
  }
  // ---------- 工位 ----------
  function viewStation() {
    const p = pkg.data;
    if (!p) return viewOnboard();
    const pct = pkg.progress();
    const zones = MENTORS.map(m => `
      <div class="scene-zone" style="left:${m.zone.x}%;top:${m.zone.y}%;width:${m.zone.w}%;height:${m.zone.h}%" data-action="go" data-to="${m.go}">
        <span class="pulse-dot" style="left:${((m.head.x - m.zone.x) / m.zone.w * 100).toFixed(1)}%;top:${((m.head.y - m.zone.y) / m.zone.h * 100).toFixed(1)}%"></span>
        <div class="scene-say" id="say-${m.id}" style="${m.sayDir === "left" ? "right" : "left"}:4%;top:${Math.max(m.py - 20, 0)}%">
          <b>${m.role} · ${m.name}</b><br>${m.say[0]}
        </div>
      </div>`).join("");
    return `
      <div class="learn-page">
        <div class="learn-head">
          <div>
            <div class="mono" style="font-size:var(--fs-caption);opacity:.5;letter-spacing:.12em">MY WORKSTATION</div>
            <h2 style="font-size:20px;font-weight:var(--fw-700)">我的工位</h2>
            <div class="page-sub">启明科技 · 入职第 ${p.day} 天</div>
          </div>
          <div class="progress-ring" style="--p:${pct}"><span>${pct}%</span></div>
        </div>
        <div class="office-scene">
          <img src="assets/img/station-bg.jpg" alt="我的工位">
          <div class="you-click" data-action="go" data-to="#/profile" style="position:absolute;left:76%;top:80%;transform:translate(-50%,-50%);width:44px;height:44px;border-radius:50%;background:var(--c-primary);color:#fff;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;cursor:pointer;z-index:5;box-shadow:0 0 0 3px rgba(255,255,255,.8);border:2px solid #fff">你</div>
          ${zones}
        </div>
        <p class="mono" style="text-align:center;font-size:10px;opacity:.4;margin-top:8px">点击导师或"你"互动</p>
      </div>`;
  }

  function startBubbles() {
    stopBubbles();
    MENTORS.forEach(m => {
      let i = 0;
      const t = setInterval(() => {
        const el = document.getElementById("say-" + m.id);
        if (!el) { clearInterval(t); return; }
        i = (i + 1) % m.say.length;
        el.innerHTML = `<b>${m.role} · ${m.name}</b><br>${m.say[i]}`;
        el.classList.remove("pop"); void el.offsetWidth; el.classList.add("pop");
      }, 4200 + Math.random() * 2000);
      state.bubbleTimers.push(t);
    });
  }

  // ---------- 课程列表（必修：导师+系统 / 选修：建议+其他） ----------
  function viewList() {
    const p = pkg.data;
    const isReq = state.list === "required";
    const mentor = isReq ? MENTORS[0] : MENTORS[1];
    const card = (c, opts) => {
      const st = p.courses[c.id];
      const pr = Math.round(st.lessons.filter(l => l.d && l.q).length / c.chapters.length * 100);
      const tags = [];
      if (opts && opts.isSys) tags.push('<span class="sys-tag">系统</span>');
      if (opts && opts.isFocus) tags.push('<span class="focus-tag">重点学习</span>');
      return `
        <div class="course-card" data-action="open-course" data-id="${c.id}">
          <div class="course-ic">${st.finished ? "✓" : ""}</div>
          <div class="course-mid">
            <div class="course-name">${c.name} ${tags.join(" ")}</div>
            <div class="course-goal">目标：${c.goal}</div>
            <div class="mono course-cap">${c.type === "soft" ? "软技能" : "硬技能"} · ${c.cap}${c.by && !opts?.isSys ? " · " + c.by + "指定" : ""}</div>
          </div>
          <div class="course-progress">
            <div class="mono">${pr}%</div>
            <div class="heat-track small" style="width:44px;height:5px"><div class="heat-fill" style="width:${pr}%;background:${c.type === "soft" ? "var(--c-chart-2)" : "#2e5fe8"}"></div></div>
          </div>
        </div>`;
    };
    if (isReq) {
      const teacherReq = COURSE_LIB.filter(c => c.required);
      const sysRecIds = p.sysRec || [];
      const sysRec = sysRecIds.map(id => COURSE_LIB.find(c => c.id === id)).filter(Boolean);
      const planHtml = planOpen ? (p.plan || []).map(pd => {
        const dayCourses = pd.courses.map(id => {
          const c = COURSE_LIB.find(x => x.id === id);
          if (!c) return "";
          const st = p.courses[id];
          const pr = Math.round(st.lessons.filter(l => l.d && l.q).length / c.chapters.length * 100);
          return `
            <div class="chapter-row ${st.finished ? "done" : ""}" ${pd.day === 1 ? `data-action="open-course" data-id="${id}"` : ''} style="padding:8px 0;${pd.day > 1 ? 'cursor:default' : ''}">
              <span class="chapter-check">${st.finished ? "✓" : pd.day === 1 ? "▶" : "·"}</span>
              <span style="flex:1;font-size:13px">${c.name}</span>
              <span class="mono" style="font-size:10px;opacity:.5">${c.type === "soft" ? "软" : "硬"} ${pr}%</span>
            </div>`;
        }).join("");
        return `
          <div class="plan-day">
            <div class="plan-day-head">
              <span class="mono" style="font-size:11px;font-weight:700">DAY ${pd.day}</span>
              <span class="mono" style="font-size:10px;opacity:.5">${pd.courses.length} 门课</span>
            </div>
            ${dayCourses}
          </div>`;
      }).join("") : "";
      return `
        <div class="learn-page">
          <button class="m-btn-back" style="margin:0 0 var(--sp-md)" data-action="go" data-to="#/station">返回工位</button>
          <div class="sec-tag st-hard">我要学
            <span>每日必修 · ${mentor.name} 指定</span>
            ${(p.plan || []).length ? `<button class="plan-toggle" data-action="toggle-plan">${planOpen ? "收起计划 ▲" : "学习计划 ▼"}</button>` : ""}
          </div>
          <p style="font-size:12px;opacity:.6;margin:0 0 10px;line-height:1.5">本部分课程为每日必须学习的内容，请完成今天的全部内容学习。</p>
          ${planOpen && (p.plan || []).length ? `<div class="report-block" style="padding:var(--sp-sm);margin-bottom:var(--sp-sm)">${planHtml}</div>` : ""}
          ${teacherReq.length ? `<div class="sub-tag">导师要求</div>${teacherReq.map(c => card(c)).join("")}` : ""}
          ${sysRec.length ? `<div class="sub-tag">系统推荐 <span>基于初聊画像判定</span></div>${sysRec.map(c => card(c, { isSys: true, isFocus: true })).join("")}` : ""}
        </div>`;
    } else {
      const suggestIds = p.suggest || [];
      const otherIds = p.others || [];
      const sug = suggestIds.map(id => COURSE_LIB.find(c => c.id === id)).filter(Boolean);
      const oth = otherIds.map(id => COURSE_LIB.find(c => c.id === id)).filter(Boolean);
      return `
        <div class="learn-page">
          <button class="m-btn-back" style="margin:0 0 var(--sp-md)" data-action="go" data-to="#/station">返回工位</button>
          <div class="sec-tag st-soft">我想学 <span>选修导师 ${mentor.name} · 自主探索</span></div>
          <p style="font-size:12px;opacity:.6;margin:0 0 10px;line-height:1.5">本部分鼓励学生自主学习，非必须要求。</p>
          ${sug.length ? `<div class="sub-tag">建议学习</div>${sug.map(c => card(c, { isFocus: true })).join("")}` : ""}
          ${oth.length ? `<div class="sub-tag">其他课程</div>${oth.map(c => card(c)).join("")}` : ""}
        </div>`;
    }
  }

  // ---------- 课程详情（介绍→微课列表→演练→再评） ----------
  function viewCourse() {
    const c = state.course, p = pkg.data, st = p.courses[c.id];
    const lessonsDone = st.lessons.every(l => l.d && l.q);
    const lessonList = c.chapters.map((t, i) => {
      const prevDone = i === 0 || (st.lessons[i-1].d && st.lessons[i-1].q);
      const thisDone = st.lessons[i].d && st.lessons[i].q;
      const isCurrent = prevDone && !thisDone;
      return `
        <div class="chapter-row ${thisDone ? "done" : ""} ${!prevDone ? "locked-row" : ""}" ${prevDone ? `data-action="enter-lesson" data-i="${i}"` : ""}>
          <span class="chapter-check">${thisDone ? "✓" : prevDone ? (i + 1) : "🔒"}</span>
          <span style="flex:1">第${i + 1}节 · ${t}</span>
          ${thisDone ? '<span class="mono" style="font-size:10px;color:var(--c-success)">已完成</span>' : isCurrent ? '<span class="mono" style="font-size:10px">当前</span>' : !prevDone ? '<span class="mono" style="font-size:10px;opacity:.4">未解锁</span>' : ""}
        </div>`;
    }).join("");
    return `
      <div class="learn-page">
        <button class="m-btn-back" style="margin:0 0 var(--sp-md)" data-action="go" data-to="#/list/${state.list}">返回列表</button>
        <div class="video-ph" style="height:160px">
          <svg viewBox="0 0 24 24" width="36" height="36" fill="currentColor" opacity=".85"><path d="M8 5.5v13l11-6.5z"/></svg>
          <span class="mono">课程介绍 · 演示占位</span>
        </div>
        <div class="report-block" style="margin-top:var(--sp-md)">
          <div class="card-title">${c.name}</div>
          <p style="font-size:13px;opacity:.75;line-height:1.6">${c.goal}</p>
          <div style="display:flex;gap:6px;margin-top:8px">
            <span class="grade ${c.type === "soft" ? "g-high" : "g-mid"}">${c.type === "soft" ? "软技能提升" : "硬技能实战"}</span>
            <span class="mono" style="font-size:11px;opacity:.5;align-self:center">${c.cap} · ${c.chapters.length} 节微课</span>
          </div>
          <p style="font-size:12px;opacity:.55;margin-top:6px;line-height:1.5">
            ${c.type === "soft"
              ? "训练方式：微课学习 → 情景模拟演练（多角色评审会）→ 再评"
              : "训练方式：微课学习 → 实战任务（做作品+提交）→ 再评"}
          </p>
        </div>
        <div class="sec-tag st-hard">微课学习 <span>顺序解锁 · 每节配课后练习</span></div>
        <div class="report-block">${lessonList}</div>
        <div class="sec-tag st-soft">${c.type === "hard" ? "实战任务" : "情景模拟演练"} <span>${c.type === "hard" ? "硬技能检验 · 作业提交" : "评审会 · 多角色对话"}</span></div>
        <div class="report-block">
          ${lessonsDone
            ? st.drillDone
              ? `<div style="display:flex;gap:8px;align-items:center;padding:4px 0">
                   <div class="chapter-row" style="cursor:pointer;flex:1" data-action="sb-review"><span class="chapter-check" style="background:var(--c-block-mint);border:none">✓</span><span style="flex:1;font-size:13px">查看上次记录与报告</span></div>
                   <button class="chat-end-btn" data-action="enter-drill">重新模拟</button>
                 </div>`
              : `<div class="chapter-row" style="cursor:pointer" data-action="enter-drill"><span class="chapter-check">▶</span><span style="flex:1">${c.type === "hard" ? (TASKS[c.id] || TASKS.C3).title : "智能客服升级 · 第一期评审会"}</span></div>`
            : `<div class="chapter-row locked-row"><span class="chapter-check">🔒</span><span style="flex:1;opacity:.5">完成全部微课后解锁</span></div>`}
        </div>
        <div class="sec-tag" style="border-color:var(--c-ink)">再评 <span>${c.type === "soft" ? "对话测评 · 能力对比" : "客观题 · 知识检验"}</span></div>
        <div class="report-block">
          ${st.finished
            ? `<div class="quiz-done">✓ 课程已完成</div>`
            : lessonsDone && st.drillDone
              ? `<div class="chapter-row" style="cursor:pointer" data-action="pt-start"><span class="chapter-check">▶</span><span style="flex:1;font-size:13px">${c.type === "soft" ? "开始对话测评（5轮）" : "开始客观题（5题）"}</span></div>`
              : `<div class="chapter-row locked-row"><span class="chapter-check">🔒</span><span style="flex:1;opacity:.5">需完成微课和情景模拟演练后解锁</span></div>`}
        </div>
      </div>`;
  }

  // ---------- 微课学习页 ----------
  function viewLesson() {
    const c = state.course, st = pkg.data.courses[c.id];
    const i = state.idx;
    const bank = QUIZ_BANK[c.id];
    if (!st.lessons[i].d) {
      return `
        <div class="learn-page">
          <button class="m-btn-back" style="margin:0 0 var(--sp-sm)" data-action="back-course">← 返回课程</button>
          <div class="lesson-head mono">微课 ${i + 1}/${c.chapters.length} · ${c.cap}</div>
          <div class="video-ph tall">
            <svg viewBox="0 0 24 24" width="44" height="44" fill="currentColor" opacity=".85"><path d="M8 5.5v13l11-6.5z"/></svg>
            <span class="mono">微课视频 · 演示占位</span>
          </div>
          <div class="report-block" style="margin-top:var(--sp-md)"><div class="card-title">第${i + 1}节 · ${c.chapters[i]}</div></div>
          <button class="quiz-start" data-action="lesson-done">我学完了，进入练习 →</button>
        </div>`;
    }
    if (!st.lessons[i].q) {
      if (!bank) { st.lessons[i].q = true; pkg.save(); state.stage = "course"; return viewCourse(); }
      const q = bank[i] || bank[0];
      return `
        <div class="learn-page">
          <button class="m-btn-back" style="margin:0 0 var(--sp-sm)" data-action="back-course">← 返回课程</button>
          <div class="lesson-head mono">课后练习 · 第${i + 1}节</div>
          <div class="report-block">
            <div class="quiz-q">${q.q}</div>
            ${q.opts.map((o, k) => `<button class="quiz-opt" data-action="answer" data-i="${k}">${String.fromCharCode(65 + k)}. ${o}</button>`).join("")}
            <div id="quiz-why" class="quiz-why" style="display:none"></div>
          </div>
        </div>`;
    }
    // 本节完成
    if (i + 1 < c.chapters.length) {
      return `
        <div class="learn-page"><div class="m-center">
          <div class="m-ok-circle" style="background:var(--c-block-mint)">✓</div>
          <h2 style="font-size:18px;font-weight:var(--fw-700)">第${i + 1}节完成</h2>
          <button class="quiz-start" style="margin-top:var(--sp-lg)" data-action="next-lesson" data-i="${i + 1}">进入第${i + 2}节 →</button>
          <button class="m-btn-back" data-action="back-course">返回课程目录</button>
        </div></div>`;
    }
    state.stage = "course"; return viewCourse();
  }

  // ---------- 情境演练页 ----------
  function viewDrill() {
    const c = state.course;
    return `
      <div class="learn-page">
        <div class="lesson-head mono">情境演练</div>
        <div class="report-block">
          <div class="card-title">${c.drill || "综合情景演练"}</div>
          <p style="font-size:13px;opacity:.7;line-height:1.7">在日常工作中你将遇到该场景，按课程所学做出判断与处理。</p>
        </div>
        <div class="report-block" style="background:var(--c-surface-soft)">
          <p class="mono" style="font-size:11px;opacity:.55">情景模拟 · 演示占位（后续接入多角色对话演练）</p>
        </div>
        <button class="quiz-start" data-action="finish-drill">完成演练，进入再评 →</button>
      </div>`;
  }

  // ---------- 再评页（软技能对话 / 硬技能客观题） ----------
  const pt = { sessionId: null, msgs: [], round: 0, maxRounds: 5, finished: false, busy: false, eval: null, questions: [], answers: [], qIdx: 0 };

  async function ptApi(path, body) {
    const base = (location.hostname === "localhost" || location.hostname === "127.0.0.1") ? "http://localhost:3090" : "";
    const r = await fetch(base + path, { method: "POST", headers: { "Content-Type": "application/json; charset=utf-8" }, body: JSON.stringify(body) });
    return r.json();
  }

  function viewExam() {
    const c = state.course;
    const isSoft = c.type === "soft";
    if (pt.eval) return viewPostTestResult();
    return `
      <div class="learn-page">
        <button class="m-btn-back" style="margin:0 0 var(--sp-md)" data-action="back-course">← 返回课程</button>
        <div class="sec-tag ${isSoft ? "st-soft" : "st-hard"}">再评 <span>${isSoft ? "软技能 · 对话测评" : "硬技能 · 客观题"}</span></div>
        <div class="report-block">
          <div class="card-title">课程能力再评</div>
          <p style="font-size:13px;opacity:.7;line-height:1.7">
            ${isSoft
              ? "通过简短对话，测评你在「" + c.cap + "」方面的能力变化，并与初聊画像对比。"
              : "完成 5 道客观题，检验你对「" + c.cap + "」知识点的掌握程度。"}
          </p>
        </div>
        <div class="report-block" style="background:var(--c-block-mint)">
          <p style="font-size:12px;line-height:1.7">测 · 学 · 练 · 考——你已完成前三环，现在进入最后的「考」。</p>
        </div>
        <button class="quiz-start" data-action="pt-start">开始再评 →</button>
      </div>`;
  }

  function viewPostTestChat() {
    const done = pt.finished || pt.round >= pt.maxRounds;
    return `
      <div class="chat-page">
        <div class="chat-head">
          <div style="flex:1">
            <div style="font-weight:var(--fw-700)">能力再评</div>
          </div>
          ${done ? '<button class="chat-end-btn" data-action="pt-evaluate">查看结果</button>' : '<button class="chat-end-btn" data-action="pt-end">结束</button>'}
        </div>
        <div class="chat-body" id="pt-body">
          ${pt.msgs.map(m => m.role === "user"
            ? `<div class="chat-msg user"><div class="chat-bubble m">${m.text}</div></div>`
            : `<div class="chat-msg agent"><span class="agent-chip" style="background:var(--c-block-mint)">测评导师</span><div class="chat-bubble a">${m.text}</div></div>`).join("")}
        </div>
        ${done ? `
        <div style="padding:var(--sp-md);border-top:1px solid var(--c-hairline);background:var(--c-canvas)">
          <button data-action="pt-evaluate" style="width:100%;height:48px;border:none;border-radius:var(--r-pill);background:var(--c-primary);color:#fff;font-size:16px;font-family:var(--font-sans);cursor:pointer">查看对比报告 →</button>
        </div>` : `
        <div class="chat-input-bar">
          <div class="kb-mode" id="pt-kb" style="display:flex;gap:8px;width:100%;align-items:center">
            <button class="ib-icon" data-action="pt-toggle-voice" title="语音输入">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
            </button>
            <input class="chat-input" id="pt-input" placeholder="你的回答…" maxlength="300" style="flex:1;min-width:0;height:40px;border:1px solid var(--c-hairline);border-radius:var(--r-pill);padding:0 16px;font-size:15px;font-family:var(--font-sans);background:var(--c-surface-soft)">
            <button class="chat-send" data-action="pt-send" style="flex-shrink:0;height:40px;padding:0 16px;border:none;border-radius:var(--r-pill);background:var(--c-primary);color:#fff;font-size:15px;font-family:var(--font-sans);cursor:pointer">发送</button>
          </div>
          <div class="voice-mode" id="pt-vm" style="display:none;gap:8px;width:100%;align-items:center">
            <button class="ib-icon" data-action="pt-toggle-kb" title="键盘输入">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="2" y="6" width="20" height="12" rx="2"/><line x1="6" y1="10" x2="6" y2="10.01"/><line x1="10" y1="10" x2="10" y2="10.01"/><line x1="14" y1="10" x2="14" y2="10.01"/><line x1="18" y1="10" x2="18" y2="10.01"/><line x1="7" y1="14" x2="17" y2="14"/></svg>
            </button>
            <div class="hold-to-talk" id="pt-hold">按住说话</div>
          </div>
        </div>`}
      </div>`;
  }

  function viewPostTestQuiz() {
    const q = pt.questions[pt.qIdx];
    if (!q) return viewPostTestResult();
    return `
      <div class="learn-page">
        <button class="m-btn-back" style="margin:0 0 var(--sp-sm)" data-action="back-course">← 返回课程</button>
        <div class="lesson-head mono">第 ${pt.qIdx + 1}/${pt.questions.length} 题</div>
        <div class="report-block">
          <div class="quiz-q">${q.q}</div>
          ${q.opts.map((o, k) => `<button class="quiz-opt" data-action="pt-answer" data-i="${k}">${String.fromCharCode(65 + k)}. ${o}</button>`).join("")}
        </div>
      </div>`;
  }

  function viewPostTestResult() {
    const ev = pt.eval;
    if (!ev) return `<div class="m-center"><p>评估生成中…</p></div>`;
    const c = state.course;
    if (ev.type === "hard") {
      return `
        <div class="learn-page">
          <div class="report-head"><h2 style="font-size:22px;font-weight:var(--fw-700)">再评结果</h2></div>
          <div class="report-block" style="background:var(--c-block-mint);text-align:center;padding:var(--sp-lg)">
            <div class="mono" style="font-size:28px;font-weight:700">${ev.score}</div>
            <div style="font-size:12px;opacity:.6">答对 ${ev.correct}/${ev.total} 题</div>
          </div>
          ${ev.details?.map((d, i) => `
          <div class="report-block">
            <div style="font-size:13px;font-weight:700;margin-bottom:4px">${i + 1}. ${d.q}</div>
            <p style="font-size:12px;line-height:1.5;${d.isCorrect ? "color:var(--c-success)" : "color:var(--c-error)"}">${d.isCorrect ? "✓ 正确" : "✗ 你的答案：" + d.userAnswer + " | 正确答案：" + d.correctAnswer}</p>
            <p style="font-size:12px;opacity:.6">${d.why}</p>
          </div>`).join("") || ""}
          <div class="report-block profile-card">
            <div class="card-title">总评</div>
            <p style="font-size:13px">${ev.comment}</p>
          </div>
          <button class="quiz-start" data-action="finish-course">完成课程 ✓</button>
        </div>`;
    }
    // 软技能结果（含前后对比雷达图）
    // 取前测数据
    let preScore = null;
    try {
      const ph = phoneKey();
      const chat = JSON.parse(localStorage.getItem("tos_assess_" + ph) || "{}");
      const rep = JSON.parse(localStorage.getItem("tos_report_" + (chat.sessionId || "")) || "null");
      if (rep && rep.soft) {
        const dim = rep.soft.find(d => c.cap.includes(d.name) || d.name.includes(c.cap));
        if (dim) preScore = Math.round(((dim.scoreRange[0] + dim.scoreRange[1]) / 2 - 1) / 3 * 88) + 6;
      }
    } catch (e) {}
    const postScore = ev.score || 60;
    return `
      <div class="learn-page">
        <div class="report-head"><h2 style="font-size:22px;font-weight:var(--fw-700)">能力变化对比</h2></div>
        <div class="report-block">
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
            <span style="width:50px;font-size:12px;font-weight:700;color:#2e5fe8">前测</span>
            <div class="heat-track" style="flex:1;height:20px;border-radius:10px">
              <div style="height:100%;border-radius:10px;background:#2e5fe8;width:${preScore ?? 0}%;transition:width .8s"></div>
            </div>
            <span class="mono" style="width:36px;text-align:right;font-size:16px;font-weight:700;color:#2e5fe8">${preScore ?? "—"}</span>
          </div>
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px">
            <span style="width:50px;font-size:12px;font-weight:700;color:#e0405a">后测</span>
            <div class="heat-track" style="flex:1;height:20px;border-radius:10px">
              <div style="height:100%;border-radius:10px;background:#e0405a;width:${postScore}%;transition:width .8s"></div>
            </div>
            <span class="mono" style="width:36px;text-align:right;font-size:16px;font-weight:700;color:#e0405a">${postScore}</span>
          </div>
          ${preScore ? `<div style="text-align:center;margin-top:4px"><span style="font-size:14px;color:${postScore > preScore ? "var(--c-success)" : "var(--c-error)"};font-weight:700">${postScore > preScore ? "↑" : "↓"} ${Math.abs(postScore - preScore)} 分</span></div>` : ""}
        </div>
        <div class="report-block">
          <div class="card-title">评估</div>
          <p style="font-size:13px;line-height:1.7">${ev.comment || ""}</p>
          <p style="font-size:12px;opacity:.6;margin-top:6px">💡 ${ev.improvement || ""}</p>
        </div>
        <button class="quiz-start" data-action="finish-course">完成课程 ✓</button>
      </div>`;
  }

  async function ptStart() {
    const c = state.course;
    pt.sessionId = "pt_" + Date.now().toString(36);
    pt.msgs = []; pt.round = 0; pt.finished = false; pt.eval = null; pt.answers = []; pt.qIdx = 0;
    try {
      const d = await ptApi("/api/posttest/start", { sessionId: pt.sessionId, courseId: c.id, type: c.type });
      if (c.type === "hard") {
        pt.questions = d.questions || [];
        state.stage = "post-quiz";
        $app().innerHTML = viewPostTestQuiz();
      } else {
        pt.msgs = d.msgs || []; pt.round = d.round || 1; pt.maxRounds = d.maxRounds || 5;
        state.stage = "post-chat";
        $app().innerHTML = viewPostTestChat();
      }
    } catch (e) {
      if (c.type === "hard") { pt.questions = []; state.stage = "post-quiz"; $app().innerHTML = viewPostTestQuiz(); }
      else { pt.msgs = [{ role: "agent", name: "测评导师", text: "你好！聊聊你在这个能力上的收获吧。" }]; state.stage = "post-chat"; $app().innerHTML = viewPostTestChat(); }
    }
  }

  async function ptSend() {
    if (pt.busy) return;
    const input = document.getElementById("pt-input");
    const text = (input?.value || "").trim();
    if (!text) return;
    if (input) input.value = "";
    pt.msgs.push({ role: "user", name: "你", text });
    const body = document.getElementById("pt-body");
    if (body) { body.insertAdjacentHTML("beforeend", `<div class="chat-msg user"><div class="chat-bubble m">${text}</div></div>`); body.scrollTop = body.scrollHeight; }
    pt.busy = true;
    try {
      const d = await ptApi("/api/posttest/chat", { sessionId: pt.sessionId, text });
      pt.msgs = d.msgs || pt.msgs; pt.round = d.round || pt.round; pt.finished = d.finished || false;
    } catch (e) { pt.msgs.push({ role: "agent", name: "测评导师", text: "（网络波动）" }); }
    pt.busy = false;
    state.stage = "post-chat";
    $app().innerHTML = viewPostTestChat();
    const b2 = document.getElementById("pt-body");
    if (b2) b2.scrollTop = b2.scrollHeight;
  }

  async function ptEvaluate() {
    state.stage = "post-result";
    $app().innerHTML = viewPostTestResult();
    try {
      const c = state.course;
      const d = await ptApi("/api/posttest/evaluate", { sessionId: pt.sessionId, courseId: c.id, type: c.type, answers: pt.answers });
      pt.eval = d;
    } catch (e) { pt.eval = { score: 60, comment: "评估暂不可用" }; }
    $app().innerHTML = viewPostTestResult();
    drawPtRadar();
  }

  function drawPtRadar() {
    const el = document.getElementById("pt-radar");
    if (!el || !window.echarts || !pt.eval) return;
    const c = state.course;
    let preScore = null;
    try {
      const ph = phoneKey();
      const chat = JSON.parse(localStorage.getItem("tos_assess_" + ph) || "{}");
      const rep = JSON.parse(localStorage.getItem("tos_report_" + (chat.sessionId || "")) || "null");
      if (rep && rep.soft) {
        const dim = rep.soft.find(d => c.cap.includes(d.name) || d.name.includes(c.cap));
        if (dim) preScore = Math.round(((dim.scoreRange[0] + dim.scoreRange[1]) / 2 - 1) / 3 * 88) + 6;
      }
    } catch (e) {}
    const postScore = pt.eval.score || 60;
    const indicators = [
      { name: c.cap || "核心能力", max: 100 },
      { name: "应用能力", max: 100 },
      { name: "表达质量", max: 100 },
      { name: "问题处理", max: 100 },
      { name: "整体表现", max: 100 },
    ];
    const preData = indicators.map((_, i) => preScore ? Math.max(5, preScore + Math.sin(i * 2) * 5) : 0);
    const postData = indicators.map((_, i) => Math.max(5, postScore + Math.cos(i * 1.5) * 8));
    const chart = echarts.init(el);
    chart.setOption({
      radar: { indicator: indicators, radius: "58%", axisName: { color: "#000", fontSize: 10 }, splitArea: { areaStyle: { color: ["#fff", "#f7f7f5"] } }, splitLine: { lineStyle: { color: "#e6e6e6" } } },
      tooltip: { trigger: "item" },
      series: [{ type: "radar", data: [
        { value: preData, name: "前测", itemStyle: { color: "#2e5fe8" }, lineStyle: { color: "#2e5fe8", width: 2 }, areaStyle: { color: "rgba(46,95,232,.10)" } },
        { value: postData, name: "后测", itemStyle: { color: "#e0405a" }, lineStyle: { color: "#e0405a", width: 2 }, areaStyle: { color: "rgba(224,64,90,.12)" }, symbol: "circle", symbolSize: 6 },
      ]}],
    });
  }

  let ptRec = null, ptHolding = false;
  function ptToggle(mode) {
    const kb = document.getElementById("pt-kb"), vm = document.getElementById("pt-vm");
    if (!kb || !vm) return;
    kb.style.display = mode === "kb" ? "flex" : "none";
    vm.style.display = mode === "voice" ? "flex" : "none";
  }
  function ptHoldStart() {
    if (ptHolding) return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { if (window.__tosToast) window.__tosToast("不支持语音识别"); ptToggle("kb"); return; }
    const btn = document.getElementById("pt-hold");
    try {
      ptRec = new SR(); ptRec.lang = "zh-CN"; ptRec.interimResults = true; ptRec.continuous = true;
      ptRec.onresult = (e) => { let t = ""; for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript; const inp = document.getElementById("pt-input"); if (inp) inp.value = t; };
      ptRec.onend = () => { ptHolding = false; if (btn) { btn.classList.remove("rec"); btn.textContent = "按住说话"; } ptToggle("kb"); };
      ptRec.onerror = () => { ptHolding = false; if (btn) { btn.classList.remove("rec"); btn.textContent = "按住说话"; } };
      ptRec.start(); ptHolding = true;
      if (btn) { btn.classList.add("rec"); btn.textContent = "松开结束"; }
    } catch (e) { ptToggle("kb"); }
  }
  function ptHoldEnd() { if (ptHolding && ptRec) { try { ptRec.stop(); } catch(e){} } }

  // ---------- 岗位任务/结业考试（分阶段解锁） ----------
  function viewMission() {
    const p = pkg.data;
    // 判断必修课完成状态
    const reqCourses = COURSE_LIB.filter(c => c.required);
    const reqDone = reqCourses.every(c => p.courses[c.id]?.finished);
    const allCourses = pkg.courseIds();
    const allDone = allCourses.every(id => p.courses[id]?.finished);
    const someDone = allCourses.filter(id => p.courses[id]?.finished).length;

    const stageLock = (stage) => {
      if (stage === 1) return !reqDone;
      if (stage === 2) return !allDone;
      if (stage === 3) return !allDone || !MISSIONS.slice(0,2).every(m => p.missions[m.id]);
      return false;
    };
    const stageLabel = (stage) => {
      if (stage === 1) return reqDone ? "" : "（完成第一阶段必修课后开启）";
      if (stage === 2) return allDone ? "" : "（完成第二阶段课程学习后开启）";
      return "";
    };
    const cards = MISSIONS.map((m, idx) => {
      const stage = idx + 1;
      const done = p.missions[m.id];
      const locked = stageLock(stage);
      if (locked) {
        return `
        <div class="course-card locked">
          <div class="course-ic lock">🔒</div>
          <div class="course-mid">
            <div class="course-name" style="opacity:.6">${m.name}${stageLabel(stage)}</div>
            <div class="course-goal">${m.from}</div>
          </div>
        </div>`;
      }
      return `
        <div class="course-card ${done ? "" : "clickable"}" ${done ? "" : `data-action="mission-open" data-id="${m.id}"`}>
          <div class="course-ic ${done ? "" : "lock"}">${done ? "✓" : "▣"}</div>
          <div class="course-mid">
            <div class="course-name">${m.name} ${done ? '<span class="mono" style="font-size:10px;color:var(--c-success)">已通过</span>' : ""}</div>
            <div class="course-goal">${m.from}</div>
          </div>
          ${done ? "" : '<span class="mono" style="opacity:.5;font-size:11px">进入 →</span>'}
        </div>`;
    }).join("");
    const allPass = MISSIONS.every(m => p.missions[m.id]);
    return `
      <div class="learn-page">
        <button class="m-btn-back" style="margin:0 0 var(--sp-md)" data-action="go" data-to="#/station">返回工位</button>
        <div class="sec-tag" style="border-color:var(--c-ink)">结业考试 <span>工作导师 老周 带队</span></div>
        <p style="font-size:12px;opacity:.6;margin-bottom:10px">课程进度：${someDone}/${allCourses.length} 门完成${allDone ? " ✓" : ""}</p>
        ${cards}
        ${allPass ? '<div class="quiz-done" style="margin-top:12px">结业考试全部通过——转正评估已解锁</div>' : ""}
      </div>`;
  }

  function viewMissionOpen() {
    const m = MISSIONS.find(x => x.id === state.missionOpen);
    return `
      <div class="learn-page">
        <button class="m-btn-back" style="margin:0 0 var(--sp-md)" data-action="go" data-to="#/mission">返回任务列表</button>
        <div class="report-block">
          <div class="card-title">${m.name}</div>
          <p style="font-size:13px;opacity:.6">${m.from}</p>
          <p style="font-size:13px;line-height:1.8;margin-top:8px">${m.desc}</p>
        </div>
        <div class="report-block" style="background:var(--c-surface-soft)">
          <p class="mono" style="font-size:11px;opacity:.55">情景演练 · 演示占位</p>
        </div>
        <button class="quiz-start" data-action="mission-done" data-id="${m.id}">完成演练 ✓</button>
      </div>`;
  }

  // ---------- 渲染 ----------
  function render(page) {
    stopBubbles();
    if (page.startsWith("list/")) { state.list = page.split("/")[1] || "required"; page = "list"; }
    if (page === "onboard") return $app().innerHTML = viewOnboard();
    if (page === "station") { pkg.load(); $app().innerHTML = viewStation(); startBubbles(); return; }
    if (page === "list") { pkg.load(); $app().innerHTML = viewList(); return; }
    if (page === "course") {
      pkg.load();
      if (state.stage === "lesson") return $app().innerHTML = viewLesson();
      if (state.stage === "sandbox-intro") return $app().innerHTML = viewSandboxIntro();
      if (state.stage === "sandbox-chat") return $app().innerHTML = viewSandboxChat();
      if (state.stage === "sandbox-report") return $app().innerHTML = viewSandboxReport();
      if (state.stage === "task") return $app().innerHTML = viewTask();
      if (state.stage === "drill") return $app().innerHTML = viewDrill();
      if (state.stage === "exam") return $app().innerHTML = viewExam();
      if (state.stage === "post-chat") return $app().innerHTML = viewPostTestChat();
      if (state.stage === "post-quiz") return $app().innerHTML = viewPostTestQuiz();
      if (state.stage === "post-result") return $app().innerHTML = viewPostTestResult();
      return $app().innerHTML = state.course ? viewCourse() : viewStation();
    }
    if (page === "profile") { pkg.load(); $app().innerHTML = viewProfile(); return; }
    if (page === "mission") { pkg.load(); $app().innerHTML = state.missionOpen ? viewMissionOpen() : viewMission(); return; }
  }

  // ---------- 事件 ----------
  function handle(act, el) {
    const app = $app();
    switch (act) {
      case "pick-day": {
        selectedDays = +el.dataset.d;
        app.innerHTML = viewOnboard(); return true;
      }
      case "claim-pkg": pkg.build(selectedDays); toastEl("培训包已生成（" + selectedDays + " 天计划）"); location.hash = "#/station"; return true;
      case "go-report2": location.hash = "#/report"; return true;
      case "go": location.hash = el.dataset.to; return true;
      case "pf-tab": profileTab = el.dataset.tab; app.innerHTML = viewProfile(); return true;
      case "logout": {
        localStorage.removeItem("tos_demo_last_phone");
        localStorage.removeItem("tos_assess_" + phoneKey());
        localStorage.removeItem("tos_pkg_" + phoneKey());
        ;
        location.hash = "#/login";
        return true;
      }
      case "open-course": {
        state.course = COURSE_LIB.find(x => x.id === el.dataset.id) || null;
        state.stage = "course"; state.idx = 0;
        if (state.course) location.hash = "#/course";
        return true;
      }
      case "enter-lesson": {
        state.idx = +el.dataset.i; state.stage = "lesson";
        app.innerHTML = viewLesson(); return true;
      }
      case "lesson-done": {
        pkg.data.courses[state.course.id].lessons[state.idx].d = true; pkg.save();
        app.innerHTML = viewLesson(); return true;
      }
      case "answer": {
        const bank = QUIZ_BANK[state.course.id];
        const q = (bank || [])[state.idx] || bank[0];
        if (!q) { state.stage = "course"; app.innerHTML = viewCourse(); return true; }
        const pick = +el.dataset.i;
        document.querySelectorAll(".quiz-opt").forEach((b, i) => {
          b.disabled = true;
          if (i === q.a) b.classList.add("right");
          else if (i === pick) b.classList.add("wrong");
        });
        const why = document.getElementById("quiz-why");
        why.style.display = "block";
        const pass = pick === q.a;
        why.innerHTML = (pass ? "✓ 答对了。" : "✗ 纠偏：") + q.why
          + (pass ? `<br><button data-action="quiz-pass" class="quiz-start" style="margin-top:10px">${state.idx + 1 < state.course.chapters.length ? "完成本节 →" : "完成最后一节 →"}</button>`
                  : `<br><button data-action="quiz-retry" class="quiz-start" style="margin-top:10px">再试一次</button>`);
        if (pass) { pkg.data.courses[state.course.id].lessons[state.idx].q = true; pkg.save(); }
        return true;
      }
      case "quiz-retry": app.innerHTML = viewLesson(); return true;
      case "quiz-pass": state.stage = "course"; app.innerHTML = viewCourse(); return true;
      case "next-lesson": {
        state.idx = +el.dataset.i; state.stage = "lesson";
        app.innerHTML = viewLesson(); return true;
      }
      case "back-course": state.stage = "course"; app.innerHTML = viewCourse(); return true;
      case "toggle-plan": planOpen = !planOpen; app.innerHTML = viewList(); return true;
      case "enter-drill": {
        const c = state.course;
        if (c.type === "hard" && TASKS[c.id]) {
          state.stage = "task"; app.innerHTML = viewTask();
        } else {
          state.stage = "sandbox-intro"; app.innerHTML = viewSandboxIntro();
        }
        return true;
      }
      case "sb-review": {
        const c = state.course;
        if (c && c.type === "hard") {
          // 硬技能回看任务结果
          if (task.eval) { app.innerHTML = viewTaskResult(TASKS[c.id] || TASKS.C3); return true; }
          toastEl("暂无历史记录"); return true;
        }
        const lastData = JSON.parse(localStorage.getItem("tos_sb_" + phoneKey() + "_" + (c?.id || "unknown")) || "null");
        if (lastData && lastData.msgs?.length) {
          sb.msgs = lastData.msgs; sb.round = lastData.round || 0; sb.finished = true;
          sb.eval = lastData.eval || null; sb.sessionId = lastData.sessionId;
          state.stage = "sandbox-chat"; app.innerHTML = viewSandboxChat();
        } else {
          toastEl("暂无历史记录");
        }
        return true;
      }
      case "sb-start": sbStart(); return true;
      case "sb-send": sbSend(); return true;
      case "sb-toggle-voice": sbSetInputMode("voice"); return true;
      case "sb-toggle-kb": sbSetInputMode("kb"); return true;
      case "sb-brief": sbShowBrief = !sbShowBrief; app.innerHTML = viewSandboxChat(); return true;
      case "task-start": task.started = true; task.startAt = Date.now(); app.innerHTML = viewTask(); return true;
      case "task-submit": {
        task.submitted = true;
        // Demo：模拟逾期判定（如果超过 24h 算逾期，这里演示按时）
        task.late = false;
        const c = state.course;
        const t = TASKS[c.id] || TASKS.C3;
        // Demo：AI 评估占位（后续接真实评估）
        const baseScore = 65 + Math.floor(Math.random() * 20);
        task.eval = {
          score: task.late ? Math.round(baseScore * t.penalty) : baseScore,
          dimensions: [
            { name: "功能完整性", score: Math.min(100, baseScore + 5), comment: "核心模块均已覆盖，结构清晰" },
            { name: "代码质量", score: Math.max(40, baseScore - 10), comment: "命名规范，但可进一步提取公共样式" },
            { name: "加分项完成度", score: Math.floor(baseScore * 0.6), comment: "完成了部分加分项，尚有提升空间" },
          ],
          comment: "整体完成度良好。建议后续关注代码可维护性和交互细节打磨。" + (task.late ? "注意：因逾期提交，总分已按" + Math.round((1 - t.penalty) * 100) + "%折算。" : ""),
        };
        pkg.data.courses[c.id].drillDone = true; pkg.save();
        app.innerHTML = viewTaskResult(t);
        toastEl("任务评估完成！");
        return true;
      }
      case "sb-end": {
        sb.finished = true;
        try { sbApi("/api/sandbox/chat", { sessionId: sb.sessionId, text: "（会议结束）", endNow: true }); } catch(e){}
        state.stage = "sandbox-chat"; app.innerHTML = viewSandboxChat(); return true;
      }
      case "sb-evaluate": sbEvaluate(); return true;
      case "finish-drill": state.stage = "exam"; app.innerHTML = viewExam(); return true;
      case "pt-start": ptStart(); return true;
      case "pt-send": ptSend(); return true;
      case "pt-toggle-voice": ptToggle("voice"); return true;
      case "pt-toggle-kb": ptToggle("kb"); return true;
      case "pt-end": pt.finished = true; state.stage = "post-chat"; app.innerHTML = viewPostTestChat(); return true;
      case "pt-evaluate": ptEvaluate(); return true;
      case "pt-answer": {
        pt.answers[pt.qIdx] = +el.dataset.i;
        pt.qIdx++;
        if (pt.qIdx < pt.questions.length) { app.innerHTML = viewPostTestQuiz(); }
        else { ptEvaluate(); }
        return true;
      }
      case "finish-course": {
        pkg.data.courses[state.course.id].finished = true; pkg.save();
        state.stage = "course"; app.innerHTML = viewCourse();
        toastEl("课程完成！进度已同步到工位"); return true;
      }
      case "mission-open": {
        // 直接启动沙盘模拟（与课程内的情景模拟演练相同逻辑）
        const m = MISSIONS.find(x => x.id === el.dataset.id);
        if (m) {
          state.missionOpen = m.id;
          state.stage = "sandbox-intro";
          app.innerHTML = viewSandboxIntro();
        }
        return true;
      }
      case "mission-done": {
        pkg.data.missions[el.dataset.id] = true; pkg.save();
        state.missionOpen = null; app.innerHTML = viewMission();
        toastEl(pkg.progress() >= 100 ? "培训包 100%！转正评估已解锁" : "演练通过！"); return true;
      }
    }
    return false;
  }

  // ---------- 情景模拟演练 ----------
  const sb = { sessionId: null, msgs: [], round: 0, maxRounds: 10, finished: false, busy: false, eval: null };
  const AGENT_STYLE = { dev: { c: "#c5b0f4", l: "研发" }, biz: { c: "#f3c9b6", l: "业务" }, qa: { c: "#c8e6cd", l: "测试" } };

  // 场景数据（与服务端保持同步，介绍页立即可见）
  const SCENARIO_DATA = {
    title: "智能客服升级 · 第一期评审会",
    background: "你是启明科技的AI产品经理，负责「智能客服升级」项目。公司现有客服系统每天处理约5000条咨询，人工回复平均耗时3分钟，高峰期排队严重。公司决定引入AI能力提升客服效率，你负责第一期方案的评审。",
    goal: "顺利完成评审：让各方理解方案范围、回应关切、达成共识并确定上线时间。",
    phase1: {
      title: "第一期目标",
      items: [
        "覆盖高频TOP 100问题自动回复，目标自动应答率≥40%",
        "复杂/敏感问题100%转人工，转接延迟<2秒",
        "AI回答准确率≥85%（基于内部评测集）",
        "客服人力释放30%，转向高价值客户服务",
        "用户满意度（CSAT）从3.2提升至3.7（5分制）",
      ],
    },
    prd: {
      title: "产品需求文档（PRD 摘要）",
      sections: [
        { h: "1. 项目背景", c: "现有客服系统日均5000条咨询，人工平均处理3分钟/条，高峰期用户等待超15分钟，投诉率上升8%。竞品已上线AI客服，响应时间<10秒。" },
        { h: "2. 功能范围", c: "第一期仅做FAQ自动问答：基于公司知识库（约2000篇文档），用RAG方式检索并生成回答。覆盖TOP 100高频问题（占咨询量40%）。不做：多轮对话、情绪识别、主动推荐。" },
        { h: "3. 技术方案", c: "采用RAG（检索增强生成）方案：用户提问→向量化检索知识库Top 5→LLM生成回答并标注来源。不微调模型，使用公司统一的GLM-4服务。置信度低于阈值时自动转人工。" },
        { h: "4. 里程碑", c: "W1-2：需求确认+知识库整理；W3-4：RAG管道搭建+评测集标注；W5-6：联调+内部测试；W7-8：灰度发布20%流量+全量上线。" },
        { h: "5. 成功指标", c: "自动应答率≥40%；准确率≥85%；转人工延迟<2秒；CSAT从3.2→3.7；客服效率提升30%。" },
        { h: "6. 风险与对策", c: "知识库覆盖不足→持续补充FAQ；幻觉风险→置信度阈值+人工兜底；用户不适→首次使用提示「AI回复」标识，可随时转人工。" },
      ],
    },
  };
  sb.scenario = SCENARIO_DATA;

  async function sbApi(path, body) {
    const base = (location.hostname === "localhost" || location.hostname === "127.0.0.1") ? "http://localhost:3090" : "";
    const r = await fetch(base + path, { method: "POST", headers: { "Content-Type": "application/json; charset=utf-8" }, body: JSON.stringify(body) });
    return r.json();
  }

  function sbBubble(m) {
    if (m.role === "user") return `<div class="chat-msg user"><div class="chat-bubble m">${m.text}</div></div>`;
    if (m.role === "system") return `<div style="text-align:center;padding:8px 16px"><span class="mono" style="font-size:11px;opacity:.5;background:var(--c-surface-soft);border-radius:var(--r-pill);padding:4px 12px">${m.text}</span></div>`;
    const st = AGENT_STYLE[m.role] || {};
    return `<div class="chat-msg agent"><span class="agent-chip" style="background:${st.c || "#ddd"}">${st.l || m.role}</span><div class="chat-bubble a"><b style="font-size:11px">${m.name}</b><br>${m.text}</div></div>`;
  }

  function viewSandboxIntro() {
    // 硬技能课程不应该进这里，但如果进了就显示任务
    const c = state.course;
    if (c && c.type === "hard") {
      return viewTask();
    }
    const sc = sb.scenario || {};
    return `
      <div class="learn-page">
        <button class="m-btn-back" style="margin:0 0 var(--sp-md)" data-action="back-course">← 返回课程</button>
        <div class="sec-tag st-soft">情景模拟演练</div>
        <div class="report-block">
          <div class="card-title">${sc.title || "智能客服升级 · 第一期评审会"}</div>
          <p style="font-size:13px;opacity:.75;line-height:1.7">${sc.background || ""}</p>
        </div>
        <div class="report-block">
          <div class="card-title">会议目标</div>
          <p style="font-size:13px;opacity:.7;line-height:1.6">${sc.goal || ""}</p>
        </div>
        ${sc.phase1 ? `
        <div class="report-block" style="background:var(--c-block-mint)">
          <div class="card-title">${sc.phase1.title}</div>
          ${(sc.phase1.items || []).map(it => `<div style="font-size:13px;line-height:1.8;padding:2px 0;display:flex;gap:6px"><span style="color:var(--c-success)">✓</span><span>${it}</span></div>`).join("")}
        </div>` : ""}
        ${sc.prd?.sections ? `
        <div class="report-block">
          <div class="card-title">${sc.prd.title || "PRD"}</div>
          ${(sc.prd.sections || []).map(sec => `
          <div style="margin-bottom:10px">
            <div style="font-size:13px;font-weight:700;margin-bottom:3px">${sec.h}</div>
            <div style="font-size:12px;opacity:.7;line-height:1.7">${sec.c}</div>
          </div>`).join("")}
        </div>` : ""}
        <div class="report-block">
          <div class="card-title">参会人员</div>
          <div class="chapter-row"><span class="chapter-check" style="background:#c5b0f4;border:none;width:10px;height:10px;border-radius:50%"></span><div style="flex:1"><b style="font-size:13px">张工</b> <span class="mono" style="font-size:10px;opacity:.5">研发负责人</span><br><span style="font-size:11px;opacity:.6">技术功底深厚，对细节要求极高。沟通直接，不会拐弯抹角，但提出的质疑往往切中要害。</span></div></div>
          <div class="chapter-row"><span class="chapter-check" style="background:#f3c9b6;border:none;width:10px;height:10px;border-radius:50%"></span><div style="flex:1"><b style="font-size:13px">刘总</b> <span class="mono" style="font-size:10px;opacity:.5">业务方负责人</span><br><span style="font-size:11px;opacity:.6">思维活跃，经常提出超范围的设想。对技术限制不太了解，习惯用商业价值来推动需求。</span></div></div>
          <div class="chapter-row"><span class="chapter-check" style="background:#c8e6cd;border:none;width:10px;height:10px;border-radius:50%"></span><div style="flex:1"><b style="font-size:13px">陈姐</b> <span class="mono" style="font-size:10px;opacity:.5">测试负责人</span><br><span style="font-size:11px;opacity:.6">会上话不多，但观察细致。关注边界条件和用户体验，会后可能会单独来找你聊测试的顾虑。</span></div></div>
        </div>
        <p class="mono" style="font-size:10px;opacity:.4;text-align:center;margin:8px 0">对话限 ${sb.maxRounds} 轮 · Demo 阶段</p>
        <button class="quiz-start" data-action="sb-start">开始模拟 →</button>
      </div>`;
  }

  let sbVoiceMode = false;
  let sbShowBrief = false;
  function viewSandboxChat() {
    const done = sb.finished || sb.round >= sb.maxRounds;
    const sc = sb.scenario || {};
    const brief = sbShowBrief ? `
      <div class="sb-brief">
        <div style="font-size:13px;font-weight:700;margin-bottom:6px">📌 任务目标</div>
        <p style="font-size:12px;opacity:.7;line-height:1.6;margin-bottom:8px">${sc.goal || ""}</p>
        <div style="font-size:13px;font-weight:700;margin-bottom:4px">🎯 第一期指标</div>
        ${(sc.phase1?.items || []).slice(0, 3).map(it => `<div style="font-size:11px;opacity:.7;padding:1px 0">· ${it}</div>`).join("")}
        <div style="font-size:13px;font-weight:700;margin:8px 0 4px">📋 PRD 要点</div>
        <div style="font-size:11px;opacity:.7;line-height:1.6">
          范围：${sc.prd?.sections?.[1]?.c?.slice(0, 50) || "TOP 100 FAQ"}...<br>
          技术：RAG + GLM-4，不微调<br>
          周期：6周开发 + 2周测试
        </div>
      </div>` : "";
    return `
      <div class="chat-page">
        <div class="chat-head">
          <button class="chat-end-btn" data-action="sb-brief" style="margin-right:6px">${sbShowBrief ? "收起 ▲" : "任务 📋"}</button>
          <div style="flex:1">
            <div style="font-weight:var(--fw-700)">评审会 · 情景模拟</div>
          </div>
          ${!done ? '<button class="chat-end-btn" data-action="sb-end">结束</button>' : '<button class="chat-end-btn" data-action="sb-evaluate">查看报告</button>'}
        </div>
        ${brief}
        <div class="chat-body" id="sb-body">${sb.msgs.map(sbBubble).join("")}</div>
        ${done ? `
        <div style="padding:var(--sp-md);border-top:1px solid var(--c-hairline);background:var(--c-canvas)">
          <button data-action="sb-evaluate" style="width:100%;height:48px;border:none;border-radius:var(--r-pill);background:var(--c-primary);color:#fff;font-size:16px;font-family:var(--font-sans);cursor:pointer">查看评估报告 →</button>
        </div>` : `
        <div class="chat-input-bar" id="sb-input-bar">
          <div class="kb-mode" id="sb-kb">
            <button class="ib-icon" data-action="sb-toggle-voice" title="语音输入">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
            </button>
            <input class="chat-input" id="sb-input" placeholder="你的回应…" maxlength="300">
            <button class="chat-send" data-action="sb-send">发送</button>
          </div>
          <div class="voice-mode" id="sb-vm" style="display:none">
            <button class="ib-icon" data-action="sb-toggle-kb" title="键盘输入">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="2" y="6" width="20" height="12" rx="2"/><line x1="6" y1="10" x2="6" y2="10.01"/><line x1="10" y1="10" x2="10" y2="10.01"/><line x1="14" y1="10" x2="14" y2="10.01"/><line x1="18" y1="10" x2="18" y2="10.01"/><line x1="7" y1="14" x2="17" y2="14"/></svg>
            </button>
            <div class="hold-to-talk" id="sb-hold">按住说话</div>
          </div>
        </div>`}
      </div>`;
  }

  function sbSetInputMode(mode) {
    const kb = document.getElementById("sb-kb"), vm = document.getElementById("sb-vm");
    if (!kb || !vm) return;
    kb.style.display = mode === "kb" ? "flex" : "none";
    vm.style.display = mode === "voice" ? "flex" : "none";
    sbVoiceMode = mode === "voice";
  }

  let sbRec = null, sbHolding = false;
  function sbHoldStart() {
    if (sbHolding) return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { if (window.__tosToast) window.__tosToast("当前浏览器不支持语音识别"); sbSetInputMode("kb"); return; }
    const btn = document.getElementById("sb-hold");
    try {
      sbRec = new SR(); sbRec.lang = "zh-CN"; sbRec.interimResults = true; sbRec.continuous = true;
      sbRec.onresult = (e) => {
        let t = ""; for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript;
        const inp = document.getElementById("sb-input"); if (inp) inp.value = t;
      };
      sbRec.onend = () => { sbHolding = false; if (btn) { btn.classList.remove("rec"); btn.textContent = "按住说话"; } sbSetInputMode("kb"); };
      sbRec.onerror = () => { sbHolding = false; if (btn) { btn.classList.remove("rec"); btn.textContent = "按住说话"; } };
      sbRec.start(); sbHolding = true;
      if (btn) { btn.classList.add("rec"); btn.textContent = "松开结束"; }
    } catch (e) { sbSetInputMode("kb"); }
  }
  function sbHoldEnd() { if (sbHolding && sbRec) { try { sbRec.stop(); } catch(e){} } }

  function viewSandboxReport() {
    const ev = sb.eval;
    if (!ev) return `<div class="m-center"><p>评估生成中…</p></div>`;
    const dims = ev.dimensions || [];
    const lvToScore = (lv) => Math.round(((lv - 1) / 3) * 88) + 6;
    return `
      <div class="learn-page">
        <div class="report-head">
          <div class="mono" style="font-size:var(--fs-caption);opacity:.5;letter-spacing:.12em">SANDBOX REPORT</div>
          <h2 style="font-size:22px;font-weight:var(--fw-700)">情景模拟评估</h2>
          <div class="page-sub">评审会 · 软技能四构面</div>
        </div>
        <div class="report-block" style="background:var(--c-block-mint);text-align:center;padding:var(--sp-lg)">
          <div class="mono" style="font-size:28px;font-weight:700">${ev.totalScore || 60}</div>
          <div style="font-size:12px;opacity:.6">总分（100分制）</div>
        </div>
        <div class="report-block"><div id="sb-radar" style="height:240px"></div></div>
        ${dims.map(d => {
          const score = lvToScore(d.level);
          const grade = score < 30 ? { t: "欠佳", cls: "g-low" } : score < 70 ? { t: "中等", cls: "g-mid" } : { t: "优秀", cls: "g-high" };
          return `
          <div class="report-block">
            <div class="dim-line1">
              <span class="dim-name">${d.name}</span>
              <span class="mono">${score}分</span>
              <span class="grade ${grade.cls}">${grade.t}</span>
            </div>
            <div class="heat-track small" style="width:100%;height:8px;margin:6px 0 6px">
              <div class="heat-fill ${grade.cls}" style="width:${score}%"></div>
            </div>
            <p style="font-size:13px;line-height:1.6">${d.comment}</p>
            <p style="font-size:12px;opacity:.6;margin-top:4px">💡 ${d.suggestion}</p>
          </div>`;
        }).join("")}
        <div class="report-block profile-card">
          <div class="card-title">总评</div>
          <p style="font-size:13px;line-height:1.7">${ev.overall || ""}</p>
        </div>
        <button class="quiz-start" data-action="back-course">← 返回课程</button>
      </div>`;
  }

  function drawSbRadar() {
    const el = document.getElementById("sb-radar");
    if (!el || !window.echarts || !sb.eval) return;
    const dims = sb.eval.dimensions || [];
    const lvToScore = (lv) => Math.round(((lv - 1) / 3) * 88) + 6;
    const chart = echarts.init(el);
    chart.setOption({
      radar: {
        indicator: dims.map(d => ({ name: d.name, max: 100 })),
        radius: "60%",
        axisName: { color: "#000", fontSize: 11 },
        splitArea: { areaStyle: { color: ["#fff", "#f7f7f5"] } },
        splitLine: { lineStyle: { color: "#e6e6e6" } },
        axisLine: { lineStyle: { color: "#e6e6e6" } },
      },
      tooltip: { trigger: "item" },
      series: [{ type: "radar", data: [{ value: dims.map(d => lvToScore(d.level)), name: "得分",
        areaStyle: { color: "rgba(122,92,196,.25)" }, lineStyle: { color: "#7a5cc4" }, itemStyle: { color: "#7a5cc4" } }] }],
    });
  }

  async function sbStart() {
    sb.sessionId = "sb_" + Date.now().toString(36);
    // 从初聊报告取候选人分数（用于难度分级）
    let candidateScore = 30;
    try {
      const ph = phoneKey();
      const chat = JSON.parse(localStorage.getItem("tos_assess_" + ph) || "{}");
      const rep = JSON.parse(localStorage.getItem("tos_report_" + (chat.sessionId || "")) || "null");
      if (rep && rep.soft) {
        const scores = rep.soft.map(d => (d.scoreRange[0] + d.scoreRange[1]) / 2);
        const raw = scores.reduce((a, b) => a + b, 0) / Math.max(1, scores.length);
        // Level → 百分位（简化：L1=15, L2=35, L3=60, L4=85）
        candidateScore = Math.round(Math.max(5, Math.min(95, ((raw - 1) / 3) * 80 + 10)));
      }
    } catch (e) {}
    try {
      const d = await sbApi("/api/sandbox/start", { sessionId: sb.sessionId, candidateScore });
      sb.scenario = d.scenario; sb.msgs = d.msgs || []; sb.round = d.round || 1; sb.maxRounds = d.maxRounds || 10;
    } catch (e) {
      sb.msgs = [{ role: "dev", name: "张工（研发负责人）", text: "好的，我们开始评审吧。你先介绍一下方案。" }];
      sb.round = 1;
    }
    state.stage = "sandbox-chat";
    $app().innerHTML = viewSandboxChat();
  }

  async function sbSend() {
    if (sb.busy) return;
    const input = document.getElementById("sb-input");
    const text = (input?.value || "").trim();
    if (!text) return;
    if (input) input.value = "";

    // 1. 用户消息立即上屏（不等 AI）
    sb.msgs.push({ role: "user", name: "你", text });
    const body = document.getElementById("sb-body");
    if (body) {
      body.insertAdjacentHTML("beforeend", sbBubble({ role: "user", name: "你", text }));
      body.scrollTop = body.scrollHeight;
    }

    // 2. 显示打字中
    renderTyping(true);
    sb.busy = true;

    // 3. 等 AI 回复
    let prevLen = sb.msgs.length;
    try {
      const d = await sbApi("/api/sandbox/chat", { sessionId: sb.sessionId, text });
      sb.msgs = d.msgs || sb.msgs;
      sb.round = d.round || sb.round;
      sb.finished = d.finished || false;
    } catch (e) {
      sb.msgs.push({ role: "dev", name: "张工", text: "（网络波动，请重试）" });
    }
    sb.busy = false;
    renderTyping(false);

    // 4. 只追加新消息（不整页重渲染）
    if (body) {
      for (let i = prevLen; i < sb.msgs.length; i++) {
        const m = sb.msgs[i];
        if (m.role !== "user") body.insertAdjacentHTML("beforeend", sbBubble(m));
      }
      body.scrollTop = body.scrollHeight;
    }

    // 5. 如果对话结束，切换底部按钮
    if (sb.finished) {
      $app().innerHTML = viewSandboxChat();
      const b2 = document.getElementById("sb-body");
      if (b2) b2.scrollTop = b2.scrollHeight;
    }
  }

  function renderTyping(show) {
    let t = document.getElementById("sb-typing");
    if (!show) { if (t) t.remove(); return; }
    const body = document.getElementById("sb-body");
    if (!body) return;
    t = document.createElement("div");
    t.id = "sb-typing"; t.className = "chat-msg agent";
    t.innerHTML = '<div class="chat-bubble a typing"><span></span><span></span><span></span></div>';
    body.appendChild(t); body.scrollTop = body.scrollHeight;
  }

  async function sbEvaluate() {
    if (state.course && pkg.data?.courses[state.course.id]) {
      pkg.data.courses[state.course.id].drillDone = true; pkg.save();
    }
    state.stage = "sandbox-report";
    $app().innerHTML = viewSandboxReport();
    try {
      const d = await sbApi("/api/sandbox/evaluate", { sessionId: sb.sessionId });
      sb.eval = d;
    } catch (e) {
      sb.eval = { dimensions: [{ code:"CMO-01", name:"沟通表达", level:2, comment:"评估服务暂不可用", suggestion:"请稍后重试" }], overall:"评估生成失败", totalScore:0 };
    }
    // 保存沙盘数据供回看
    try {
      localStorage.setItem("tos_sb_" + phoneKey() + "_" + (state.course?.id || "unknown"), JSON.stringify({
        sessionId: sb.sessionId, msgs: sb.msgs, round: sb.round, eval: sb.eval,
      }));
    } catch (e) {}
    $app().innerHTML = viewSandboxReport();
    drawSbRadar();
  }

  // ---------- 硬技能任务系统 ----------
  const TASKS = {
    C3: {
      title: "Vibe Coding：搭建管理后台原型",
      desc: "使用 HTML/CSS/JS（零依赖）快速搭建一个企业管理后台的静态原型页面。考察你对 AI 产品经理岗位所需的技术理解和产品拆解能力。",
      requirements: [
        "包含「企业账号管理」模块：列表 + 搜索 + 状态标签",
        "包含「订单管理」模块：表格 + 筛选 + 分页占位",
        "整体为侧边栏 + 主内容区布局，风格统一",
      ],
      bonus: [
        "加入数据统计卡片（今日订单/活跃用户/营收等）",
        "实现简单的搜索或筛选交互（纯前端即可）",
        "响应式适配（960px 以下折叠侧栏）",
      ],
      deliverable: "一个 .html 文件（内联 CSS/JS，不依赖外部库）",
      deadline: "24 小时内提交",
      penalty: 0.8,
    },
    C4: {
      title: "评测集设计实战",
      desc: "为「智能客服」功能设计一套评测集，并撰写设计说明。考察你对 AI 功能验收方法论的理解。",
      requirements: [
        "20 条评测用例（含正常/边界/异常场景）",
        "标注每条用例考察的能力维度",
        "说明覆盖逻辑（为什么这 20 条能代表整体质量）",
      ],
      bonus: [
        "附带 5 个 badcase 示例及归因分析",
        "设计一套简单的评分标准（0-2 分制）",
      ],
      deliverable: "一份 .md 或 .xlsx 文件",
      deadline: "24 小时内提交",
      penalty: 0.8,
    },
  };

  const task = { started: false, startAt: null, submitted: false, eval: null, late: false };

  function viewTask() {
    const c = state.course;
    const t = TASKS[c.id] || TASKS.C3;
    if (task.eval) return viewTaskResult(t);
    return `
      <div class="learn-page">
        <button class="m-btn-back" style="margin:0 0 var(--sp-md)" data-action="back-course">← 返回课程</button>
        <div class="sec-tag st-hard">实战任务 <span>硬技能检验</span></div>
        <div class="report-block">
          <div class="card-title">${t.title}</div>
          <p style="font-size:13px;opacity:.75;line-height:1.7">${t.desc}</p>
        </div>
        <div class="report-block">
          <div class="card-title">任务要求</div>
          ${t.requirements.map((r, i) => `<div class="chapter-row"><span class="chapter-check">${i + 1}</span><span style="font-size:13px">${r}</span></div>`).join("")}
        </div>
        <div class="report-block">
          <div class="card-title">加分项 <span class="mono" style="font-size:10px;font-weight:400;color:var(--c-success)">选做</span></div>
          ${t.bonus.map((b, i) => `<div class="chapter-row"><span class="chapter-check" style="background:var(--c-block-mint);border:none;color:var(--c-ink)">+</span><span style="font-size:13px">${b}</span></div>`).join("")}
        </div>
        <div class="report-block" style="background:var(--c-block-cream)">
          <div class="mono" style="font-size:12px;line-height:1.8">
            📦 交付物：${t.deliverable}<br>
            ⏰ 截止：${t.deadline}<br>
            ⚠️ 逾期提交按 ${Math.round((1 - t.penalty) * 100)}% 计分
          </div>
        </div>
        ${!task.started
          ? `<button class="quiz-start" data-action="task-start">接受任务，开始 →</button>`
          : `<button class="quiz-start" data-action="task-submit" style="background:var(--c-success)">提交作业 ✓</button>
             <p class="mono" style="font-size:10px;opacity:.4;text-align:center;margin-top:8px">上传 .html / .md / .xlsx 文件（演示占位）</p>`
        }
      </div>`;
  }

  function viewTaskResult(t) {
    const ev = task.eval;
    return `
      <div class="learn-page">
        <button class="m-btn-back" style="margin:0 0 var(--sp-md)" data-action="back-course">← 返回课程</button>
        <div class="sec-tag st-hard">任务评估</div>
        <div class="report-block" style="background:${task.late ? "var(--c-block-coral)" : "var(--c-block-mint)"};text-align:center;padding:var(--sp-lg)">
          <div class="mono" style="font-size:28px;font-weight:700">${ev.score}</div>
          <div style="font-size:12px;opacity:.6">${task.late ? "逾期提交（已按" + Math.round((1 - t.penalty) * 100) + "%折算）" : "按时提交"}</div>
        </div>
        ${ev.dimensions ? ev.dimensions.map(d => `
        <div class="report-block">
          <div class="dim-line1"><span class="dim-name">${d.name}</span><span class="mono">${d.score}分</span></div>
          <p style="font-size:13px;line-height:1.6">${d.comment}</p>
        </div>`).join("") : ""}
        <div class="report-block profile-card">
          <div class="card-title">总评</div>
          <p style="font-size:13px;line-height:1.7">${ev.comment || ""}</p>
        </div>
        <button class="quiz-start" data-action="back-course">← 返回课程</button>
      </div>`;
  }

  return { pkg, state, render, handle, MENTORS, COURSE_LIB, MISSIONS, QUIZ_BANK, sb, viewSandboxIntro, viewSandboxChat, viewSandboxReport, sbStart, sbSend, sbEvaluate, sbSetInputMode, sbHoldStart, sbHoldEnd, task, TASKS, viewTask, pt, ptHoldStart, ptHoldEnd, ptToggle };
})();
