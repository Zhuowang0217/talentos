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
