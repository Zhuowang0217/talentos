/**
 * TalentOS M3 轻后端（零依赖，Node 18+）
 * - POST /api/chat   陪练官对话（虚拟模式=状态机；真AI模式=LLM，滚动评分驱动追问）
 * - POST /api/score  评分工作流（语料→JSON，词典锚点引用）
 * - GET  /api/report 结构化报告 JSON
 * 模式：环境变量 TOS_LLM_KEY 存在且非空 → 真AI；否则虚拟模式。
 * 真AI默认智谱 GLM（TOS_LLM_PROVIDER=zhipu|dashi 支持通义）。
 */
const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3090;
const LLM_KEY = process.env.TOS_LLM_KEY || "";
const MODE = LLM_KEY ? "real" : "virtual";

/* ============ 词典锚点（评分工作流的锚定语料，节选） ============ */
const DICT = {
  soft: [ // 软技能·胜任力（对话行为观察可评）
    { id: "CMO-01", name: "沟通表达" },
    { id: "CMO-02", name: "结构化思维" },
    { id: "CMO-03", name: "跨职能协作" },
    { id: "CMO-06", name: "学习敏锐度" },
    { id: "CMO-09", name: "抗压与坚韧" },
  ],
  hard: [ // 硬技能·技能（对话可初步评）
    { id: "GEN-AI应用技能", name: "AI 应用技能" },
  ],
  hardPending: [ // 硬技能·待测验/任务定级（对话不可靠评估，报告占位引导）
    { id: "GEN-AI技术知识", name: "AI 技术知识", note: "待知识测验定级" },
    { id: "FPM-产品方法知识", name: "产品方法知识", note: "待知识测验定级" },
    { id: "GPM-评测集设计技能", name: "评测集设计", note: "待任务场景演练定级" },
  ],
  get dimensions() { return [...this.soft, ...this.hard]; },
};

/* ============ 会话状态（虚拟模式） ============ */
const sessions = new Map();

/* 外挂演示规则（2026-08-22 用户指定）：总对话轮次（主干+追问）不超过 3。
   实现方式：API 边界断路器——第 3 轮回复后追加收尾语并标记可结束。
   不修改 Agent 的 system prompt 与话题/追问内部逻辑。 */
const DEMO_MAX_ROUNDS = 3;
const DEMO_WRAPUP = "\n\n好，今天先聊到这儿，信息已经够我整理一份初步画像了——点右上角「结束初聊」，看看你的成长报告吧。";

const TOPICS = [
  {
    id: "T1", name: "AI 协作经历", dictIds: ["CMO-06", "GEN-AI应用技能"],
    opening: "先聊聊你跟 AI 打交道的经历吧——平时会用 AI 工具做点什么？挑一次印象最深的跟我说说。",
    followUps: [
      "那次用下来，效果符合你的预期吗？哪里好、哪里不行？",
      "如果让你重来一次，你会在提示词或者用法上做什么不同的调整？",
      "你觉得这类 AI 工具最适合替你干什么、最不能替你干什么？",
    ],
  },
  {
    id: "T2", name: "困难决定", dictIds: ["CMO-09", "CMO-02"],
    opening: "换个话题。说一个你遇到过比较棘手的事——项目、学业里都行，当时难在哪？",
    followUps: [
      "你当时是怎么一步步处理的？先做了什么、后做了什么？",
      "回头看，如果时间或资源砍半，你会怎么取舍？",
      "那件事之后，你处理类似情况有什么变化吗？",
    ],
  },
  {
    id: "T3", name: "学习方式", dictIds: ["CMO-06"],
    opening: "聊点轻松的。最近半年你主动学过什么新东西吗？怎么学的？",
    followUps: [
      "学的过程中卡住的时候，你一般怎么办？",
      "你怎么判断自己算“学会了”？有什么标准或验证方式？",
    ],
  },
  {
    id: "T5", name: "团队协作", dictIds: ["CMO-03", "CMO-01"],
    opening: "最后聊聊跟人打交道。讲一次你和别人（同学、队友、同事）合作完成事情的经历，你负责哪块？",
    followUps: [
      "合作中出现过分歧吗？你怎么处理的？",
      "对方如果比你强势，你会怎么推进你的想法？",
    ],
  },
];

const OPENING_LINE = "很荣幸能跟你接下来一起共事。在我们开始之前，想先对你做一个简单的了解——我们花个 3~5 分钟聊一聊，看看你现在的一个能力情况。你随时可以畅所欲言，聊到哪算哪。";

/* ============ 意图识别（虚拟模式规则版；真AI模式由 LLM 处理） ============ */
function detectIntent(text) {
  const t = (text || "").trim();
  if (!t) return "empty";
  if (/评分|打分|标准|怎么评|几分|权重|维度有哪些|胜任力是什么/.test(t)) return "probe-score";
  if (/累了|不想聊|休息|改天|算了|结束吧/.test(t)) return "tired";
  if (/^(嗯|哦|好|行|是的|对|不知道|没想?过?|不清楚|没啥)[。.!！~]?$/.test(t)) return "refuse";
  if (t.length < 6 && !/[？?]/.test(t)) return "short";
  return "normal";
}

const GUARD_REPLY = "这个问题问得好——不过评分的细节我先卖个关子，完整的维度和依据会在结束后的成长报告里呈现，咱们先把这几分钟聊透，报告才有料。回到刚才：";
const PULLBACK = "哈哈这个有意思，不过今天时间有限，我更想听听你刚才那件事里你的做法——";
const REASSURE = "没关系，不确定也没事，这个不算减分项。那我换个问法：";

/* ============ 虚拟对话状态机 ============ */
function getReply(session, text) {
  const intent = detectIntent(text);
  session.userMsgCount = (session.userMsgCount || 0) + 1;
  if ((text || "").trim().length >= 10) session.evidence.push(text.trim());

  // 意图分支
  if (intent === "probe-score") {
    return { reply: GUARD_REPLY + TOPICS[session.topicIndex].followUps[Math.min(session.followUpIndex, TOPICS[session.topicIndex].followUps.length - 1)], blocked: true };
  }
  if (intent === "tired") {
    return { reply: "好，不勉强——聊到这已经够我有个初步印象了。你可以点下面的「结束初聊」，我这就把报告给你整理出来。", canEnd: true };
  }
  if (intent === "refuse" || intent === "empty") {
    const t = TOPICS[session.topicIndex];
    if (session.followUpIndex >= 1) return { reply: nextTopicReply(session) }; // 追问上限1次
    session.followUpIndex++;
    return { reply: REASSURE + t.followUps[session.followUpIndex - 1] };
  }
  if (intent === "short") {
    const t = TOPICS[session.topicIndex];
    if (session.followUpIndex >= 1) return { reply: nextTopicReply(session) };
    session.followUpIndex++;
    return { reply: "再多说两句？具体点，比如当时的情况、你做了什么——" + t.followUps[session.followUpIndex - 1] };
  }

  // 正常回答：确认+追加追问（追问上限 1 次，2026-08-22 用户调整：原 3 次）
  const t = TOPICS[session.topicIndex];
  if (session.followUpIndex >= 1) {
    return { reply: acknowledge(text) + nextTopicReply(session) };
  }
  session.followUpIndex++;
  return { reply: acknowledge(text) + t.followUps[session.followUpIndex - 1] };
}

function acknowledge(text) {
  const frag = (text || "").replace(/\s/g, "").slice(0, 18);
  const acks = [
    `明白，"${frag}${(text || "").length > 18 ? "…" : ""}"这段我记下了。`,
    `嗯，这个细节很有信息量。`,
    `有意思，你刚才提到的这点我先记下来。`,
  ];
  return acks[(Math.random() * acks.length) | 0];
}

function nextTopicReply(session) {
  session.topicIndex++;
  session.followUpIndex = 0;
  if (session.topicIndex >= TOPICS.length) {
    session.done = true;
    return "聊得差不多了，信息量很够。我这就去整理你的初步画像——点下面「查看成长报告」就能看到。";
  }
  return "好，换个话题。" + TOPICS[session.topicIndex].opening;
}

/* ============ 虚拟评分（启发式：语料长度+词典关键词） ============ */
const DIM_KEYWORDS = {
  "CMO-01": ["沟通", "说服", "汇报", "表达", "解释"],
  "CMO-02": ["首先", "然后", "分析", "拆", "逻辑", "优先", "步骤", "框架"],
  "CMO-03": ["团队", "合作", "同学", "队友", "分歧", "一起", "协作"],
  "CMO-06": ["学", "新", "查", "文档", "教程", "试试", "研究"],
  "CMO-09": ["压力", "坚持", "加班", "赶", "失败", "重來", "重来", "扛"],
  "GEN-AI应用技能": ["提示词", "prompt", "AI", "大模型", "工具", "指令"],
};

function virtualScore(evidence) {
  const joined = evidence.join(" ");
  const totalLen = joined.length;
  return DICT.dimensions.map(d => {
    const kw = (DIM_KEYWORDS[d.id] || []);
    const hits = kw.reduce((n, k) => n + (joined.includes(k) ? 1 : 0), 0);
    const richness = Math.min(2, Math.floor(totalLen / 150));
    const level = Math.max(1, Math.min(3, 1 + Math.floor(hits / 2) + (richness > 1 ? 1 : 0)));
    const conf = evidence.length >= 5 && hits >= 2 ? "high" : evidence.length >= 3 ? "mid" : "low";
    const sample = evidence.filter(t => (DIM_KEYWORDS[d.id] || []).some(k => t.includes(k)))[0]
      || evidence[Math.min(evidence.length - 1, d.id.length % Math.max(1, evidence.length))];
    return {
      dictId: d.id, name: d.name,
      scoreRange: [Math.max(1, level - 1), level],
      confidence: conf,
      evidence: sample ? [sample.slice(0, 60)] : [],
    };
  });
}

function virtualReport(evidence) {
  const dims = virtualScore(evidence.length ? evidence : ["（本次初聊语料较少）"]);
  const byId = Object.fromEntries(dims.map(d => [d.dictId, d]));
  const grp = (list) => list.map(d => byId[d.id] || { dictId: d.id, name: d.name, scoreRange: [1, 1], confidence: "low", evidence: [], comment: "" });
  const sorted = [...dims].sort((a, b) => b.scoreRange[1] - a.scoreRange[1]);
  return {
    mode: "virtual",
    title: "能力初步画像",
    subtitle: "基于首聊对话 · 分数为区间估计",
    profile: "初步印象：你有真实的使用经验和行动力，表达自然；结构化拆解和跨职能沟通的样本还不够多，需要后续任务来验证。别把这份报告当结论，它是我们训练的起点。",
    highlights: sorted.slice(0, 2).map(d => ({ dictId: d.dictId, name: d.name, why: "在对话中给出了可用的行为证据", evidence: d.evidence[0] || "" })),
    improvements: sorted.slice(-2).reverse().map(d => ({ dictId: d.dictId, name: d.name, direction: "通过针对性任务场景积累行为证据，进入定级验证" })),
    soft: grp(DICT.soft),
    hard: grp(DICT.hard),
    hardPending: DICT.hardPending,
  };
}

/* ============ 真AI模式（LLM 调用） ============ */
async function llmChat(messages) {
  const provider = process.env.TOS_LLM_PROVIDER || "zhipu";
  const url = provider === "dashscope"
    ? "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions"
    : "https://open.bigmodel.cn/api/paas/v4/chat/completions";
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${LLM_KEY}` },
    body: JSON.stringify({ model: process.env.TOS_LLM_MODEL || (provider === "dashscope" ? "qwen-plus" : "glm-4-flash"), messages, temperature: 0.7 }),
  });
  if (!res.ok) throw new Error(`LLM ${res.status}`);
  const data = await res.json();
  return data.choices[0].message.content;
}

const TUTOR_SYSTEM = `你是 TalentOS 的"陪练官"，一位即将与候选人共事的资深伙伴，正在做 3~5 分钟的首次能力初聊。
原则：
1. 语气是共事伙伴不是考官：自然、真诚、多问开放式问题，用户答得好就具体肯定，不知道就说不知道。
2. 你只负责聊天，不负责评分。如果用户打听评分标准/维度/权重，用这句话挡回并继续当前话题："评分的细节我卖个关子，完整维度会在结束后的成长报告里呈现。"绝不透露任何评分相关内容。
3. 用户闲聊偏题就温和拉回；用户拒答或说不知道，不逼问，换个问法或换话题；用户说累了就友好收尾提示可结束。
4. 每个话题最多追问 1 次：用户回答首个问题后，你可以追问一次，得到回答后立即自然过渡到下一话题。话题全部聊完或信息足够时，友好收尾并提示查看报告。
5. 每轮回复控制在 80 字以内，一次只问一个问题。
话题框架（按序进行，每话题内根据回答深挖）：${TOPICS.map((t, i) => `${i + 1}.${t.name}`).join("；")}。`;

const SCORER_SYSTEM = `你是 TalentOS 的能力评分工作流。输入是候选人与陪练官的对话记录，你独立于对话，只做评估输出。
评分维度分两组输出：
【soft 软技能·胜任力】（只能用这些 dictId）：${DICT.soft.map(d => `${d.id}=${d.name}`).join("，")}——依据对话中的行为表现评估。
【hard 硬技能·技能】（只能用这些 dictId）：${DICT.hard.map(d => `${d.id}=${d.name}`).join("，")}——仅依据对话中体现的真实 AI 使用行为评估，没有具体使用细节则 confidence 必须为 low。
规则：分数给区间不给精确值（1-4 级制）；每个维度给出 confidence（high/mid/low，语料不足必须 low）；evidence 引用候选人原话片段；不评价陪练官的话。

【评语写法规范】（源自专业测评报告质检标准，必须遵守）：
1. 每条评述只描述一个胜任力，既有水平判断又有行为描述，落到具体情境或行为——禁止"管理能力需要提升"这类空话。
2. 用行为差异而非程度副词体现高低：写"推进工作不遗余力"或"按部就班完成交代工作"，禁止"XX能力强/较强/一般"句式。
3. 致命性不足委婉表达：写"考虑问题不够周全，有时对细节有所忽视"，不写"风险意识差"这类标签。
4. 评述与分数一致：分高的维度优势多于不足，分低的维度不足多于优势且说明影响。
5. 语气克制专业，无口语、无生僻术语，句式多样。
【profile 写法】：先给整体形象（两三句，形象鲜明），点名最高与最低维度，可点出差异的可能成因（历练不足/认知盲区等），不照搬分维度评述原文。
【improve 写法】：具体、可落地，从这些角度取材：历练机会/资源支持/培训/平台/方法传授/引导提醒。写优势项的不足时可限定情境："面对……情景可能会有挑战"。

严格输出 JSON（不要多余文字）。字段说明：evidence 数组里必须放候选人发言的**原文片段**（从输入对话里逐字摘录，不允许自己编写或使用占位符）；comment 按上述规范写一句评述。输出形如：{"soft":[{"dictId":"CMO-01","name":"沟通表达","scoreRange":[1,2],"confidence":"mid","evidence":["从输入中逐字摘录的候选人原话"],"comment":"评述一句"}],"hard":[{"dictId":"GEN-AI应用技能","name":"AI 应用技能","scoreRange":[1,2],"confidence":"low","evidence":["原话"],"comment":"评述"}],"profile":"两三句总体画像","improve":[{"dictId":"CMO-02","direction":"一句可落地建议"}]}。
**comment 字段必填**：每个维度都必须写评述，即使 confidence 为 low——语料不足时写"该维度在本次对话中行为样本不足，初步观察为……，待任务验证"。profile 禁止使用"较强/很强/一般"等程度副词堆砌，用行为差异表达（如"能分步骤拆解指令""停留在单点尝试"）。`;

async function realChat(session, text) {
  session.history.push({ role: "user", content: text });
  if ((text || "").trim().length >= 10) session.evidence.push(text.trim());
  let sys = TUTOR_SYSTEM;
  sys += `\n当前话题进度：${session.topicIndex + 1}/${TOPICS.length}，本话题已追问 ${session.followUpIndex}/1 次（到 1 必须切换话题）。`;
  // 滚动评估：每2轮把证据缺口回注
  if (session.userMsgCount % 2 === 0) {
    try {
      const s = await llmScore(session.evidence.slice(-6));
      const allDims = [...(s.soft || []), ...(s.hard || [])];
      const weak = allDims.filter(d => d.confidence === "low").map(d => d.name);
      if (weak.length) sys += `内部提示（不要向用户透露）：以下维度证据不足，可自然引导话题补充——${weak.join("、")}。`;
    } catch (e) { /* 评分失败不影响对话 */ }
  }
  const reply = await llmChat([{ role: "system", content: sys }, ...session.history.slice(-12)]);
  session.history.push({ role: "assistant", content: reply });
  // 服务端计数兜底
  if (/换个话题|下一话题|聊得差不多/.test(reply)) { session.topicIndex = Math.min(TOPICS.length - 1, session.topicIndex + 1); session.followUpIndex = 0; }
  else session.followUpIndex = Math.min(1, session.followUpIndex + 1);
  session.userMsgCount++;
  return { reply, canEnd: session.userMsgCount >= 10 };
}

async function llmScore(evidence) {
  const out = await llmChat([
    { role: "system", content: SCORER_SYSTEM },
    { role: "user", content: "对话记录（候选人发言）：\n" + evidence.map((t, i) => `${i + 1}. ${t}`).join("\n") },
  ]);
  const m = out.match(/\{[\s\S]*\}/);
  return m ? JSON.parse(m[0]) : {};
}

async function realReport(session) {
  try {
    const s = await llmScore(session.evidence);
    const grp = (list, src) => list.map(d => {
      const hit = (src || []).find(x => x.dictId === d.id);
      return { dictId: d.id, name: d.name, scoreRange: (hit && hit.scoreRange) || [1, 1], confidence: (hit && hit.confidence) || "low", evidence: (hit && hit.evidence) || [], comment: (hit && hit.comment) || "" };
    });
    const soft = grp(DICT.soft, s.soft), hard = grp(DICT.hard, s.hard);
    const all = [...soft, ...hard].sort((a, b) => (b.scoreRange[1] + b.scoreRange[0]) - (a.scoreRange[1] + a.scoreRange[0]));
    return {
      mode: "real", title: "能力初步画像", subtitle: "基于首聊对话 · 分数为区间估计",
      profile: s.profile || "（画像生成中）",
      highlights: all.slice(0, 2).map(d => ({ dictId: d.dictId, name: d.name, why: "对话中给出了可用的行为证据", evidence: (d.evidence[0] || "").slice(0, 60) })),
      improvements: (s.improve || []).slice(0, 2).map(i => ({ dictId: i.dictId, name: ([...DICT.soft, ...DICT.hard].find(d => d.dictId === i.dictId) || {}).name || i.dictId, direction: i.direction })),
      soft, hard,
      hardPending: DICT.hardPending,
    };
  } catch (e) {
    const r = virtualReport(session.evidence); r.mode = "virtual-fallback"; r.subtitle = "评估服务繁忙 · 以下为示例数据"; return r;
  }
}

/* ============ 情景模拟演练：场景与角色 ============ */
const SANDBOX_SCENARIO = {
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
  agents: ["dev", "biz", "qa"],
};

/* ============ 人格 Agent 数据层（结构化，可存储/编辑/复用） ============ */
const PERSONAS = {
  dev_zhang: {
    identity: {
      name: "张工",
      role: "研发负责人",
      background: "10年后端开发经验，从一线工程师升到技术管理。对代码质量有洁癖，经历过三次因赶工期导致的生产事故，从此对时间承诺极度谨慎。管理着一个8人研发团队。",
    },
    personality: {
      traits: ["仔细", "直接", "技术执着"],
      communication: "简短直接，不拐弯抹角，偶尔显得生硬。不会主动寒暄，但专业能力极强。",
      values: ["工程质量", "技术债务最小化", "系统稳定性"],
      petPeeves: ["模糊的需求", "不切实际的时间承诺", "没有接口设计就谈上线"],
    },
    knowledge: {
      domain: "后端架构、系统设计、性能优化、数据库、RAG技术栈",
      level: "expert",
    },
    speaking: {
      tone: "直接，偶尔带技术术语，不会修饰措辞",
      habits: ["从技术角度看", "我需要看到具体的", "这个实现起来有风险", "技术债务怎么办"],
      length: "50-80字",
    },
    color: "#c5b0f4",
    label: "研发",
  },
  biz_liu: {
    identity: {
      name: "刘总",
      role: "业务方负责人",
      background: "销售出身，一路做到业务负责人。对客户需求极度敏感，但技术理解有限。习惯用商业价值来推动决策，坚信先上线再迭代。掌管着公司的客户服务KPI。",
    },
    personality: {
      traits: ["思维活跃", "急切", "商业导向"],
      communication: "热情直接，喜欢用数字和商业价值说话，偶尔打断别人。",
      values: ["客户满意度", "市场份额", "快速上线"],
      petPeeves: ["过度技术化讨论", "推迟上线时间", "功能做太少"],
    },
    knowledge: {
      domain: "客户需求、市场竞争、商业模型、客服运营",
      level: "business",
    },
    speaking: {
      tone: "热情急切，偶尔强势，用商业逻辑施压",
      habits: ["客户等不了", "竞品都已经", "我理解技术有限制但是"],
      length: "50-80字",
    },
    color: "#f3c9b6",
    label: "业务",
  },
  qa_chen: {
    identity: {
      name: "陈姐",
      role: "测试负责人",
      background: "12年测试经验，见过太多上线后爆雷的案例。性格温和但在质量问题上寸步不让。会上习惯先观察再发言，会后可能会单独找产品经理聊顾虑。",
    },
    personality: {
      traits: ["温和", "细致", "谨慎"],
      communication: "会上话不多，发言简短温和但切中要害。会后可能会单独找你。",
      values: ["用户体验", "边界条件覆盖", "异常处理"],
      petPeeves: ["没有测试计划的排期", "忽略边界条件", "轻率地说没问题"],
    },
    knowledge: {
      domain: "测试策略、边界分析、用户体验、质量保障",
      level: "expert",
    },
    speaking: {
      tone: "温和委婉，但问到点子上",
      habits: ["那个我想问一下", "边界条件考虑了吗", "用户如果遇到会怎样"],
      length: "40-60字",
    },
    color: "#c8e6cd",
    label: "测试",
  },
};

// Agent 简写映射（兼容现有代码）
const SANDBOX_AGENTS = {
  dev: { name: PERSONAS.dev_zhang.identity.name + "（" + PERSONAS.dev_zhang.identity.role + "）", label: PERSONAS.dev_zhang.label, color: PERSONAS.dev_zhang.color, key: "dev_zhang" },
  biz: { name: PERSONAS.biz_liu.identity.name + "（" + PERSONAS.biz_liu.identity.role + "）", label: PERSONAS.biz_liu.label, color: PERSONAS.biz_liu.color, key: "biz_liu" },
  qa:  { name: PERSONAS.qa_chen.identity.name + "（" + PERSONAS.qa_chen.identity.role + "）", label: PERSONAS.qa_chen.label, color: PERSONAS.qa_chen.color, key: "qa_chen" },
};

/* ============ 提示词模板引擎（人格 + 任务上下文 → 系统提示词） ============ */
function buildPersonaPrompt(persona, taskCtx) {
  return `You are playing a character in a product review meeting. Stay in character.

[Identity]
You are ${persona.identity.name}, ${persona.identity.role}.
${persona.identity.background}

[Personality]
Traits: ${persona.personality.traits.join(", ")}.
Communication: ${persona.personality.communication}
You care about: ${persona.personality.values.join(", ")}
You dislike: ${persona.personality.petPeeves.join(", ")}

[Current Meeting]
Topic: ${taskCtx.title}
Goal: ${taskCtx.goal}
PRD summary: ${taskCtx.prdSummary}

[Response Rules]
Tone: ${persona.speaking.tone}
Typical expressions: ${persona.speaking.habits.join(" / ")}
Keep under ${persona.speaking.length}. Respond in Chinese.

[Output Format - MANDATORY]
You MUST respond in valid JSON:
{"reply":"your dialogue in Chinese","satisfied":false}

"satisfied" rules: set true ONLY when the candidate has adequately addressed YOUR specific concerns (related to your values and pet peeves). Set false if you still have doubts or want to ask more.`;
}

function pickAgent(userText, msgs) {
  if (/技术|实现|接口|架构|性能|研发|开发/.test(userText)) return "dev";
  if (/业务|需求|客户|价值|上线|商业/.test(userText)) return "biz";
  if (/测试|质量|边界|异常|bug/.test(userText)) return "qa";
  const last = msgs.filter(m => m.role !== "user").slice(-1)[0];
  if (last) {
    if (last.role === "dev") return Math.random() < 0.5 ? "biz" : "qa";
    if (last.role === "biz") return Math.random() < 0.5 ? "dev" : "qa";
    if (last.role === "qa") return Math.random() < 0.5 ? "dev" : "biz";
  }
  return ["dev", "biz", "qa"][Math.floor(Math.random() * 3)];
}

function pickSecondAgent(first) {
  const others = ["dev", "biz", "qa"].filter(a => a !== first);
  return others[Math.floor(Math.random() * others.length)];
}

function sandboxFallback(agent) {
  const fallbacks = {
    dev: ["这个方案技术上有什么问题吗？我需要看到具体的接口设计。", "6周太紧了，你们考虑过知识库的更新维护成本吗？", "RAG的检索精度能做到多少？如果答错了谁负责？", "这个和现有系统的集成方案呢？我需要详细的技术方案。"],
    biz: ["能不能加上多语言支持？我们的海外客户也在增长。", "6周太久了，能不能4周上线？市场不等人啊。", "30%的效率提升太保守了，我期望至少50%。", "除了客服，能不能顺便做个销售推荐功能？"],
    qa: ["那个...我想问一下，如果知识库里没有答案怎么办？", "边界条件考虑了吗？比如用户输入无关内容的情况。", "测试环境的数据够吗？我们需要真实场景的数据来验证。", "用户体验方面，转人工的等待时间有没有上限？"],
  };
  const arr = fallbacks[agent] || fallbacks.dev;
  return arr[Math.floor(Math.random() * arr.length)];
}

async function sandboxAgentCall(agentKey, msgs, taskOverride) {
  const persona = PERSONAS[SANDBOX_AGENTS[agentKey].key] || PERSONAS.dev_zhang;
  const taskCtx = taskOverride || {
    title: SANDBOX_SCENARIO.title,
    goal: SANDBOX_SCENARIO.goal,
    prdSummary: SANDBOX_SCENARIO.prd.sections.slice(0, 3).map(s => s.h + ": " + s.c.slice(0, 50)).join("; "),
  };
  const systemPrompt = buildPersonaPrompt(persona, taskCtx);
  const recent = msgs.slice(-8);
  const history = recent.map(m => `[${m.name}] ${m.text}`).join("\n");
  const out = await llmChat([
    { role: "system", content: systemPrompt },
    { role: "user", content: "Meeting dialogue:\n" + history + "\n\nRespond as " + persona.identity.name + " in JSON format." },
  ]);
  // Strip markdown fences then parse JSON
  let clean = out.replace(/```(?:json)?\n?/g, "").replace(/```/g, "").trim();
  const jm = clean.match(/\{[\s\S]*\}/);
  if (jm) {
    try {
      const p = JSON.parse(jm[0]);
      return { reply: (p.reply || "").trim().slice(0, 150), satisfied: p.satisfied === true };
    } catch (e) {
      // JSON malformed, try to extract reply field
      const rm = clean.match(/"reply"\s*:\s*"([^"]+)"/);
      if (rm) return { reply: rm[1].slice(0, 150), satisfied: false };
    }
  }
  // Last resort: strip all JSON-looking syntax, keep plain text
  const plain = clean.replace(/[{}\[\]"]/g, "").replace(/^json/i, "").trim();
  return { reply: plain.slice(0, 150) || "（沉默）", satisfied: false };
}

async function sandboxEvaluate(msgs) {
  const userMsgs = msgs.filter(m => m.role === "user").map(m => m.text).join("\n");
  const allMsgs = msgs.map(m => `[${m.name}] ${m.text}`).join("\n");
  const prompt = `你是一个能力评估系统。以下是候选人在AI产品评审会情景模拟中的完整对话记录。请从四个维度评估他的软技能表现：

1. 沟通表达（CMO-01）：能否清晰传达方案、回应质疑
2. 结构化思维（CMO-02）：回答是否有条理、有优先级
3. 跨职能协作（CMO-03）：能否平衡各方关切、推动共识
4. 抗压与坚韧（CMO-09）：面对挑战和质疑时的应对

对话记录：
${allMsgs}

严格输出 JSON：
{"dimensions":[{"code":"CMO-01","name":"沟通表达","level":2,"comment":"一句评述（落到具体行为）","suggestion":"一句建议或鼓励"},{"code":"CMO-02","name":"结构化思维","level":2,"comment":"...","suggestion":"..."},{"code":"CMO-03","name":"跨职能协作","level":2,"comment":"...","suggestion":"..."},{"code":"CMO-09","name":"抗压与坚韧","level":2,"comment":"...","suggestion":"..."}],"overall":"两三句总评","totalScore":65}`;

  try {
    const out = await llmChat([{ role: "system", content: prompt }]);
    const m = out.match(/\{[\s\S]*\}/);
    if (m) return JSON.parse(m[0]);
  } catch (e) { /* fall through */ }
  return sandboxVirtualEvaluate(msgs);
}

function sandboxVirtualEvaluate(msgs) {
  const userMsgs = msgs.filter(m => m.role === "user");
  const avgLen = userMsgs.reduce((s, m) => s + m.text.length, 0) / Math.max(1, userMsgs.length);
  const base = Math.min(3, Math.max(1, Math.floor(avgLen / 40)));
  return {
    dimensions: [
      { code: "CMO-01", name: "沟通表达", level: base, comment: avgLen > 60 ? "能较充分地表达观点和回应质疑" : "表达较为简短，可进一步展开论述", suggestion: "尝试用「结论-依据-建议」结构来回应质疑" },
      { code: "CMO-02", name: "结构化思维", level: Math.max(1, base - 1), comment: "回答的组织性有待加强", suggestion: "先梳理优先级再回应，避免被单点问题带偏" },
      { code: "CMO-03", name: "跨职能协作", level: base, comment: userMsgs.length > 3 ? "尝试回应了多方的关切" : "互动偏少，可更主动地询问各方意见", suggestion: "主动询问研发和测试的顾虑，展现协作意识" },
      { code: "CMO-09", name: "抗压与坚韧", level: Math.min(4, base + 1), comment: "面对质疑保持了稳定的输出", suggestion: "保持这个状态，挑战性场景正是展现韧性的机会" },
    ],
    overall: "本次评审模拟中，你在压力下保持了基本的沟通和应对能力。建议在结构化表达和主动协作方面进一步提升。",
    totalScore: 55 + base * 10,
  };
}

/* ============ HTTP 服务 ============ */
function json(res, code, data) { res.writeHead(code, { "Content-Type": "application/json; charset=utf-8", "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "Content-Type", "Access-Control-Allow-Methods": "GET,POST,OPTIONS" }); res.end(JSON.stringify(data)); }
function readBody(req) {
  return new Promise((resolve) => { let b = ""; req.on("data", c => b += c); req.on("end", () => { try { resolve(JSON.parse(b || "{}")); } catch { resolve({}); } }); });
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    });
    return res.end(); // 204 不允许带 body
  }
  const url = new URL(req.url, "http://localhost");
  if (url.pathname === "/api/mode") return json(res, 200, { mode: MODE });
  if (url.pathname === "/api/chat" && req.method === "POST") {
    const { sessionId, text, init } = await readBody(req);
    if (!sessions.has(sessionId)) sessions.set(sessionId, { topicIndex: 0, followUpIndex: 0, userMsgCount: 0, evidence: [], history: [] });
    const session = sessions.get(sessionId);
    try {
      if (init) {
        const first = OPENING_LINE + "\n\n" + TOPICS[0].opening;
        if (MODE === "real") { session.history.push({ role: "assistant", content: first }); }
        return json(res, 200, { reply: first, mode: MODE, topic: TOPICS[0].name });
      }
      const out = MODE === "real" ? await realChat(session, text) : { ...getReply(session, text), topic: TOPICS[session.topicIndex].name };
      // 外挂规则：达到总轮次上限 → 追加收尾并标记可结束
      if (session.userMsgCount >= DEMO_MAX_ROUNDS) {
        out.reply = (out.reply || "") + DEMO_WRAPUP;
        out.canEnd = true;
      }
      return json(res, 200, { ...out, mode: MODE });
    } catch (e) { return json(res, 200, { reply: "（网络波动，再说一次你刚才的意思？）", mode: MODE, error: true }); }
  }
  if (url.pathname === "/api/score" && req.method === "POST") {
    const { sessionId } = await readBody(req);
    const session = sessions.get(sessionId) || { evidence: [] };
    return json(res, 200, { mode: MODE, dimensions: virtualScore(session.evidence) });
  }
  if (url.pathname === "/api/report") {
    const sessionId = url.searchParams.get("sessionId");
    const session = sessions.get(sessionId) || { evidence: [] };
    if (session.report) return json(res, 200, session.report);
    const out = MODE === "real" ? await realReport(session) : virtualReport(session.evidence);
    session.report = out;
    return json(res, 200, out);
  }

  /* ============ 情景模拟演练（多角色 Agent 评审会） ============ */
  if (url.pathname === "/api/sandbox/start" && req.method === "POST") {
    const { sessionId } = await readBody(req);
    if (!sessions.has(sessionId)) sessions.set(sessionId, { evidence: [] });
    const sb = sessions.get(sessionId);
    sb.sandbox = { msgs: [], round: 0, maxRounds: 10, finished: false };
    const opening = "好的，人都到齐了，我们开始评审吧。你先介绍一下这个方案的核心内容。";
    sb.sandbox.msgs.push({ role: "dev", name: SANDBOX_AGENTS.dev.name, text: opening });
    sb.sandbox.round = 1;
    return json(res, 200, { mode: MODE, scenario: SANDBOX_SCENARIO, msgs: sb.sandbox.msgs, round: 1, maxRounds: 10 });
  }

  if (url.pathname === "/api/sandbox/chat" && req.method === "POST") {
    const { sessionId, text, endNow } = await readBody(req);
    const session = sessions.get(sessionId);
    if (!session || !session.sandbox) return json(res, 200, { error: "sandbox not started" });
    const sb = session.sandbox;
    if (sb.finished) return json(res, 200, { msgs: sb.msgs, round: sb.round, finished: true });

    sb.msgs.push({ role: "user", name: "你", text });
    if (endNow) { sb.finished = true; return json(res, 200, { msgs: sb.msgs, round: sb.round, finished: true, suggestReport: true }); }
    if (sb.round >= sb.maxRounds) {
      sb.finished = true;
      sb.msgs.push({ role: "system", name: "", text: "本次评审模拟已充分。后续可以再聊，建议先查看你的评估报告。" });
      return json(res, 200, { msgs: sb.msgs, round: sb.round, finished: true, suggestReport: true });
    }
    sb.round++;

    // 轮转选择下一个发言的 Agent（根据内容简单匹配）
    const nextAgent = pickAgent(text, sb.msgs);
    let result;
    if (MODE === "real") {
      try { result = await sandboxAgentCall(nextAgent, sb.msgs); }
      catch (e) { result = { reply: sandboxFallback(nextAgent), satisfied: false }; }
    } else {
      result = { reply: sandboxFallback(nextAgent), satisfied: Math.random() < 0.2 };
    }
    sb.msgs.push({ role: nextAgent, name: SANDBOX_AGENTS[nextAgent].name, text: result.reply });

    // 人格驱动结束：Agent 满意度追踪
    if (result.satisfied) {
      sb.satisfaction = sb.satisfaction || {};
      sb.satisfaction[nextAgent] = true;
      const agentKeys = SANDBOX_SCENARIO.agents || ["dev", "biz", "qa"];
      const satCount = agentKeys.filter(k => sb.satisfaction[k]).length;
      if (satCount >= 2 && !sb.finished) {
        sb.finished = true;
        sb.msgs.push({ role: "system", name: "", text: "各方关切已得到充分回应，评审顺利结束。" });
      }
    }

    return json(res, 200, { mode: MODE, msgs: sb.msgs, round: sb.round, maxRounds: sb.maxRounds, finished: sb.finished });
  }

  if (url.pathname === "/api/sandbox/evaluate" && req.method === "POST") {
    const { sessionId } = await readBody(req);
    const session = sessions.get(sessionId);
    if (!session || !session.sandbox) return json(res, 200, { error: "sandbox not started" });
    const sb = session.sandbox;
    if (sb.evaluated) return json(res, 200, sb.evaluated);
    sb.finished = true;
    const result = MODE === "real" ? await sandboxEvaluate(sb.msgs) : sandboxVirtualEvaluate(sb.msgs);
    sb.evaluated = result;
    return json(res, 200, result);
  }

  res.writeHead(404); res.end("not found");
});

server.listen(PORT, () => console.log(`TalentOS M3 backend (${MODE} mode) on :${PORT}`));
