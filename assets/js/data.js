/* ============================================================
   TalentOS mock 数据层
   数据结构按真实架构设计（评委追问时打开本文件即可讲清）：
   能力图谱：岗位 → 能力域 → 能力项(行为锚点+掌握等级)
   学生画像 / 培训包(必修选修) / 对话脚本 / 证据链 / 成长报告
   M0 为骨架+样例，M1+ 逐步填充完整
   ============================================================ */
window.TOS_DATA = {

  /* 元信息（虚构实体，一个地方改全局） */
  meta: {
    productName: "TalentOS",
    productSub: "AI 原生人才培养平台",
    school: "江州学院 · 信息管理学院（虚构）",
    student: { name: "张明远", grade: "大三", major: "信息管理与信息系统", persona: "毕业冲刺型" },
    teacher: { name: "李雯", role: "课程负责人" },
    caseSource: "改编自某全国连锁零售集团真实项目（已脱敏）",
    term: "2026 春季学期 · 数智产品方向微专业",
  },

  /* —— 能力图谱（内核数据结构）—— */
  capabilityGraph: {
    job: "AI 产品经理（企业服务方向）",
    domains: [
      {
        id: "D1", name: "AI 技术素养", color: "--c-chart-2",
        items: [
          { id: "D1-1", name: "LLM 原理与边界", anchors: ["能说清模型能/不能做什么", "能向算法提出可执行的优化要求"], level: [1, 2, 3, 4] },
          { id: "D1-2", name: "Prompt 与上下文工程", anchors: ["能设计结构化提示词", "能诊断坏 prompt 的原因"], level: [1, 2, 3, 4] },
          { id: "D1-3", name: "RAG 与知识库应用", anchors: [], level: [1, 2, 3, 4] },
          { id: "D1-4", name: "Agent 设计基础", anchors: [], level: [1, 2, 3, 4] },
        ],
      },
      {
        id: "D2", name: "产品方法论", color: "--c-chart-3",
        items: [
          { id: "D2-1", name: "用户研究与需求定义", anchors: [], level: [1, 2, 3, 4] },
          { id: "D2-2", name: "PRD 撰写", anchors: [], level: [1, 2, 3, 4] },
          { id: "D2-3", name: "数据分析与验证", anchors: [], level: [1, 2, 3, 4] },
        ],
      },
      {
        id: "D3", name: "AI 产品专项", color: "--c-chart-1",
        items: [
          { id: "D3-1", name: "人机分工设计", anchors: [], level: [1, 2, 3, 4] },
          { id: "D3-2", name: "评测集设计", anchors: [], level: [1, 2, 3, 4] },
          { id: "D3-3", name: "幻觉治理与安全", anchors: [], level: [1, 2, 3, 4] },
        ],
      },
      {
        id: "D4", name: "行业数智化", color: "--c-chart-6",
        items: [
          { id: "D4-1", name: "零售/供应链数智化场景", anchors: [], level: [1, 2, 3, 4] },
          { id: "D4-2", name: "商业模式理解", anchors: [], level: [1, 2, 3, 4] },
        ],
      },
      {
        id: "D5", name: "职业素养", color: "--c-chart-4",
        items: [
          { id: "D5-1", name: "跨职能沟通", anchors: [], level: [1, 2, 3, 4] },
          { id: "D5-2", name: "伦理与合规意识", anchors: [], level: [1, 2, 3, 4] },
        ],
      },
    ],
  },

  /* —— 学生画像（前测基线 & 岗位对标）—— */
  studentProfile: {
    baseline: { D1: 1.5, D2: 2.0, D3: 1.0, D4: 1.2, D5: 2.5 },     // 前测（1-4）
    jobStandard: { D1: 3.0, D2: 3.0, D3: 3.0, D4: 2.5, D5: 3.0 },  // 岗位要求
    tags: ["毕业冲刺型", "执行力强", "缺乏真实项目经验"],
    gapSummary: "最大差距：AI 产品专项（-2.0）与行业数智化（-1.3）",
  },

  /* —— 培训包（必修=李老师配置 / 选修=自主探索）—— */
  trainingPackages: {
    required: [
      { id: "R1", title: "AI 产品经理能力筑基", assignedBy: "李雯", lessons: 12, linkedDomains: ["D1", "D3"] },
      { id: "R2", title: "企业服务产品实战方法", assignedBy: "李雯", lessons: 8, linkedDomains: ["D2", "D4"] },
    ],
    elective: [
      { id: "E1", title: "零售数智化案例拆解", linkedDomains: ["D4"] },
      { id: "E2", title: "Agent 编排进阶", linkedDomains: ["D1"] },
      { id: "E3", title: "AI 伦理与合规专题", linkedDomains: ["D5"] },
    ],
    sandbox: {
      id: "S1", title: "智能客服升级项目", source: "caseSource",
      roles: ["CEO", "客户方", "算法工程师", "法务合规"],
      stages: ["需求访谈", "方案设计", "评审会", "迭代"],
    },
  },

  /* —— 对话脚本（M2 AI 导师 / M3 沙盘，M0 占位）—— */
  dialogues: {
    tutor: [ /* M2 填充：苏格拉底式分支脚本 */ ],
    sandbox: [ /* M3 填充：多 Agent 剧本 */ ],
  },

  /* —— 证据链（成长报告数据源）—— */
  evidence: [
    /* M4 填充：{id, time, type, linkedItem, summary, link} */
  ],

  /* —— 成长报告（后测）—— */
  growthReport: {
    post: { D1: 2.6, D2: 2.8, D3: 2.2, D4: 2.0, D5: 3.0 },
    curve: [ /* M4 填充：周度数据点 */ ],
  },
};

/* ============================================================
   教师端（管理后台）mock 数据 —— 与学生端共享同一套能力图谱，
   体现"教师编排在 admin、学生体验在前台、数据天然打通"
   ============================================================ */
window.TOS_ADMIN = {

  teacher: { name: "李雯", role: "课程负责人 · 江州学院信息管理学院" },

  stats: { activeProjects: 2, totalStudents: 64, weekActiveRate: "87%", taskCompletion: "72%" },

  /* 待办中心：评价回路（终审）+ 干预回路（AI 上抛）+ 内容更新建议 */
  todos: [
    { type: "review",  level: "", text: "6 份后测报告待终审", meta: "AI 已预批改并附评分依据" },
    { type: "signal",  level: "high", text: "王小明连续 3 次卡在评测集设计，本周未登录", meta: "AI 导师上抛 · 建议干预" },
    { type: "signal",  level: "mid", text: "刘雨欣沙盘方案被客户 Agent 驳回 2 次，情绪信号正常", meta: "AI 导师上抛 · 可观察" },
    { type: "content", level: "", text: "行业动态：Agent 编排框架有更新", meta: "建议更新《Agent 编排进阶》案例" },
  ],

  /* 班级能力热力图：班级平均 vs 岗位标准（1-4） */
  heatmap: [
    { domain: "AI 技术素养", avg: 2.4, std: 3.0 },
    { domain: "产品方法论", avg: 2.6, std: 3.0 },
    { domain: "AI 产品专项", avg: 1.8, std: 3.0, weak: true },
    { domain: "行业数智化", avg: 1.9, std: 2.5, weak: true },
    { domain: "职业素养", avg: 2.8, std: 3.0 },
  ],

  dynamics: [
    { time: "10:24", text: "张明远 完成《智能客服升级》沙盘 · 需求访谈阶段" },
    { time: "09:51", text: "刘雨欣 提交作品：评测集设计文档 v2" },
    { time: "昨天", text: "陈昊 的真题方案获企业评审「可采纳」" },
    { time: "昨天", text: "AI 导师完成本周学情汇总（32 人）" },
  ],

  projects: [
    {
      id: "P1", name: "2026 春 · AI 产品经理微专业", status: "进行中",
      students: 32, week: 6, totalWeeks: 16, completion: "68%",
      job: "AI 产品经理（企业服务方向）",
      source: "沙盘场景改编自某连锁零售集团真实项目（已脱敏）",
    },
    {
      id: "P2", name: "2025 秋 · 数智商务实训班", status: "已结课",
      students: 32, week: 16, totalWeeks: 16, completion: "100%",
      job: "数智商业运营", source: "—",
    },
  ],

  /* P1 学员列表（radar 为五域分数，risk 来自 AI 导师上抛） */
  students: [
    { name: "张明远", progress: 72, active: "今天", risk: null, trend: "+0.8", radar: [1.9, 2.3, 1.4, 1.6, 2.7] },
    { name: "刘雨欣", progress: 95, active: "今天", risk: null, trend: "+1.2", radar: [2.6, 2.9, 2.3, 2.2, 3.1] },
    { name: "陈昊", progress: 88, active: "昨天", risk: null, trend: "+1.0", radar: [2.4, 2.7, 2.1, 2.0, 2.9] },
    { name: "王小明", progress: 41, active: "3 天前", risk: "卡壳：评测集设计", trend: "+0.2", radar: [1.6, 1.8, 1.2, 1.3, 2.2] },
    { name: "李思思", progress: 77, active: "今天", risk: null, trend: "+0.6", radar: [2.0, 2.2, 1.7, 1.8, 2.6] },
    { name: "周子墨", progress: 63, active: "今天", risk: null, trend: "+0.5", radar: [1.8, 2.0, 1.5, 1.7, 2.4] },
    { name: "吴一凡", progress: 55, active: "昨天", risk: null, trend: "+0.4", radar: [1.7, 1.9, 1.4, 1.5, 2.3] },
    { name: "郑小雨", progress: 82, active: "今天", risk: null, trend: "+0.7", radar: [2.1, 2.4, 1.9, 2.0, 2.7] },
  ],

  /* 新建向导 · Step2：AI 生成的课程包草案（教师编辑定稿） */
  courseDraft: {
    meta: "基于「AI 产品经理（企业服务方向）」能力图谱 × 16 周学期生成",
    required: [
      { title: "AI 产品经理能力筑基", domains: "AI技术素养 / AI产品专项", keep: true, edited: false },
      { title: "企业服务产品实战方法", domains: "产品方法论", keep: true, edited: false },
      { title: "评测集设计工作坊", domains: "AI产品专项", keep: true, edited: false },
      { title: "零售数智化场景精讲", domains: "行业数智化", keep: true, edited: true },
    ],
    elective: ["Agent 编排进阶", "AI 伦理与合规专题", "数据分析实战"],
    sandbox: "智能客服升级（零售行业 · 难度：标准）",
    pretest: "AI PM 岗位能力基线测评（五域 · 20 分钟）",
  },

  /* 成果与评价 · 待终审队列 */
  reviewQueue: [
    { student: "刘雨欣", work: "评测集设计文档 v2", aiScore: "A-（88）", basis: "锚点命中 7/8 · 证据：沙盘产出 + 对话片段", state: "待终审" },
    { student: "陈昊", work: "智能客服 PRD v1", aiScore: "B+（82）", basis: "锚点命中 6/8 · 证据：必修课作业 + 沙盘产出", state: "待终审" },
    { student: "李思思", work: "需求访谈纪要", aiScore: "B（78）", basis: "锚点命中 5/8 · 证据：对话片段", state: "待终审" },
  ],
};
