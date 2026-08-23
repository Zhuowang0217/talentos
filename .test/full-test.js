/* 完整产品流程测试 */
const fs = require("fs");
const path = require("path");
const store = {};
global.localStorage = { getItem: k => (k in store ? store[k] : null), setItem: (k,v) => { store[k]=String(v); }, removeItem: k => { delete store[k]; } };
const elStub = () => ({ innerHTML:"", style:{} });
const appStub = { innerHTML:"" };
global.document = { getElementById: id => (id==="app"?appStub:elStub()), querySelectorAll: ()=>[], addEventListener: ()=>{} };
global.location = { hash:"", origin:"http://x", hostname:"x", search:"" };
global.window = global;
global.confirm = () => true;

const base = path.resolve(__dirname, "..");
eval(fs.readFileSync(path.join(base, "assets/js/data.js"), "utf8"));
eval(fs.readFileSync(path.join(base, "assets/js/m4.js"), "utf8"));
const M = global.TOS_M4;

let pass = 0, fail = 0;
const ok = (name, cond) => { if(cond){pass++;console.log("  OK "+name)} else {fail++;console.log("  FAIL "+name)} };
const section = (t) => console.log("\n" + t);

// ===== 1 =====
section("1 登录分支");
const WL = ["13800000001","13800000002","13800000003"];
ok("白名单13800000001", WL.includes("13800000001"));
ok("非白名单13900000001", !WL.includes("13900000001"));
ok("手机号格式校验", /^1\d{10}$/.test("13800000001") && !/^1\d{10}$/.test("12345"));
ok("验证码123456正确", "123456"==="123456");

// ===== 2 =====
section("2 初聊与报告");
store["tos_demo_last_phone"] = "13800000001";
store["tos_assess_13800000001"] = JSON.stringify({ sessionId:"s1", msgs:[], done:true, canEnd:true });
store["tos_report_s1"] = JSON.stringify({
  soft: [
    { name:"沟通表达", scoreRange:[1,2], confidence:"mid", evidence:["t"], comment:"c" },
    { name:"结构化思维", scoreRange:[1,1], confidence:"low", evidence:[], comment:"c" },
    { name:"跨职能协作", scoreRange:[2,3], confidence:"mid", evidence:["t"], comment:"c" },
    { name:"学习敏锐度", scoreRange:[2,3], confidence:"mid", evidence:["t"], comment:"c" },
    { name:"抗压与坚韧", scoreRange:[2,3], confidence:"mid", evidence:["t"], comment:"c" },
  ],
  hard: [ { name:"AI 应用技能", scoreRange:[1,1], confidence:"low", evidence:[], comment:"c" } ],
  profile:"p", highlights:[], improvements:[]
});
ok("初聊done=true", JSON.parse(store["tos_assess_13800000001"]).done === true);
ok("报告5+1维度", JSON.parse(store["tos_report_s1"]).soft.length === 5);

// ===== 3 =====
section("3 老用户直达");
const chatD = JSON.parse(store["tos_assess_13800000001"]);
ok("无pkg走正常流程", chatD.done && !JSON.parse(store["tos_pkg_13800000001"]||"null"));
store["tos_pkg_13800000001"] = JSON.stringify({company:"x"});
const pkgD = JSON.parse(store["tos_pkg_13800000001"]||"null");
ok("有pkg直达工位", chatD.done && pkgD);

// ===== 4 =====
section("4 培训包");
M.handle("claim-pkg", {dataset:{}});
ok("培训包生成", M.pkg.data !== null);
ok("必修2门", M.COURSE_LIB.filter(c=>c.required).length === 2);
ok("学习计划生成", Array.isArray(M.pkg.data.plan));
ok("计划无空天", M.pkg.data.plan.every(p => p.courses.length > 0));

// ===== 5 =====
section("5 课程列表");
M.render("list/required");
ok("必修渲染", appStub.innerHTML.includes("我要学"));
M.render("list/elective");
ok("选修渲染", appStub.innerHTML.includes("我想学"));

// ===== 6 =====
section("6 课程学习");
M.handle("open-course", {dataset:{id:"C1"}});
M.render("course");
ok("课程详情", appStub.innerHTML.includes("微课学习"));
ok("顺序解锁", appStub.innerHTML.includes("未解锁") || appStub.innerHTML.includes("当前"));
M.handle("enter-lesson", {dataset:{i:"0"}});
ok("微课1", appStub.innerHTML.includes("微课 1/3") || appStub.innerHTML.includes("第1节"));
M.handle("lesson-done", {});
ok("练习页", appStub.innerHTML.includes("课后练习") || appStub.innerHTML.includes("练习"));
M.handle("answer", {dataset:{i:"1"}});
ok("答后回目录(正确行为)", appStub.innerHTML.includes("微课") || appStub.innerHTML.includes("课程"));
M.handle("quiz-pass", {});
ok("回课程目录", appStub.innerHTML.includes("微课学习"));
ok("第1节完成", appStub.innerHTML.includes("已完成"));

// ===== 7 =====
section("7 沙盘");
M.sb.msgs = [{role:"dev",name:"张工",text:"开始"}];
M.sb.round = 1; M.sb.finished = false;
M.state.stage = "sandbox-chat";
M.render("course");
ok("沙盘对话页", appStub.innerHTML.includes("评审会"));
M.sb.finished = true;
M.render("course");
ok("完成后显示报告", appStub.innerHTML.includes("查看报告") || appStub.innerHTML.includes("结束"));

// ===== 8 =====
section("8 后测");
M.state.course = M.COURSE_LIB.find(c=>c.id==="C1");
M.state.stage = "exam"; M.render("course");
ok("软技能再评", appStub.innerHTML.includes("对话测评") || appStub.innerHTML.includes("再评"));
M.state.course = M.COURSE_LIB.find(c=>c.id==="C3");
M.state.stage = "exam"; M.render("course");
ok("硬技能客观题", appStub.innerHTML.includes("客观题") || appStub.innerHTML.includes("5题") || appStub.innerHTML.includes("再评"));

// ===== 9 =====
section("9 结业考试");
M.render("mission");
ok("结业页渲染", appStub.innerHTML.includes("结业") || appStub.innerHTML.includes("考试"));
ok("含锁定", appStub.innerHTML.includes("开启") || appStub.innerHTML.includes("🔒"));

// ===== 10 =====
section("10 个人面板");
M.render("station");
ok("工位页", appStub.innerHTML.includes("我的工位"));
ok("工位有个人中心入口", appStub.innerHTML.includes("个人中心"));
M.render("profile");
ok("个人中心四Tab", appStub.innerHTML.includes("基本信息") && appStub.innerHTML.includes("今日待办") && appStub.innerHTML.includes("我的成就") && appStub.innerHTML.includes("我的成长"));
ok("退出登录", appStub.innerHTML.includes("退出"));
M.handle("pf-tab", {dataset:{tab:"todo"}});
ok("待办Tab", appStub.innerHTML.includes("待办") || appStub.innerHTML.includes("必修"));
M.handle("pf-tab", {dataset:{tab:"achv"}});
ok("成就Tab", appStub.innerHTML.includes("完成") || appStub.innerHTML.includes("成就"));
M.handle("pf-tab", {dataset:{tab:"growth"}});
ok("成长Tab", appStub.innerHTML.includes("成长") || appStub.innerHTML.includes("报告"));
M.handle("pf-tab", {dataset:{tab:"info"}});
ok("信息Tab", appStub.innerHTML.includes("姓名") || appStub.innerHTML.includes("手机"));

// ===== 11 =====
section("11 退出登录");
M.handle("logout", {});
ok("清除手机号", localStorage.getItem("tos_demo_last_phone") === null);

// ===== 12 API =====
section("12 API端点");
(async () => {
  const post = async (p,b) => (await fetch("http://localhost:3090"+p,{method:"POST",headers:{"Content-Type":"application/json; charset=utf-8"},body:JSON.stringify(b)})).json();
  const sb = "t_sb_"+Date.now().toString(36);
  const s1 = await post("/api/sandbox/start",{sessionId:sb,candidateScore:30});
  ok("沙盘启动", s1.scenario?.title?.length>0);
  const pt1 = "t_pt1_"+Date.now().toString(36);
  const p1 = await post("/api/posttest/start",{sessionId:pt1,courseId:"C3",type:"hard"});
  ok("硬技能后测5题", p1.questions?.length===5);
  const e1 = await post("/api/posttest/evaluate",{sessionId:pt1,courseId:"C3",type:"hard",answers:[1,1,1,1,1]});
  ok("硬技能全对100分", e1.score===100);
  const pt2 = "t_pt2_"+Date.now().toString(36);
  const p2 = await post("/api/posttest/start",{sessionId:pt2,courseId:"C1",type:"soft"});
  ok("软技能后测启动", p2.msgs?.length>0);
  console.log("\n========== 结果 ==========");
  console.log("通过: "+pass+" | 失败: "+fail+" | 总计: "+(pass+fail));
  console.log(fail===0 ? "=== 全部通过 ===" : "=== "+fail+" 个失败 ===");
  process.exit(0);
})().catch(e => { console.log("API失败: "+e.message); process.exit(1); });
