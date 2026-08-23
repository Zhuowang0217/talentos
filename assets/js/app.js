/* ============================================================
   TalentOS 视图渲染（双端结构）
   学生端：#/pretest /#/learn /#/tutor /#/sandbox /#/report
   教师端：#/admin（看板） #/admin/projects（列表）
          #/admin/projects/new（新建向导） #/admin/projects/P1（详情）
   同一部署、两个入口、共享数据层 —— 教师建的项目即学生看到的课
   ============================================================ */
(function () {
  const D = window.TOS_DATA;
  const A = window.TOS_ADMIN;

  /* ---------- 路由解析 ---------- */
  function resolve() {
    const seg = (location.hash || "#/pretest").replace("#/", "").split("/").filter(Boolean);
    if (seg[0] === "admin") {
      if (!seg[1]) return { mode: "teacher", page: "dashboard" };
      if (seg[1] === "projects") {
        if (!seg[2]) return { mode: "teacher", page: "projects" };
        if (seg[2] === "new") return { mode: "teacher", page: "wizard" };
        return { mode: "teacher", page: "detail", id: seg[2] };
      }
      return { mode: "teacher", page: "dashboard" };
    }
    const valid = ["pretest", "learn", "tutor", "sandbox", "report"];
    return { mode: "student", page: valid.includes(seg[0]) ? seg[0] : "pretest" };
  }

  /* ---------- 学生端配置 ---------- */
  const STUDENT_STEPS = [
    { hash: "pretest", label: "前测", identity: "--c-block-mint" },
    { hash: "learn", label: "学习", identity: "--c-block-lime" },
    { hash: "tutor", label: "AI 导师", identity: "--c-block-lilac" },
    { hash: "sandbox", label: "沙盘演练", identity: "navy" },
    { hash: "report", label: "成长报告", identity: "--c-block-mint" },
  ];
  const STUDENT_ROUTES = {
    pretest: { title: "前测 · 能力基线", desc: "能力基线测评：五域能力雷达 + 对标岗位标准的差距分析，生成你的定制化培训包" },
    learn: { title: "学习首页 · 培训包", desc: "李老师配置的必修课 + 按兴趣探索的选修课 + 今日任务卡" },
    tutor: { title: "AI 导师 · 实时答疑", desc: "AI 导师 7×24 实时答疑：不直接给答案，用追问引导你找到答案" },
    sandbox: { title: "沙盘演练 · 虚拟项目组", desc: "虚拟项目组：CEO/客户/算法/法务由 AI 扮演，" + D.meta.caseSource },
    report: { title: "成长报告 · 后测", desc: "后测成长报告：前后对比 + 成长曲线 + 每一分都可点开证据" },
  };
  function identityColor(identity) {
    return identity === "navy" ? "var(--c-block-navy)" : `var(${identity})`;
  }

  /* ---------- 向导状态 ---------- */
  const wizard = { step: 1, name: "", generated: false, draft: null, created: false };

  /* ---------- 通用片段 ---------- */
  function hero(route) {
    const isNavy = route.identity === "navy";
    const bg = isNavy ? "var(--c-block-navy)" : `var(${route.identity})`;
    const color = isNavy ? "var(--c-inverse-ink)" : "var(--c-ink)";
    return `
      <div class="view-hero" style="background:${bg};color:${color}">
        <div class="eyebrow">${isNavy ? "SCENARIO LAB" : "TALENT OS"}</div>
        <h1>${route.title}</h1>
        <p>${route.desc || ""}</p>
      </div>`;
  }

  /* ================= 学生端视图 ================= */
  const studentViews = {
    pretest() {
      const p = D.studentProfile;
      return `
        <div class="grid grid-3">
          <div class="card"><div class="card-title">能力雷达基线</div><p class="placeholder-note">M2：ECharts 雷达图（五域基线 vs 岗位标准）</p></div>
          <div class="card"><div class="card-title">岗位差距分析</div><p>${p.gapSummary}</p><p class="placeholder-note">M2：差距排序与定向建议</p></div>
          <div class="card"><div class="card-title">画像标签</div><p>${p.tags.join(" · ")}</p><p class="placeholder-note">M2：四画像定位说明</p></div>
        </div>`;
    },
    learn() {
      const pk = D.trainingPackages;
      return `
        <div class="section-title">必修（${D.meta.teacher.name} 老师配置）</div>
        <div class="grid grid-2">
          ${pk.required.map(r => `
            <div class="card"><div class="card-title">${r.title}</div>
              <p>配置人：${r.assignedBy} · ${r.lessons} 讲 · 关联能力域：${r.linkedDomains.join("/")}</p></div>`).join("")}
        </div>
        <div class="section-title" style="margin-top:var(--sp-xl)">选修（自主探索）</div>
        <div class="grid grid-3">
          ${pk.elective.map(e => `
            <div class="card-soft"><div class="card-title">${e.title}</div>
              <p>关联：${e.linkedDomains.join("/")}</p></div>`).join("")}
        </div>`;
    },
    tutor() {
      return `
        <div class="chat-wrap">
          <div class="chat-bubble user">导师你好，我现在学到评测集设计，不太明白为什么要先写"坏例子"。</div>
          <div class="chat-bubble agent">
            <span class="agent-chip" style="background:var(--c-block-lilac)">AI 导师</span><br>
            先不急着定义——如果让你判断一个客服机器人"答得好不好"，你会先准备什么材料？
          </div>
          <p class="placeholder-note">M3：苏格拉底式分支对话脚本（含打字机效果与追问链）</p>
        </div>`;
    },
    sandbox() {
      return `
        <div style="background:var(--c-block-navy);color:var(--c-inverse-ink);border-radius:var(--r-xl);padding:var(--sp-xl)">
          <div class="agent-chip" style="background:var(--c-block-coral)">CEO</div>
          <div class="chat-bubble dark">张同学，智能客服升级这个事，董事会只给三个月，你要先告诉我：第一期到底解决什么、不解决什么。</div>
          <p class="placeholder-note" style="color:rgba(255,255,255,.5)">M3：多 Agent 剧本（CEO/客户方/算法工程师/法务合规）+ 客户 Agent 真 AI 实时回话（magenta 标识）</p>
        </div>`;
    },
    report() {
      const g = D.growthReport;
      return `
        <div class="grid grid-2">
          <div class="card"><div class="card-title">前后测对比雷达</div>
            <p class="mono">前测 ${Object.values(D.studentProfile.baseline).join(" / ")}</p>
            <p class="mono">后测 ${Object.values(g.post).join(" / ")}</p>
            <p class="placeholder-note">M5：ECharts 对比雷达 + 成长曲线 + 证据链点开</p></div>
          <div class="card"><div class="card-title">证据链</div>
            <p class="placeholder-note">M5：每项得分可点开看出处（演练产出/对话片段）</p></div>
        </div>`;
    },
  };

  /* ================= 教师端视图 ================= */
  const teacherViews = {

    dashboard() {
      const t = A.todos.map(todoTemplate).join("");
      const heat = A.heatmap.map(h => `
        <div class="heat-row">
          <span class="heat-name">${h.domain}</span>
          <div class="heat-track">
            <div class="heat-fill" style="width:${(h.avg / 4) * 100}%"></div>
            <div class="heat-std" style="left:${(h.std / 4) * 100}%" title="岗位标准 ${h.std}"></div>
          </div>
          <span class="mono heat-val">${h.avg.toFixed(1)}</span>
        </div>`).join("");
      return `
        <div class="page-head"><h1>数据看板</h1><span class="page-sub">${A.teacher.name} · ${A.teacher.role}</span></div>
        <div class="grid grid-4 stat-row">
          ${statTile("进行中项目", A.stats.activeProjects)}
          ${statTile("学员总数", A.stats.totalStudents)}
          ${statTile("本周活跃率", A.stats.weekActiveRate)}
          ${statTile("任务完成率", A.stats.taskCompletion)}
        </div>
        <div class="grid grid-2" style="margin-top:var(--sp-lg);align-items:start">
          <div class="card">
            <div class="card-title">待办中心 <span class="mono">TODO</span></div>
            ${t}
          </div>
          <div style="display:flex;flex-direction:column;gap:var(--sp-lg)">
            <div class="card">
              <div class="card-title">班级能力热力图 <span class="mono">vs 岗位标准</span></div>
              ${heat}
              <p class="page-sub" style="margin-top:var(--sp-sm)">▍薄弱域：AI 产品专项、行业数智化 —— 建议下阶段加强（改进回路）</p>
            </div>
            <div class="card">
              <div class="card-title">动态</div>
              ${A.dynamics.map(d => `<div class="dyn-item"><span class="mono">${d.time}</span> ${d.text}</div>`).join("")}
            </div>
          </div>
        </div>`;
    },

    projects() {
      const list = A.projects.map(p => `
        <div class="card project-card" data-action="open-project" data-id="${p.id}">
          <div class="project-head">
            <div class="card-title">${p.name}</div>
            <span class="status-chip ${p.status === "进行中" ? "running" : "done"}">${p.status}</span>
          </div>
          <p>面向岗位：${p.job}</p>
          <p class="page-sub">${p.source}</p>
          <div class="project-meta mono">
            学员 ${p.students} · 第 ${p.week}/${p.totalWeeks} 周 · 完成 ${p.completion}
          </div>
        </div>`).join("");
      return `
        <div class="page-head">
          <h1>项目管理</h1>
          <button class="btn btn-primary" data-action="new-project">＋ 新建项目</button>
        </div>
        <div class="grid grid-2">${list}</div>`;
    },

    wizard() {
      const steps = ["基本信息", "配置课程", "添加学员", "发布前测"];
      const stepBar = steps.map((s, i) => `
        <div class="wizard-step ${wizard.step === i + 1 ? "on" : ""} ${wizard.step > i + 1 ? "past" : ""}">
          <span class="mono">0${i + 1}</span> ${s}
        </div>`).join("");
      return `
        <div class="page-head"><h1>新建培养项目</h1><span class="page-sub">AI 做生产 · 教师做编排</span></div>
        <div class="wizard-bar">${stepBar}</div>
        <div class="card">${wizardBody()}</div>
        <div class="wizard-nav">
          ${wizard.step > 1 ? '<button class="btn btn-secondary" data-action="wizard-prev">上一步</button>' : ""}
          ${wizard.step < 4 ? '<button class="btn btn-primary" data-action="wizard-next">下一步</button>' : ""}
          ${wizard.step === 4 ? '<button class="btn btn-primary" data-action="wizard-finish">创建项目</button>' : ""}
        </div>`;
    },

    detail(id) {
      const p = A.projects.find(x => x.id === id) || A.projects[0];
      const tab = window.__detailTab || "students";
      const tabs = [
        { key: "students", label: "学员情况" },
        { key: "courses", label: "课程配置" },
        { key: "review", label: "成果与评价" },
      ].map(t => `<button class="view-tab ${tab === t.key ? "selected" : ""}" data-action="detail-tab" data-tab="${t.key}">${t.label}</button>`).join("");
      return `
        <div class="page-head">
          <div>
            <h1>${p.name}</h1>
            <span class="page-sub">面向岗位：${p.job} · ${p.source}</span>
          </div>
          <span class="status-chip running">${p.status}</span>
        </div>
        <div class="view-tabs">${tabs}</div>
        ${tab === "students" ? detailStudents() : tab === "courses" ? detailCourses(p) : detailReview()}`;
    },
  };

  function detailStudents() {
    const rows = A.students.map(s => `
      <tr>
        <td><b>${s.name}</b></td>
        <td class="mono">${s.radar.map(v => v.toFixed(1)).join(" / ")}</td>
        <td>
          <div class="heat-track small"><div class="heat-fill" style="width:${s.progress}%"></div></div>
          <span class="mono">${s.progress}%</span>
        </td>
        <td class="mono">${s.active}</td>
        <td class="mono" style="color:var(--c-success)">${s.trend}</td>
        <td>${s.risk ? `<span class="risk-tag">${s.risk}</span>` : "—"}</td>
      </tr>`).join("");
    return `
      <div class="card" style="padding:0">
        <table class="table">
          <thead><tr><th>学员</th><th>五域雷达</th><th>学习进度</th><th>最近活跃</th><th>成长</th><th>风险标记</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <p class="page-sub" style="margin-top:var(--sp-sm)">风险标记来自 AI 导师上抛（干预回路），点击学员可看对话摘要与时间线（下一迭代）</p>`;
  }

  function detailCourses(p) {
    return `
      <div class="grid grid-2">
        <div class="card">
          <div class="card-title">必修课（${D.meta.teacher.name} 配置）</div>
          ${A.courseDraft.required.map(c => `
            <div class="dyn-item"><b>${c.title}</b><span class="page-sub"> · ${c.domains}</span></div>`).join("")}
        </div>
        <div class="card">
          <div class="card-title">选修池与沙盘</div>
          ${A.courseDraft.elective.map(e => `<div class="dyn-item">${e}</div>`).join("")}
          <div class="dyn-item"><b>沙盘：</b>${A.courseDraft.sandbox}</div>
          <div class="dyn-item"><b>前测：</b>${A.courseDraft.pretest}</div>
        </div>
      </div>`;
  }

  function detailReview() {
    const rows = A.reviewQueue.map(r => `
      <div class="review-item">
        <div class="review-main">
          <b>${r.student}</b> · ${r.work}
          <span class="mono ai-score">${r.aiScore}</span>
          <p class="page-sub">${r.basis}</p>
        </div>
        <div class="review-acts">
          <button class="btn btn-primary">通过</button>
          <button class="btn btn-secondary">调整</button>
        </div>
      </div>`).join("");
    return `
      <div class="card"><div class="card-title">待终审队列 <span class="mono">AI 已预批改 · 教师终审</span></div>${rows}</div>
      <p class="page-sub" style="margin-top:var(--sp-sm)">终审即生效：分数挂证据链进入学生成长报告（评价回路）</p>`;
  }

  /* ---------- 向导步骤内容 ---------- */
  function wizardBody() {
    if (wizard.step === 1) {
      return `
        <div class="form-row"><label>项目名称</label><input class="text-input" id="wiz-name" placeholder="如：2026 秋 · AI 产品经理微专业" value="${wizard.name}"></div>
        <div class="form-row"><label>面向岗位（决定能力图谱）</label>
          <div class="job-select" data-action="noop">
            <span class="job-tag selected">AI 产品经理（企业服务方向）</span>
            <span class="job-tag">数智商业运营</span>
            <span class="job-tag">数据分析师</span>
          </div>
          <p class="page-sub">岗位模板来自企业 JD 大数据分析 —— 选定即加载该岗位的能力图谱（从人才能力要求出发）</p>
        </div>`;
    }
    if (wizard.step === 2) {
      if (!wizard.generated) {
        return `
          <div class="gen-box">
            <p>AI 将基于「AI 产品经理（企业服务方向）」能力图谱 × 16 周学期，生成课程包草案。</p>
            <button class="btn btn-primary" data-action="wizard-generate">⚡ 生成课程包草案</button>
          </div>`;
      }
      const c = A.courseDraft;
      return `
        <p class="page-sub">${c.meta} —— 你可以调整后定稿（AI 出稿 · 教师定稿）</p>
        <div class="grid grid-2" style="margin-top:var(--sp-md)">
          <div>
            <div class="card-title">必修课草案</div>
            ${c.required.map((r, i) => `
              <label class="dyn-item course-row">
                <input type="checkbox" data-course="${i}" ${r.keep ? "checked" : ""} ${wizard.step > 2 ? "disabled" : ""}>
                <span>${r.title}<span class="page-sub"> · ${r.domains}</span>${r.edited ? '<span class="mono edited-tag">教师已调整</span>' : ""}</span>
              </label>`).join("")}
          </div>
          <div>
            <div class="card-title">选修池 / 沙盘 / 前测</div>
            ${c.elective.map(e => `<div class="dyn-item">${e}</div>`).join("")}
            <div class="dyn-item"><b>沙盘：</b>${c.sandbox}</div>
            <div class="dyn-item"><b>前测：</b>${c.pretest}</div>
          </div>
        </div>`;
    }
    if (wizard.step === 3) {
      return `
        <div class="gen-box">
          <p><b>方式一：</b>批量导入名单（Excel 模板下载）</p>
          <p><b>方式二：</b>邀请码入班 —— 学员访问链接并输入邀请码：</p>
          <div class="invite-code mono">TOS-2026-PM01</div>
          <p class="page-sub">演示项目：已预置 32 名学员（江州学院 · 信息管理学院 2023 级）</p>
        </div>`;
    }
    return `
      <div class="gen-box">
        <p>发布前测后，学员完成「AI PM 岗位能力基线测评」，系统生成班级基线报告，你可据此微调课程。</p>
        <p class="page-sub">闭环：前测 → 定制培训包（必修/选修/沙盘）→ AI 导师答疑 → 后测 → 证据链报告</p>
      </div>`;
  }

  /* ---------- 小组件模板 ---------- */
  function statTile(label, value) {
    return `<div class="card stat-tile"><span class="page-sub">${label}</span><span class="stat-val">${value}</span></div>`;
  }
  function todoTemplate(t) {
    const icon = { review: "审", signal: "预", content: "更" }[t.type] || "·";
    const levelCls = t.level === "high" ? "high" : t.level === "mid" ? "mid" : "";
    return `
      <div class="todo-item ${levelCls}">
        <span class="todo-icon">${icon}</span>
        <div><b>${t.text}</b><p class="page-sub">${t.meta}</p></div>
      </div>`;
  }

  /* ---------- 侧栏与渲染 ---------- */
  function renderSidebar(state) {
    if (state.mode === "teacher") {
      const active = { dashboard: "admin", projects: "admin/projects", wizard: "admin/projects/new", detail: "admin/projects" }[state.page];
      return `
        <a class="sidebar-item ${active === "admin" ? "active" : ""}" href="#/admin">
          <span class="dot" style="background:var(--c-block-lilac)"></span>数据看板
        </a>
        <a class="sidebar-item ${active === "admin/projects" ? "active" : ""}" href="#/admin/projects">
          <span class="dot" style="background:var(--c-block-lilac)"></span>项目管理
        </a>`;
    }
    return STUDENT_STEPS.map((s, i) => `
      <a class="sidebar-item ${s.hash === state.page ? "active" : ""}" href="#/${s.hash}">
        <span class="dot" style="background:${identityColor(s.identity)}"></span>${s.label}
        <span class="step-no">0${i + 1}</span>
      </a>`).join("");
  }

  function render() {
    const state = resolve();
    const sidebar = document.getElementById("sidebar");
    const view = document.getElementById("view");
    sidebar.innerHTML = renderSidebar(state);
    document.getElementById("mode-teacher").classList.toggle("selected", state.mode === "teacher");
    document.getElementById("mode-student").classList.toggle("selected", state.mode === "student");
    document.getElementById("user-chip").textContent = state.mode === "teacher"
      ? `${A.teacher.name} · ${A.teacher.role.split(" · ")[0]}`
      : `${D.meta.student.name} · ${D.meta.student.grade}${D.meta.student.major.replace("信息管理与信息系统", "信管")}`;

    if (state.mode === "teacher") {
      view.className = "content admin";
      view.innerHTML = state.page === "dashboard" ? teacherViews.dashboard()
        : state.page === "projects" ? teacherViews.projects()
        : state.page === "wizard" ? teacherViews.wizard()
        : teacherViews.detail(state.id);
    } else {
      const route = { ...STUDENT_ROUTES[state.page], identity: (STUDENT_STEPS.find(s => s.hash === state.page) || {}).identity };
      view.className = "content";
      view.innerHTML = hero(route) + (studentViews[state.page] ? studentViews[state.page]() : "");
    }
  }

  /* ---------- 事件委托 ---------- */
  document.addEventListener("click", (e) => {
    const el = e.target.closest("[data-action]");
    if (!el) return;
    const act = el.dataset.action;

    if (act === "mode-teacher") { location.hash = "#/admin"; return; }
    if (act === "mode-student") { location.hash = "#/pretest"; return; }
    if (act === "new-project") { wizard.step = 1; wizard.generated = false; location.hash = "#/admin/projects/new"; return; }
    if (act === "open-project") { location.hash = "#/admin/projects/" + el.dataset.id; return; }
    if (act === "wizard-prev") { wizard.step = Math.max(1, wizard.step - 1); render(); return; }
    if (act === "wizard-next") {
      if (wizard.step === 1) {
        const nameInput = document.getElementById("wiz-name");
        if (nameInput && nameInput.value.trim()) wizard.name = nameInput.value.trim();
      }
      wizard.step = Math.min(4, wizard.step + 1); render(); return;
    }
    if (act === "wizard-generate") {
      wizard.generated = true;
      el.textContent = "生成中…";
      setTimeout(render, 600);
      return;
    }
    if (act === "wizard-finish") {
      const name = wizard.name || "2026 秋 · AI 产品经理微专业";
      A.projects.unshift({
        id: "P" + (A.projects.length + 1), name, status: "筹备中",
        students: 32, week: 0, totalWeeks: 16, completion: "0%",
        job: "AI 产品经理（企业服务方向）", source: "沙盘场景改编自某连锁零售集团真实项目（已脱敏）",
      });
      wizard.step = 1; wizard.generated = false;
      location.hash = "#/admin/projects";
      return;
    }
    if (act === "detail-tab") { window.__detailTab = el.dataset.tab; render(); return; }
  });

  document.addEventListener("DOMContentLoaded", () => {
    if (!location.hash) location.hash = "#/pretest";
    window.addEventListener("hashchange", render);
    render();
  });
})();
