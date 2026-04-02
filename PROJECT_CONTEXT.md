# 粘豆包 (NianDouBao) — 项目上下文记忆文档

> 将此文档放入新对话窗口，AI 可以立即恢复所有项目记忆。
> 最后更新：2026-04-03

---

## 1. 项目概述

**粘豆包**是一款 AI 情感陪伴 App，目标用户为 18-28 岁年轻女性。核心体验是每日 3 分钟情绪签到 + AI 引导对话 + 微行动建议 + 心理工具箱。

**产品定位**：不是心理咨询，是一个懂你的闺蜜型 AI 伙伴。

**GitHub 仓库**：`git@github.com:yaohuanxia6-eng/-.git`（私有）

---

## 2. 技术栈

| 层 | 技术 | 说明 |
|---|------|------|
| 前端 | Next.js 14 + TypeScript + Tailwind CSS | App Router, 'use client' 模式 |
| UI 组件 | shadcn/ui + lucide-react | 自定义暖棕色设计系统 |
| 认证 | Supabase Auth | 邮箱+密码登录，JWT 验证 |
| 后端 | FastAPI (Python) | 异步，端口 8091 |
| 数据库 | MySQL (aiomysql) | 异步连接池 |
| AI 模型 | Kimi (moonshot-v1-8k) | 通过 OpenAI SDK 调用 |
| 部署 | Vercel (前端) + 自建服务器 (后端) | basePath: /projects/zhandoubao |

---

## 3. 项目文件结构

```
粘豆包/
├── api/zhandoubao/           # FastAPI 后端
│   ├── app.py                # 入口，注册 11 个路由
│   ├── auth.py               # Supabase JWT 验证
│   ├── database.py           # MySQL 异步连接池
│   ├── models.py             # 所有 Pydantic 模型
│   └── routers/
│       ├── health.py         # 健康检查
│       ├── sessions.py       # 每日会话 CRUD
│       ├── chat.py           # AI 对话 (SSE 流式)
│       ├── memory.py         # 记忆提炼系统
│       ├── profile.py        # 用户资料
│       ├── mbti.py           # MBTI 偏好
│       ├── diary.py          # 情绪日记
│       ├── safety_plan.py    # 安全计划
│       ├── gratitude.py      # 感恩记录
│       ├── cbt.py            # 认知重构
│       └── emotion.py        # 情绪记录
│
├── niandoubao/               # Next.js 前端
│   ├── app/
│   │   ├── (auth)/login/     # 登录页
│   │   ├── (main)/
│   │   │   ├── chat/         # 聊天主页 (连续对话，按日期分组)
│   │   │   ├── toolkit/      # 工具箱
│   │   │   │   ├── page.tsx  # 6工具网格
│   │   │   │   ├── breathing/    # 4-7-8 呼吸练习
│   │   │   │   ├── diary/        # 情绪日记 + history/
│   │   │   │   ├── cbt/          # 认知重构
│   │   │   │   ├── grounding/    # 感官落地 5-4-3-2-1
│   │   │   │   ├── safety-plan/  # 安全计划
│   │   │   │   └── gratitude/    # 感恩记录 + history/
│   │   │   ├── history/      # 情绪记录 (日历+趋势+统计)
│   │   │   ├── settings/     # 我的 (个人设置)
│   │   │   ├── onboarding/   # MBTI 引导页
│   │   │   └── layout.tsx    # 主布局 (含 BottomNav)
│   │   └── api/              # Next.js API 代理路由 (11个)
│   ├── components/
│   │   ├── layout/AppHeader.tsx, BottomNav.tsx
│   │   ├── chat/ChatBubble, ChatInput, MicroActionCard, CrisisCard
│   │   └── ui/               # shadcn 基础组件
│   ├── lib/
│   │   ├── supabase/client.ts, server.ts, admin.ts
│   │   ├── deepseek/client.ts, prompts.ts
│   │   └── crisis/detector.ts
│   └── types/index.ts
│
├── database/schema.sql       # 完整数据库建表 SQL (7张新表)
├── prototype.html            # 交互原型 (单文件 HTML)
├── vibe-prd-情绪疗愈/         # AI Building Spec
└── 产品文档/                  # 6份产品文档 (定位/竞品/画像/PRD/Prompt/IA)
```

---

## 4. 数据库表

### 已有表
- `user_profiles` — 用户资料 (id, email, nickname, reminder_*)
- `sessions` — 每日会话 (messages JSON, emotion_type, micro_action)
- `memory_summary` — AI 记忆 (key_facts JSON, 最多10条)

### 新增表 (schema.sql)
- `user_mbti` — MBTI 偏好 (ei, sn, tf, jp, mbti_type)
- `diary_entries` — 情绪日记 (mode, event, body_reaction, thought, self_talk, mood)
- `safety_plans` — 安全计划 (signals, self_help, contacts, meaning) per user
- `gratitude_entries` — 感恩记录 (items JSON, day_number)
- `cbt_records` — 认知重构 (thought, score_before/after, reframe, observation)
- `emotion_records` — 每日情绪 (emotion, sub_emotion, score, record_date)
- `grounding_sessions` — 感官落地 (steps_data JSON)

---

## 5. 核心 API 端点

### 后端 (FastAPI, port 8091)
```
GET/PUT    /mbti             MBTI 偏好
POST/GET   /diary            日记 CRUD
GET/DELETE /diary/{id}
GET/PUT    /safety-plan      安全计划
POST/GET   /gratitude        感恩记录
GET        /gratitude/streak 连续天数
POST/GET   /cbt              认知重构
GET        /cbt/today        今日是否已做
POST       /emotion          记录情绪
GET        /emotion/history  历史趋势
GET        /emotion/trend    图表数据
POST       /chat             AI 对话 (SSE)
POST       /sessions/today   获取/创建今日会话
GET        /sessions/yesterday
POST       /memory/extract   提炼记忆
GET/PUT    /profile          用户资料
```

### 前端 API 代理 (Next.js → FastAPI)
所有 `/api/*` 路由代理到后端，自动附加 Supabase JWT token。

---

## 6. 设计系统

### 颜色
- Primary (棕): #8B7355 (系列: warm.50-900)
- Accent (绿): #7BAE84 (系列: accent.50-800)
- Background: #FBF7F0
- Surface: #FFFFFF
- Surface-2: #F5EFE6
- Text: #3D2F1F (primary), #7A6350 (secondary), #B8A898 (muted)
- Crisis (红): #C0392B

### 字体
- 标题: 'Lora' / 'Noto Serif SC' (serif)
- 正文: 'Noto Sans SC' / 'PingFang SC' (sans-serif)

### 圆角
- Card: 12px, Bubble: varies, Input: 10px, Button: 8px

---

## 7. AI 对话系统设计

### 对话模式：连续对话（不是每次新开）
- 打开 App 看到的是历史消息（按日期分组），可往上滚动
- 每天 AI 主动问候，引用昨天的话题（"昨天你说被批评了方案，今天好点了吗？"）
- 没有"新对话"按钮

### 记忆系统
- **即时上下文**：最近 30 条消息直接发给 AI
- **长期记忆**：AI 从对话中提炼关键事实 (5类，共≤10条)，每次对话带入 system prompt
- **昨日微行动**：第二天 AI 会追问"昨天建议的 XXX，做了吗？"

### System Prompt 结构
```
角色设定 + 性格 + 对话节奏 + 签到6步骤 + 微行动规范 + 禁止事项
+ [记忆事实] + [昨日微行动追问]
```

### 危机检测
关键词匹配（想死/自杀/轻生等 12 个词），触发危机卡片 + 专业热线。

---

## 8. 工具箱 6 大工具

| 工具 | 路由 | 核心交互 |
|------|------|----------|
| 🫁 呼吸练习 | /toolkit/breathing | 4-7-8 动画，4轮 |
| ✍️ 情绪日记 | /toolkit/diary | 引导/自由模式，心情选择，历史+导出 |
| 🧠 认知重构 | /toolkit/cbt | 6步填写→生成观察，每日可重置 |
| 🧘 感官落地 | /toolkit/grounding | 5-4-3-2-1 逐步引导 |
| 🛡️ 安全计划 | /toolkit/safety-plan | 填写→保存→只读→可编辑 |
| 🌟 感恩记录 | /toolkit/gratitude | 21天挑战，3+条好事，历史 |

---

## 9. MBTI 引导系统

首次登录显示 4 维度选择：E/I, S/N, T/F, J/P。
- 选完后保存到 /api/mbti
- 影响 AI 对话风格和工具推荐
- 可跳过，使用默认风格

---

## 10. 环境变量

### 后端 (.env)
```
DB_HOST, DB_USER, DB_PASSWORD, DB_NAME
SUPABASE_JWT_SECRET
KIMI_API_KEY, KIMI_BASE_URL, AI_MODEL
```

### 前端 (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_API_URL (default: http://localhost:8091/api/zhandoubao)
KIMI_API_KEY, KIMI_BASE_URL, AI_MODEL
```

---

## 11. 本地开发启动

```bash
# 后端
cd api/zhandoubao
pip install -r requirements.txt
python app.py  # port 8091

# 前端
cd niandoubao
npm install
npm run dev -- --port 3002

# 数据库
mysql -u root < database/schema.sql
```

---

## 12. 交互原型

`prototype.html` 是完整的单文件交互原型（~3200行），包含所有页面和交互逻辑。
- 可用 `npx serve /tmp` 预览（需先复制到 /tmp 避免中文路径问题）
- 原型中的所有功能已在前后端代码中实现

---

## 13. 已知待办 & 注意事项

- [ ] 运行 `database/schema.sql` 创建新表
- [ ] 前端 onboarding 页需要在首次登录时引导（可在 middleware 检查 MBTI 是否已设置）
- [ ] 情绪日记的"导出"功能目前是 alert 模拟，正式版需实现图片/PDF 导出
- [ ] 呼吸练习的动画在低端设备上可能需要性能优化
- [ ] 安全计划的"危机自动弹出"功能需在聊天中检测到危机关键词时触发
- [ ] basePath 设置为 `/projects/zhandoubao`（Vercel 部署用），本地开发可能需要调整
- [ ] 产品文档在 `产品文档/` 目录下，含 6 份完整文档
