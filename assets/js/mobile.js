/* ============================================================
   TalentOS 移动端（候选人端 H5）
   路由：#/login（默认） #/success #/no-permission
   权限真实逻辑 = 白名单判断（WHITELIST）
   演示分支选择（随登录二次弹窗出现）= 外挂测试装置，只决定演示
   走哪条分支，不写入、不影响真实权限逻辑
   ============================================================ */
(function () {
  const WHITELIST = ["13800000001", "13800000002", "13800000003"]; // 真实权限名单（mock）
  const STORE_KEY = "tos_demo_no_perm_records";                    // "后台记录"（localStorage 模拟）
  const LAST_PHONE_KEY = "tos_demo_last_phone";
  const RED_NOTE = "本页面只做 demo 阶段有无权限分支选择，不是真正的页面";

  let modalBranch = "granted"; // 弹窗内当前选中的演示分支

  const $app = () => document.getElementById("app");
  const maskPhone = p => p.slice(0, 3) + "****" + p.slice(7);

  function route() {
    const h = (location.hash || "#/login").replace("#/", "");
    return ["login", "success", "no-permission", "chat", "report", "onboard", "station", "list", "course", "mission"].includes(h.split("/")[0]) ? h : "login";
  }

  /* ---------- M3 首测对话与报告 ---------- */
  const API = (location.hostname === "localhost" || location.hostname === "127.0.0.1")
    ? "http://localhost:3090" : ""; /* 生产=同源，nginx 反代 /api → 后端 */
  /* 账号隔离（2026-08-22 修复）：候选人状态一律按手机号分仓存储，
     换号登录自动进入全新初聊流程，互不可见 */
  const phoneKey = () => localStorage.getItem(LAST_PHONE_KEY) || "anon";
  const chatStoreKey = () => "tos_assess_" + phoneKey();
  const chat = {
    sessionId: null, msgs: [], busy: false, topic: "", canEnd: false,
    load() {
      const s = JSON.parse(localStorage.getItem(chatStoreKey()) || "null");
      if (s) { this.sessionId = s.sessionId; this.msgs = s.msgs || []; this.topic = s.topic || ""; this.canEnd = !!s.canEnd; this.done = !!s.done; }
      else { this.sessionId = "s_" + Date.now().toString(36); this.save(); }
    },
    save() { localStorage.setItem(chatStoreKey(), JSON.stringify({ sessionId: this.sessionId, msgs: this.msgs, topic: this.topic, canEnd: this.canEnd, done: this.done })); },
  };

  async function api(path, body) {
    const res = await fetch(API + path, {
      method: body ? "POST" : "GET",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: body ? JSON.stringify(body) : undefined,
    });
    return res.json();
  }

  function chatBubbleHtml(m) {
    if (m.role === "user") return `<div class="chat-msg user"><div class="chat-bubble m">${m.text}</div></div>`;
    return `<div class="chat-msg agent">
      <span class="agent-chip" style="background:var(--c-block-lilac)">陪练官</span>
      <div class="chat-bubble a">${m.text.replace(/\n/g, "<br>")}</div></div>`;
  }

  function renderChatView() {
    $app().innerHTML = `
      <div class="chat-page">
        <div class="chat-head">
          <div>
            <div style="font-weight:var(--fw-700)">能力初聊</div>
            <div class="mono" style="font-size:var(--fs-caption);opacity:.6">${chat.topic ? "话题：" + chat.topic : "陪练官 · 3-5 分钟"}</div>
          </div>
          ${chat.done ? '<span class="mono" style="font-size:var(--fs-caption);opacity:.5;padding:4px 10px;border:1px solid var(--c-hairline);border-radius:var(--r-pill)">已结束</span>' : '<button class="chat-end-btn" data-action="end-chat">结束初聊</button>'}
        </div>
        ${chat.done ? "" : '<div class="demo-note">本轮设计思路处于 Demo 阶段，尚缺长模及题目调优等相关内容，智能感可能稍弱，需后续迭代。</div>'}
        <div class="chat-body" id="chat-body"></div>
        ${chat.done ? `
        <div style="padding:var(--sp-md) var(--sp-lg);border-top:1px solid var(--c-hairline);background:var(--c-canvas)">
          <button data-action="go-report" style="width:100%;height:48px;border:none;border-radius:var(--r-pill);background:var(--c-primary);color:#fff;font-size:16px;font-weight:480;font-family:var(--font-sans);cursor:pointer">返回报告</button>
        </div>` : `
        <div class="chat-input-bar" id="input-bar">
          <div class="kb-mode" id="kb-mode">
            <button class="ib-icon" data-action="toggle-voice" title="切换语音">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
            </button>
            <input class="chat-input" id="chat-input" placeholder="说说你的想法…" maxlength="300">
            <button class="chat-send" data-action="send-msg">发送</button>
          </div>
          <div class="voice-mode" id="voice-mode" style="display:none">
            <button class="ib-icon" data-action="toggle-kb" title="切换键盘">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="2" y="6" width="20" height="12" rx="2"/><line x1="6" y1="10" x2="6" y2="10.01"/><line x1="10" y1="10" x2="10" y2="10.01"/><line x1="14" y1="10" x2="14" y2="10.01"/><line x1="18" y1="10" x2="18" y2="10.01"/><line x1="7" y1="14" x2="17" y2="14"/></svg>
            </button>
            <div class="hold-to-talk" id="hold-talk">按住说话</div>
          </div>
        </div>
        `}
      </div>`;
    const body = document.getElementById("chat-body");
    body.innerHTML = chat.msgs.map(chatBubbleHtml).join("") || "";
    renderTyping(false);
    scrollChat();
  }

  function scrollChat() {
    const body = document.getElementById("chat-body");
    if (body) body.scrollTop = body.scrollHeight;
  }

  function renderTyping(show) {
    let t = document.getElementById("typing");
    if (!show) { if (t) t.remove(); return; }
    if (t) return;
    const body = document.getElementById("chat-body");
    if (!body) return;
    t = document.createElement("div");
    t.id = "typing";
    t.className = "chat-msg agent";
    t.innerHTML = `<div class="chat-bubble a typing"><span></span><span></span><span></span></div>`;
    body.appendChild(t);
    scrollChat();
  }

  async function initChat() {
    chat.load();
    // 连接失败的报错气泡不保留——避免卡死会话，重进时重新初始化
    if (chat.msgs.length && chat.msgs.every(m => m.role === "agent" && /连接不上|网络波动/.test(m.text))) {
      chat.msgs = []; chat.save();
    }
    if (chat.msgs.length === 0) {
      renderTyping(true);
      try {
        const d = await api("/api/chat", { sessionId: chat.sessionId, init: true });
        chat.msgs.push({ role: "agent", text: d.reply });
        chat.topic = d.topic || "";
        chat.save();
      } catch (e) {
        chat.msgs.push({ role: "agent", text: "（连接不上陪练官服务，请确认后端已启动：node server/index.js）" });
      }
    }
    renderChatView();
  }

  async function sendMsg() {
    if (chat.busy) return;
    const input = document.getElementById("chat-input");
    const text = (input.value || "").trim();
    if (!text) return;
    input.value = "";
    chat.msgs.push({ role: "user", text });
    chat.save();
    document.getElementById("chat-body").insertAdjacentHTML("beforeend", chatBubbleHtml(chat.msgs[chat.msgs.length - 1]));
    scrollChat();
    chat.busy = true;
    renderTyping(true);
    try {
      const d = await api("/api/chat", { sessionId: chat.sessionId, text });
      chat.msgs.push({ role: "agent", text: d.reply });
      if (d.topic) chat.topic = d.topic;
      if (d.canEnd) chat.canEnd = true;
      chat.save();
    } catch (e) {
      chat.msgs.push({ role: "agent", text: "（网络波动，请再发一次）" });
    }
    chat.busy = false;
    renderChatView();
  }

  /* ---------- 输入栏两模式（微信式）：键盘 ⇄ 按住说话 ---------- */
  function setChatInputMode(mode) {
    const kb = document.getElementById("kb-mode");
    const vm = document.getElementById("voice-mode");
    if (!kb || !vm) return;
    kb.style.display = mode === "kb" ? "flex" : "none";
    vm.style.display = mode === "voice" ? "flex" : "none";
  }

  /* ---------- 语音识别（Web Speech 原生，长按持续录音，松手转文字上屏） ---------- */
  let voiceRec = null, voiceHolding = false;
  function holdTalkStart() {
    if (voiceHolding) return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { toast("当前浏览器不支持语音识别，请使用键盘输入", true); setChatInputMode("kb"); return; }
    const btn = document.getElementById("hold-talk");
    try {
      voiceRec = new SR();
      voiceRec.lang = "zh-CN";
      voiceRec.interimResults = true;
      voiceRec.continuous = true;
      voiceRec.onresult = (e) => {
        let t = "";
        for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript;
        const input = document.getElementById("chat-input");
        if (input) input.value = t;
      };
      voiceRec.onend = () => {
        voiceHolding = false;
        btn && btn.classList.remove("rec");
        btn && (btn.textContent = "按住说话");
        setChatInputMode("kb"); // 松手后带着转写文字回到键盘模式，可编辑再发送
      };
      voiceRec.onerror = () => {
        voiceHolding = false;
        btn && btn.classList.remove("rec");
        btn && (btn.textContent = "按住说话");
        toast("语音识别失败（需麦克风权限及网络）", true);
      };
      voiceRec.start();
      voiceHolding = true;
      btn && btn.classList.add("rec");
      btn && (btn.textContent = "松开结束 · 正在聆听");
    } catch (e) { toast("语音启动失败，请改用键盘", true); setChatInputMode("kb"); }
  }
  function holdTalkEnd() {
    if (!voiceHolding || !voiceRec) return;
    try { voiceRec.stop(); } catch (e) { /* ignore */ }
  }

  /* ---------- 报告页 ---------- */
  function confLabel(c) { return c === "high" ? "高置信" : c === "mid" ? "中置信" : "低置信·待任务验证"; }

  function renderReportView(d) {
    const soft = d.soft || [], hard = d.hard || [], pending = d.hardPending || [];
    const hi = d.highlights || [], im = d.improvements || [];
    /* 百分位算法（2026-08-22 用户定，详见产品设计文档 5.6）：
       原始分=等级映射0-1（L1=0,L4=1,区间取中值）→ 标准分 z=(原始分-μ)/σ → 正态CDF×100
       演示常模假设：学生群体原始分 ~ N(0.40, 0.23²)；常模参数接入真实数据后替换 */
    const NORM_MU = 0.40, NORM_SD = 0.23;
    function normCdf(z) {
      const t = 1 / (1 + 0.2316419 * Math.abs(z));
      const d = 0.3989423 * Math.exp(-z * z / 2);
      const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
      return z > 0 ? 1 - p : p;
    }
    const pctOf = (r) => Math.max(1, Math.min(99, Math.round(normCdf((((r[0] + r[1]) / 2 - 1) / 3 - NORM_MU) / NORM_SD) * 100)));
    /* 特判（用户指定）：维度无证据样本（未说话/未触及）→ 百分位强写 0% */
    const hasEvidence = (x) => Array.isArray(x.evidence) && x.evidence.some(e => (e || "").trim());
    const gradeOf = (p) => p < 30 ? { t: "待提升", cls: "g-low" } : p < 70 ? { t: "中等", cls: "g-mid" } : { t: "优秀", cls: "g-high" };
    const dimRow = (x, color) => {
      const p = hasEvidence(x) ? pctOf(x.scoreRange) : 0, g = gradeOf(p);
      return `
      <div class="dim-row">
        <div class="dim-line1">
          <span class="dim-name">${x.name}</span>
          <span class="grade ${g.cls}">${g.t}</span>
          <span class="mono" style="margin-left:auto">超过 ${p}% 人群</span>
        </div>
        <div class="pct-bar">
          <div class="pct-fill ${g.cls}" style="width:${p}%"></div>
          <i class="pct-mark" style="left:30%"></i><i class="pct-mark" style="left:70%"></i>
        </div>
        <div class="mono pct-axis"><span>0</span><span>30</span><span>70</span><span>100</span></div>
        ${x.comment ? `<p style="font-size:13px;line-height:1.6;margin-top:4px">${x.comment}</p>` : ""}
        ${x.evidence && x.evidence[0] ? `<p class="hl-evidence">依据：${x.evidence[0]}</p>` : ""}
      </div>`;
    };
    $app().innerHTML = `
      <div class="report-page">
        <div class="report-head">
          <div class="mono" style="font-size:var(--fs-caption);letter-spacing:.1em;opacity:.6">TALENT OS · GROWTH REPORT</div>
          <h2>${d.title || "能力初步画像"}</h2>
          <div class="page-sub">${d.subtitle || ""} · ${d.mode === "real" ? "AI 实时评估" : "示例数据"}</div>
        </div>

        <div class="sec-tag st-soft">软技能 · 胜任力 <span>对话行为观察</span></div>
        <div class="report-block"><div id="radar" style="height:250px"></div></div>
        <div class="report-block">${soft.map(x => dimRow(x, "var(--c-chart-2)")).join("")}</div>

        <div class="sec-tag st-hard">硬技能 · 知识与技能 <span>测验与作品检验</span></div>
        <div class="report-block">
          ${hard.map(x => dimRow(x, "#2e5fe8")).join("")}
          ${pending.map(p => `
            <div class="dim-row pending">
              <div class="dim-line1">
                <span class="dim-name">${p.name}</span>
                <span class="mono">待定级</span>
                <span class="conf low">待测验 / 任务验证</span>
              </div>
              <div class="heat-track small" style="width:100%;height:8px;margin:6px 0 4px">
                <div class="heat-fill" style="width:0%;background:var(--c-hairline)"></div>
              </div>
              <p style="font-size:12px;opacity:.55;margin-top:4px">${p.note}——将在定制培训包的学习与演练中完成</p>
            </div>`).join("")}
        </div>

        <div class="report-block profile-card">
          <div class="card-title">陪练官的初步印象</div>
          <p style="font-size:var(--fs-body-sm);line-height:1.7">${d.profile || ""}</p>
        </div>
        <div class="report-block">
          <div class="card-title">✦ 值得放大的亮点</div>
          ${hi.map(h => `
            <div class="hl-card">
              <div class="hl-name">${h.name} <span class="mono hl-id">${h.dictId}</span></div>
              <p>${h.why}</p>
              ${h.evidence ? `<p class="hl-evidence">"${h.evidence}"</p>` : ""}
            </div>`).join("")}
        </div>
        <div class="report-block">
          <div class="card-title">▲ 建议主攻的方向</div>
          ${im.map(i => `
            <div class="im-card">
              <div class="hl-name">${i.name} <span class="mono hl-id">${i.dictId}</span></div>
              <p>${i.direction}</p>
            </div>`).join("")}
        </div>

        <div class="report-block guide">
          <div class="card-title">如何阅读这份报告</div>
          <p>· <b>分数是区间，不是定论</b>——初步画像基于一次短对话，维度给出可能的等级范围，区间越窄越确定。</p>
          <p>· <b>百分位与等级</b>：横向进度条表示你超过了多少比例的对照人群（演示基准）；30% 以下为待提升，30%–70% 为中等，70% 以上为优秀。</p>
          <p>· <b>软技能 vs 硬技能</b>：软技能来自对话中的行为观察；硬技能需要测验与作品检验，部分维度显示"待定级"——这不是你不行，是还没考。</p>
          <p>· <b>报告的用途</b>：它决定你的定制培训包从哪里开始，不是给你下结论。</p>
        </div>
        <button data-action="start-training" style="width:100%;height:50px;border:none;border-radius:var(--r-pill);background:var(--c-primary);color:#fff;font-size:17px;font-weight:480;font-family:var(--font-sans);cursor:pointer;margin-top:var(--sp-sm)">领取定制培训包</button>
        <button class="m-btn-back" data-action="back-chat">回看对话</button>
        ${d.mode !== "real" ? '<p class="mono" style="text-align:center;opacity:.45;margin-top:10px">当前为演示数据 · 接入 API key 后切换 AI 实时评估</p>' : ""}
      </div>`;
    drawRadar(soft);
  }

  function drawRadar(dims) {
    const el = document.getElementById("radar");
    if (!el || !window.echarts) return;
    const chart = echarts.init(el);
    const names = dims.map(d => d.name);
    const high = dims.filter(d => d.confidence !== "low").map(d => (d.scoreRange[1] + d.scoreRange[0]) / 2);
    chart.setOption({
      radar: {
        indicator: names.map(n => ({ name: n, max: 4 })),
        radius: "62%",
        axisName: { color: "#000", fontSize: 11 },
        splitArea: { areaStyle: { color: ["#fff", "#f7f7f5"] } },
        splitLine: { lineStyle: { color: "#e6e6e6" } },
        axisLine: { lineStyle: { color: "#e6e6e6" } },
      },
      tooltip: {
        trigger: "item",
        formatter: (p) => dims.map((d, i) => `${d.name}：L${d.scoreRange[0]}–L${d.scoreRange[1]}`).join("<br/>"),
      },
      series: [{
        type: "radar",
        data: [
          { value: dims.map(d => (d.scoreRange[1] + d.scoreRange[0]) / 2), name: "各维度分数",
            areaStyle: { color: "rgba(122,92,196,.25)" }, lineStyle: { color: "#7a5cc4" }, itemStyle: { color: "#7a5cc4" } },
        ],
      }],
    });
  }

  async function loadReport() {
    chat.load();
    // 报告定稿缓存：生成过一次的会话，本地直接呈现（秒开且不再变动）
    const cacheKey = "tos_report_" + chat.sessionId;
    const cached = localStorage.getItem(cacheKey);
    if (cached) { try { return renderReportView(JSON.parse(cached)); } catch (e) { /* 缓存损坏则重新生成 */ } }
    $app().innerHTML = `<div class="m-center"><div class="m-ok-circle" style="background:var(--c-block-mint)">…</div><p style="opacity:.6">陪练官正在整理你的画像</p></div>`;
    try {
      const d = await api("/api/report?sessionId=" + chat.sessionId);
      localStorage.setItem(cacheKey, JSON.stringify(d));
      renderReportView(d);
    } catch (e) {
      renderReportView({ mode: "virtual", title: "能力初步画像", subtitle: "评估服务未启动 · 以下为示例数据", profile: "示例：你有真实的使用经验和行动力，表达自然；结构化拆解与跨职能沟通需要后续任务验证。",
        highlights: [{ dictId: "GEN-AI应用技能", name: "AI 应用技能", why: "对话中给出了可用的行为证据", evidence: "改了提示词之后输出质量明显提高" }],
        improvements: [{ dictId: "CMO-02", name: "结构化思维", direction: "通过针对性任务场景积累行为证据" }],
        soft: [
          { dictId: "CMO-01", name: "沟通表达", scoreRange: [1, 2], confidence: "mid", evidence: ["能说清自己的做法"], comment: "能说清自己的做法，尚未见到面向不同对象调整表达的证据。" },
          { dictId: "CMO-02", name: "结构化思维", scoreRange: [1, 1], confidence: "low", evidence: ["先把改动按影响面分成三档再排优先级"], comment: "该维度在本次对话中行为样本不足，待任务验证。" },
          { dictId: "CMO-03", name: "跨职能协作", scoreRange: [1, 1], confidence: "low", evidence: ["拉着队友每天对一次进度"], comment: "该维度在本次对话中行为样本不足，待任务验证。" },
          { dictId: "CMO-06", name: "学习敏锐度", scoreRange: [2, 3], confidence: "mid", evidence: ["卡点会查文档对比几篇文章"], comment: "能主动查资料解决卡点，形成基本的学习路径。" },
          { dictId: "CMO-09", name: "抗压与坚韧", scoreRange: [1, 2], confidence: "mid", evidence: ["压着deadline交付了"], comment: "有坚持完成的事例，高压情境下的表现待观察。" },
        ],
        hard: [
          { dictId: "GEN-AI应用技能", name: "AI 应用技能", scoreRange: [2, 3], confidence: "mid", evidence: ["分步下指令并检查每步输出"], comment: "有分步下指令、迭代优化的真实使用习惯。" },
        ],
        hardPending: [
          { dictId: "GEN-AI技术知识", name: "AI 技术知识", note: "待知识测验定级" },
          { dictId: "FPM-产品方法知识", name: "产品方法知识", note: "待知识测验定级" },
          { dictId: "GPM-评测集设计技能", name: "评测集设计", note: "待任务场景演练定级" },
        ] });
    }
  }

  window.__tosToast = (m) => toast(m); // 供 m4 模块复用
  function toast(msg, isError) {
    document.querySelectorAll(".m-toast").forEach(t => t.remove());
    const el = document.createElement("div");
    el.className = "m-toast" + (isError ? " error" : "");
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2200);
  }

  /* ---------------- 登录页 ---------------- */
  function viewLogin() {
    return `
      <div class="m-brand">
        <div class="logo">TalentOS</div>
        <div class="sub">候选人端 · 登录</div>
        <span class="identity">手机号验证码登录</span>
      </div>

      <div class="m-hero">
        <div class="hero-eyebrow">TALENT OS · 2026</div>
        <div class="hero-line">Let change happen</div>
        <div class="hero-sub">让改变，在每一次练习中发生</div>
      </div>

      <div class="m-field">
        <label>手机号</label>
        <input class="m-input" id="phone" type="tel" maxlength="11" placeholder="请输入 11 位手机号" value="13800000001">
      </div>
      <div class="m-field">
        <label>验证码</label>
        <div class="m-code-row">
          <input class="m-input" id="code" type="tel" maxlength="6" placeholder="6 位验证码">
          <button class="m-btn-code" data-action="send-code">获取验证码</button>
        </div>
      </div>

      <button class="m-btn-primary" data-action="login">登 录</button>

      <p class="m-hint">演示环境说明：验证码为 123456；白名单号码 138****0001 / 0002 / 0003 登录后可弹窗选择演示分支；其余号码按真实逻辑直接进入无权限页。</p>`;
  }

  /* ---------------- 登录成功页（占位） ---------------- */
  function viewSuccess() {
    const phone = localStorage.getItem(LAST_PHONE_KEY) || "";
    return `
      <div class="m-center">
        <div class="m-ok-circle">✓</div>
        <h2 style="font-size:20px;font-weight:700;margin-bottom:var(--sp-xs)">登录成功</h2>
        <p style="opacity:.7">欢迎，${phone ? maskPhone(phone) : "候选人"}</p>
        <div class="m-block-banner" style="background:var(--c-block-mint);margin-top:var(--sp-xl)">
          <h2>开始能力初聊</h2>
          <p>和你的陪练官聊 3~5 分钟，生成专属能力初步画像——它将决定你的定制培训包。</p>
        </div>
        <button class="btn btn-primary" style="width:100%;height:50px;border:none;border-radius:var(--r-pill);background:var(--c-primary);color:#fff;font-size:17px;font-family:var(--font-sans);cursor:pointer" data-action="go-chat">开始初聊</button>
        <button class="m-btn-back" data-action="back-login">返回登录</button>
      </div>`;
  }

  /* ---------------- 未开通权限页 ---------------- */
  function viewNoPermission() {
    const phone = localStorage.getItem(LAST_PHONE_KEY) || "";
    const records = JSON.parse(localStorage.getItem(STORE_KEY) || "{}");
    const rec = phone ? records[phone] : null;
    const recordHtml = rec ? `
      <div class="record-card">
        <div class="record-row"><span class="k">手机号</span><span class="v mono">${maskPhone(phone)}</span></div>
        <div class="record-row"><span class="k">姓名</span><span class="v">${rec.name}</span></div>
        <div class="record-row"><span class="k">学校</span><span class="v">${rec.school}</span></div>
        <div class="record-row"><span class="k">提交时间</span><span class="v mono">${rec.time}</span></div>
      </div>
      <p class="record-note">该号码非首次进入，已显示上一次的开通申请记录（后台记录）。</p>` : `
      <div class="m-field">
        <label>姓名</label>
        <input class="m-input" id="apply-name" placeholder="请输入姓名">
      </div>
      <div class="m-field">
        <label>学校</label>
        <input class="m-input" id="apply-school" placeholder="请输入学校名称">
      </div>
      <button class="m-btn-primary" data-action="submit-apply">提交开通申请</button>`;

    return `
      <div class="m-center">
        <div class="m-block-banner coral">
          <h2>未开通权限</h2>
          <p>该手机号尚未开通 TalentOS 使用权限。请先提交开通申请，审核通过后即可登录（当前为演示流程）。</p>
        </div>
        ${phone ? `<p style="font-size:var(--fs-body-sm);opacity:.7">当前号码：${maskPhone(phone)}</p>` : ""}
        ${recordHtml}
        <button class="m-btn-back" data-action="back-login">返回登录</button>
      </div>`;
  }

  /* ---------------- 二次弹窗（登录瞬间 · 含演示分支选择） ---------------- */
  function showBranchModal(phone) {
    const realGranted = WHITELIST.includes(phone);
    modalBranch = realGranted ? "granted" : "denied"; // 默认跟随真实逻辑判定，演示可切换
    const mask = document.createElement("div");
    mask.className = "m-mask";
    mask.innerHTML = `
      <div class="m-modal">
        <h3>登录分支确认</h3>
        <span class="red-note">⚠ ${RED_NOTE}</span>
        <div class="real-logic">
          真实逻辑判定：${maskPhone(phone)} ${realGranted ? "在白名单内 → 有权限" : "不在白名单内 → 无权限"}
        </div>
        <div class="branch-opts">
          <div class="branch-opt ${modalBranch === "granted" ? "selected" : ""}" data-action="pick-branch" data-branch="granted">
            <span class="radio"></span>a. 走「有权限」分支
          </div>
          <div class="branch-opt ${modalBranch === "denied" ? "selected" : ""}" data-action="pick-branch" data-branch="denied">
            <span class="radio"></span>b. 走「无权限」分支
          </div>
        </div>
        <div class="acts">
          <button class="m-btn-ghost" data-action="modal-cancel">取消</button>
          <button class="m-btn-primary" data-action="modal-confirm">确认进入</button>
        </div>
      </div>`;
    document.body.appendChild(mask);
  }

  /* ---------------- 运营中台说明弹窗（提交申请后） ---------------- */
  function showOpsModal() {
    const mask = document.createElement("div");
    mask.className = "m-mask";
    mask.innerHTML = `
      <div class="m-modal">
        <h3>演示说明 · 后续流程</h3>
        <div class="real-logic">
          正式设计中，开通申请提交后进入<b>运营中台</b>：运营人员管理申请账号，人工将每条申请<b>引流到对应的学校（企业）</b>，完成权限开通与账号关联。
        </div>
        <p style="font-size:var(--fs-body-sm);opacity:.7">本期不实现运营中台，仅在此说明该流程，不再拓展。</p>
        <div class="acts">
          <button class="m-btn-primary" data-action="modal-close">知道了</button>
        </div>
      </div>`;
    document.body.appendChild(mask);
  }

  /* ---------------- 渲染 ---------------- */
  function render() {
    const r = route();
    if (r === "chat") return initChat();
    if (r === "report") return loadReport();
    if (["onboard", "station", "list", "course", "mission"].includes(r.split("/")[0])) {
      if (r.startsWith("list/")) TOS_M4.state.list = r.split("/")[1] || "required";
      TOS_M4.render(r.split("/")[0]);
      return;
    }
    $app().innerHTML = r === "login" ? viewLogin()
      : r === "success" ? viewSuccess()
      : viewNoPermission();
  }

  /* ---------------- 事件 ---------------- */
  document.addEventListener("click", (e) => {
    // 点击对话区域 → 恢复键盘样式（须在 data-action 判定之前）
    if (e.target.closest && e.target.closest("#chat-body") && !e.target.closest("[data-action]")) {
      setChatInputMode("kb");
      return;
    }
    const el = e.target.closest("[data-action]");
    if (!el) return;
    const act = el.dataset.action;

    if (act === "send-code") {
      toast("验证码已发送（演示：123456）");
      return;
    }
    if (act === "login") {
      const phone = (document.getElementById("phone").value || "").trim();
      const code = (document.getElementById("code").value || "").trim();
      if (!/^1\d{10}$/.test(phone)) { toast("请输入正确的 11 位手机号", true); return; }
      if (code !== "123456") { toast("验证码错误（演示环境为 123456）", true); return; }
      localStorage.setItem(LAST_PHONE_KEY, phone);
      if (WHITELIST.includes(phone)) {
        showBranchModal(phone);          // 仅白名单号码弹出演示分支选择（外挂）
      } else {
        location.hash = "#/no-permission"; // 非白名单按真实逻辑直接进无权限页，不弹窗
      }
      return;
    }
    if (act === "pick-branch") {
      modalBranch = el.dataset.branch;
      document.querySelectorAll(".branch-opt").forEach(o =>
        o.classList.toggle("selected", o.dataset.branch === modalBranch));
      return;
    }
    if (act === "modal-cancel") { document.querySelectorAll(".m-mask").forEach(m => m.remove()); return; }
    if (act === "modal-close") { document.querySelectorAll(".m-mask").forEach(m => m.remove()); return; }
    if (act === "modal-confirm") {
      document.querySelectorAll(".m-mask").forEach(m => m.remove());
      if (modalBranch !== "granted") { location.hash = "#/no-permission"; return; }
      // 老用户判断：同手机号已完成初聊 + 已有培训包 → 直达工位
      const ph = localStorage.getItem(LAST_PHONE_KEY) || "";
      const chatData = JSON.parse(localStorage.getItem("tos_assess_" + ph) || "{}");
      const pkgData = JSON.parse(localStorage.getItem("tos_pkg_" + ph) || "null");
      location.hash = (chatData.done && pkgData) ? "#/station" : "#/success";
      return;
    }
    if (act === "back-login") { location.hash = "#/login"; return; }
    if (act === "go-chat") { location.hash = "#/chat"; return; }
    if (act === "end-chat") {
      if (confirm("结束初聊并查看成长报告？")) { chat.done = true; chat.save(); location.hash = "#/report"; }
      return;
    }
    if (act === "go-report") { location.hash = "#/report"; return; }
    if (act === "send-msg") { sendMsg(); return; }
    if (act === "toggle-voice") { setChatInputMode("voice"); return; }
    if (act === "toggle-kb") { setChatInputMode("kb"); return; }
    if (act === "back-chat") { location.hash = "#/chat"; return; }
    if (act === "start-training") { location.hash = "#/onboard"; return; }
    if (window.TOS_M4 && TOS_M4.handle(act, el)) return;
    if (act === "submit-apply") {
      const phone = localStorage.getItem(LAST_PHONE_KEY) || "";
      const name = (document.getElementById("apply-name").value || "").trim();
      const school = (document.getElementById("apply-school").value || "").trim();
      if (!name || !school) { toast("请填写姓名和学校", true); return; }
      const records = JSON.parse(localStorage.getItem(STORE_KEY) || "{}");
      records[phone] = { name, school, time: new Date().toLocaleString("zh-CN", { hour12: false }) };
      localStorage.setItem(STORE_KEY, JSON.stringify(records));
      render();
      toast("申请已记录（后台记录手机号与申请信息）");
      showOpsModal();
      return;
    }
  });

  document.addEventListener("DOMContentLoaded", () => {
    // ?fresh 参数：清除旧初聊会话，全新开始（测试用）
    if (new URLSearchParams(location.search).has("fresh")) {
      const del = [];
      for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.startsWith("tos_assess_")) del.push(k); }
      del.forEach(k => localStorage.removeItem(k));
    }
    if (!location.hash) location.hash = "#/login";
    window.addEventListener("hashchange", render);
    render();
    fitPhone();
    window.addEventListener("resize", fitPhone);
    // 对话输入框回车发送
    document.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && e.target && e.target.id === "chat-input") { e.preventDefault(); sendMsg(); }
    });
    // 按住说话：按下开始录音，松手结束（初聊 + 沙盘两处）
    document.addEventListener("pointerdown", (e) => {
      if (e.target.closest && e.target.closest("#hold-talk")) holdTalkStart();
      if (e.target.closest && e.target.closest("#sb-hold") && window.TOS_M4) TOS_M4.sbHoldStart();
      if (e.target.closest && e.target.closest("#pt-hold") && window.TOS_M4) TOS_M4.ptHoldStart();
    });
    document.addEventListener("pointerup", () => { holdTalkEnd(); if (window.TOS_M4) { TOS_M4.sbHoldEnd(); TOS_M4.ptHoldEnd(); } });
    document.addEventListener("pointercancel", () => { holdTalkEnd(); if (window.TOS_M4) { TOS_M4.sbHoldEnd(); TOS_M4.ptHoldEnd(); } });
    // 沙盘输入框回车发送
    document.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && e.target && e.target.id === "sb-input") { e.preventDefault(); if (window.TOS_M4) TOS_M4.sbSend(); }
    });
    // 点击沙盘对话区恢复键盘
    document.addEventListener("click", (e) => {
      if (e.target.closest && e.target.closest("#sb-body") && !e.target.closest("[data-action]") && window.TOS_M4) {
        const vm = document.getElementById("sb-vm");
        if (vm && vm.style.display !== "none") window.TOS_M4.sbSetInputMode("kb");
      }
    });
  });

  /* ---------- 手机框等比缩放（PC 预览模式）----------
     视口不够高时整体 scale 缩小，保持 iPhone14 标准比例，
     任何情况下不出现滚动条；真机(<480px)走全屏布局不受影响 */
  function fitPhone() {
    const app = document.querySelector(".m-app");
    const wrap = document.querySelector(".phone-wrap");
    if (!app || !wrap) return;
    if (window.innerWidth < 480) {
      app.style.transform = ""; wrap.style.height = "";
      return;
    }
    const NATURAL = 844;                // 框总高（border-box，含边框）
    const avail = window.innerHeight - 40; // 预留页面上下 padding
    const s = Math.min(1, avail / NATURAL);
    app.style.transform = s < 1 ? `scale(${s.toFixed(4)})` : "";
    wrap.style.height = Math.round(NATURAL * s) + "px";
  }
})();
