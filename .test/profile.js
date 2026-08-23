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
