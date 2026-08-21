/* ============================================================
   TalentOS 移动端（候选人端 H5）
   路由：#/login（默认） #/success #/no-permission
   权限真实逻辑 = 白名单判断（WHITELIST）
   演示分支选择器（下拉+二次弹窗）= 外挂测试装置，只决定演示走哪条
   分支，不写入、不影响真实权限逻辑
   ============================================================ */
(function () {
  const WHITELIST = ["13800000001", "13800000002", "13800000003"]; // 真实权限名单（mock）
  const STORE_KEY = "tos_demo_no_perm_records";                    // "后台记录"（localStorage 模拟）
  const LAST_PHONE_KEY = "tos_demo_last_phone";
  const RED_NOTE = "本页面只做 demo 阶段有无权限分支选择，不是真正的页面";

  const state = { branch: "granted" }; // 演示分支选择器的当前值（外挂）

  const $app = () => document.getElementById("app");
  const maskPhone = p => p.slice(0, 3) + "****" + p.slice(7);

  function route() {
    const h = (location.hash || "#/login").replace("#/", "");
    return ["login", "success", "no-permission"].includes(h) ? h : "login";
  }

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

      <div class="demo-branch">
        <div class="demo-title">演示分支选择（外挂装置）</div>
        <select class="m-select" id="branch-select">
          <option value="granted">a. 走「有权限」分支</option>
          <option value="denied">b. 走「无权限」分支</option>
        </select>
        <span class="red-note">⚠ ${RED_NOTE}</span>
      </div>

      <p class="m-hint">演示环境说明：验证码为 123456；权限白名单号码 138****0001 / 0002 / 0003，其余号码真实逻辑判定为无权限。</p>`;
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
          <h2>引导页</h2>
          <p>登录后的引导流程（下一迭代实现），当前为占位页。</p>
        </div>
        <button class="m-btn-primary" data-action="back-login">返回登录</button>
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
        <button class="m-btn-ghost" style="width:100%;margin-top:var(--sp-lg)" data-action="back-login">返回登录</button>
      </div>`;
  }

  /* ---------------- 二次弹窗（登录瞬间） ---------------- */
  function showBranchModal(phone) {
    const realGranted = WHITELIST.includes(phone);
    const branchText = state.branch === "granted" ? "有权限" : "无权限";
    const mask = document.createElement("div");
    mask.className = "m-mask";
    mask.innerHTML = `
      <div class="m-modal">
        <h3>登录分支确认</h3>
        <span class="red-note">⚠ ${RED_NOTE}</span>
        <div class="real-logic">
          真实逻辑判定：${maskPhone(phone)} ${realGranted ? "在白名单内 → 有权限" : "不在白名单内 → 无权限"}<br>
          当前演示选择：<b>${branchText}</b> 分支${realGranted === (state.branch === "granted") ? "" : "（已覆盖真实判定）"}
        </div>
        <div class="acts">
          <button class="m-btn-ghost" data-action="modal-cancel">取消</button>
          <button class="m-btn-primary" data-action="modal-confirm">确认进入</button>
        </div>
      </div>`;
    document.body.appendChild(mask);
  }

  /* ---------------- 渲染 ---------------- */
  function render() {
    const r = route();
    $app().innerHTML = r === "login" ? viewLogin()
      : r === "success" ? viewSuccess()
      : viewNoPermission();
    const sel = document.getElementById("branch-select");
    if (sel) sel.value = state.branch;
  }

  /* ---------------- 事件 ---------------- */
  document.addEventListener("click", (e) => {
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
      const selEl = document.getElementById("branch-select");
      if (selEl) state.branch = selEl.value; // 外挂选择，不触碰白名单逻辑
      if (!/^1\d{10}$/.test(phone)) { toast("请输入正确的 11 位手机号", true); return; }
      if (code !== "123456") { toast("验证码错误（演示环境为 123456）", true); return; }
      localStorage.setItem(LAST_PHONE_KEY, phone);
      showBranchModal(phone);
      return;
    }
    if (act === "modal-cancel") { document.querySelectorAll(".m-mask").forEach(m => m.remove()); return; }
    if (act === "modal-confirm") {
      document.querySelectorAll(".m-mask").forEach(m => m.remove());
      location.hash = state.branch === "granted" ? "#/success" : "#/no-permission";
      return;
    }
    if (act === "back-login") { location.hash = "#/login"; return; }
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
      return;
    }
  });

  document.addEventListener("DOMContentLoaded", () => {
    if (!location.hash) location.hash = "#/login";
    window.addEventListener("hashchange", render);
    render();
  });
})();
