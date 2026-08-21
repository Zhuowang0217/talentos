# TalentOS · AI 原生人才培养平台（原型）

新道面试作业原型。以"AI 产品经理"岗位为样本，展示 AI 原生的高校人才培养闭环。

## 产品形态

自闭环培训产品，培训包为基本单元：**前测 → 必修/选修课程 + 情景模拟演练 → AI 导师实时答疑 → 后测成长报告**。
学生是唯一主角；教师以"必修课配置人"身份在场；企业以"真题出处"身份在场。

## 技术栈

纯前端静态站，零构建、零外部依赖：原生 HTML/CSS/JS + CSS 变量 token 体系（见根目录 DESIGN.md 规范）。

## 结构

```
index.html            单页入口（hash 路由五视图）
assets/css/tokens.css 设计 token（颜色/字号/间距/圆角，源自 DESIGN.md）
assets/css/app.css    布局与组件样式
assets/js/data.js     mock 数据层（能力图谱/画像/培训包/对话/证据）
assets/js/router.js   hash 路由
assets/js/app.js      视图渲染
```

## 开发

本地预览：`python -m http.server 8080` 后访问 http://localhost:8080
部署：scp 至阿里云服务器（47.84.76.0）nginx 静态目录。
