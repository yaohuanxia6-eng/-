# 粘豆包 · AI Building Spec

> 面向 AI 编程 Agent（Claude Code / Cursor / Trae）的执行规范文档
> 最后更新：2026-04-03
> 状态：V1.1 开发完成

---

## 模块1：项目概述

> 最后更新：2026-04-03
> 依赖模块：无

### 1.1 产品定位

**产品名称**：粘豆包（英文：NianDouBao）
**产品类型**：Web App（移动端优先的响应式设计）
**核心定位**：帮年轻女性养成"每日情绪签到"习惯，通过AI引导+微行动闭环，逐步缓解焦虑和空虚感。不是情感替代品，是陪伴成长的工具。

### 1.2 目标用户

- **人群**：18-28岁年轻女性（在校大学生 + 刚毕业的职场新人）
- **核心场景**：晚上睡前 / 午休 / 情绪低落时 / 通勤路上
- **核心需求**：有情绪想倾诉但不想打扰朋友；想变好但不知道从哪里开始
- **设备**：以手机浏览器为主，桌面端兼容
- **审美偏好**：温暖、细腻、有质感；排斥冷冰冰的科技感和说教感

### 1.3 MVP核心价值主张

> "每天3分钟，粘豆包记住你的故事，陪你找到今天能做的一件小事。"

### 1.4 MVP功能范围（已锁定）

| 功能 | 描述 | 优先级 |
|------|------|--------|
| 引导式情绪签到对话 | 每天一次，3-5分钟结构化短对话 | P0 |
| 微行动建议 + 完成反馈 | 签到后给1个微行动，次日追问反馈 | P0 |
| 跨会话记忆 | AI记住近期关键信息，每次对话有延续感 | P0 |
| 每日定时邮件提醒 | 用户设定时间，到点发送提醒邮件 | P1 |
| 危机关键词兜底 | 检测极端情绪关键词，展示危机热线 | P0（安全底线） |

**MVP不做**：情绪曲线可视化、月度报告、匿名社区、导出功能、微信登录

### 1.5 核心用户流程

```
用户收到邮件提醒
    ↓
打开 App → 手机号登录（首次注册）
    ↓
进入今日签到对话（AI主导，3-5分钟）
    ↓
AI输出情绪快照 + 给出1个微行动建议
    ↓
用户去做微行动（离开App）
    ↓
次日打开 App
    ↓
AI先追问昨日微行动反馈 → 进入今日签到
    ↓
（循环，AI每次对话引用历史记忆，越用越懂你）
```

### 1.6 产品原则

1. **情绪价值优先**：先共情，再建议。AI永远先说"我听到了"，不急着给解决方案
2. **AI主导对话节奏**：不是用户填表，是AI问用户答，追问到具体
3. **每次只给1个微行动**：不给建议清单，只给今天能做的一件小事，像闺蜜帮你想的那种
4. **记忆优于功能**：让用户感受到"它记得我"比任何新功能都重要
5. **不制造依赖**：微行动方向是引导用户走向真实生活，不是留在App里

### 1.7 AI语气规范（全局）

粘豆包的AI说话风格：
- **像一个懂你的闺蜜，不像心理咨询师**：温柔、有共情、偶尔幽默，但不油腻
- **先接住情绪，再往下走**：用户说"好烦啊"，不是马上问"为什么烦"，而是先说"听起来今天挺累的"
- **不说教，不给大道理**：绝对不出现"你要学会接受"、"这很正常"、"你应该"这类话
- **语言简短有温度**：每条回复控制在80字以内，像发微信，不像写报告
- **结尾有钩子**：每条AI消息结尾带一个具体的追问，推动对话继续

### 1.8 安全与合规原则

- 产品定位为**情绪支持工具**，不做心理诊断、不声称可治疗疾病
- 检测到危机关键词时，**暂停AI对话**，直接展示危机干预卡片
- 危机热线：全国心理援助热线 **400-161-9995** / 北京心理危机研究与干预中心 **010-82951332**
- 所有用户数据加密存储，不用于模型训练

---

## 模块2：技术栈与环境配置

> 最后更新：2026-04-03
> 依赖模块：模块1

### 2.1 项目初始化命令

```bash
# 创建项目
npx create-next-app@14 niandoubao --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*"
cd niandoubao

# 安装核心依赖
npm install @supabase/supabase-js@^2 @supabase/ssr@^0 openai@^4 resend@^3

# 安装 shadcn/ui
npx shadcn@latest init
# 选择：Default → Yes（使用 CSS variables）→ 回车

# 安装常用 shadcn 组件
npx shadcn@latest add button input card textarea toast avatar badge

# 安装工具库
npm install clsx tailwind-merge lucide-react date-fns
```

### 2.2 项目文件结构

```
niandoubao/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx          # 邮箱+密码登录页
│   │   └── layout.tsx
│   ├── (main)/
│   │   ├── chat/
│   │   │   └── page.tsx          # 核心签到对话页（连续对话，按日期分组）
│   │   ├── toolkit/
│   │   │   ├── page.tsx          # 6工具网格入口
│   │   │   ├── layout.tsx
│   │   │   ├── breathing/page.tsx    # 4-7-8 呼吸练习
│   │   │   ├── diary/
│   │   │   │   ├── page.tsx          # 情绪日记（引导/自由模式）
│   │   │   │   └── history/page.tsx  # 日记历史 + 逐条导出
│   │   │   ├── cbt/page.tsx          # 认知重构 6 步
│   │   │   ├── grounding/page.tsx    # 感官落地 5-4-3-2-1
│   │   │   ├── safety-plan/page.tsx  # 安全计划
│   │   │   └── gratitude/
│   │   │       ├── page.tsx          # 感恩记录 21 天挑战
│   │   │       └── history/page.tsx  # 感恩历史
│   │   ├── history/
│   │   │   └── page.tsx          # 情绪记录（30天日历+趋势+统计）
│   │   ├── settings/
│   │   │   └── page.tsx          # 个人设置页
│   │   ├── onboarding/
│   │   │   └── page.tsx          # MBTI 引导页
│   │   └── layout.tsx            # 主布局（含 BottomNav）
│   ├── api/                      # Next.js API 代理路由（11个）
│   │   ├── chat/route.ts
│   │   ├── mbti/route.ts
│   │   ├── diary/route.ts
│   │   ├── diary/[id]/route.ts
│   │   ├── safety-plan/route.ts
│   │   ├── gratitude/route.ts
│   │   ├── gratitude/streak/route.ts
│   │   ├── cbt/route.ts
│   │   ├── cbt/today/route.ts
│   │   ├── emotion/route.ts
│   │   ├── emotion/history/route.ts
│   │   └── emotion/trend/route.ts
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
│
├── components/
│   ├── ui/                       # shadcn 基础组件
│   ├── chat/
│   │   ├── ChatBubble.tsx
│   │   ├── ChatInput.tsx
│   │   ├── MicroActionCard.tsx
│   │   └── CrisisCard.tsx
│   └── layout/
│       ├── AppHeader.tsx         # 顶部导航（返回/品牌 + 头像）
│       └── BottomNav.tsx         # 底部4Tab导航
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── admin.ts
│   ├── deepseek/
│   │   ├── client.ts             # Kimi/DeepSeek API 初始化
│   │   └── prompts.ts            # System prompt 集中管理
│   └── crisis/
│       └── detector.ts           # 危机关键词检测
│
├── types/
│   └── index.ts                  # 全局 TypeScript 类型
│
├── middleware.ts                 # 路由保护（Supabase Auth）
├── .env.local
├── next.config.ts
├── tailwind.config.ts
└── package.json
```

### 2.3 登录方式设计

用户使用**邮箱 + 密码**登录/注册，基于 Supabase Auth。

```
┌─────────────────────────────────┐
│  📱 手机号登录  │  📧 邮箱登录  │  ← Tab 切换
├─────────────────────────────────┤
│  （当前 Tab 对应的表单）         │
└─────────────────────────────────┘
```

**Tab A：手机号 + 短信验证码**
```
用户输入手机号 → POST /api/auth/send-otp（阿里云SMS）
→ 输入6位验证码 → POST /api/auth/verify-otp
→ Supabase 创建/匹配用户 → 跳转 /chat
```

**Tab B：邮箱 Magic Link（163 / QQ / Gmail 等均支持）**
```
用户输入邮箱 → supabase.auth.signInWithOtp({ email })
→ Supabase 通过 Resend SMTP 发送登录链接
→ 用户点击邮件中的链接 → 自动登录 → 跳转 /chat
```

> **推荐启动顺序**：先上线邮箱登录（0额外配置），让种子用户用起来；
> 阿里云SMS审核通过后再开放手机号 Tab，只改 `LoginForm.tsx` 一处。

**Supabase 邮件 SMTP 配置（在 Dashboard 完成，不写代码）**：
- Supabase Dashboard → Project Settings → Authentication → SMTP Settings
- Host: `smtp.resend.com` · Port: `465` · User: `resend` · Password: `{{RESEND_API_KEY}}`
- Sender email: `remind@{{你的域名}}`
- 配置完后，163/QQ/Gmail 等所有邮箱均可收到登录链接

### 2.4 环境变量配置

在项目根目录创建 `.env.local` 文件：

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://{{你的项目ID}}.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY={{anon_key}}
SUPABASE_SERVICE_ROLE_KEY={{service_role_key}}

# DeepSeek
DEEPSEEK_API_KEY={{deepseek_api_key}}
DEEPSEEK_BASE_URL=https://api.deepseek.com

# Resend（登录邮件 + 每日提醒，共用一个Key）
RESEND_API_KEY={{resend_api_key}}
RESEND_FROM_EMAIL=粘豆包 <remind@{{你的域名}}>

# 阿里云SMS（手机号验证码，MVP第二阶段再配）
ALIYUN_SMS_ACCESS_KEY_ID={{access_key_id}}
ALIYUN_SMS_ACCESS_KEY_SECRET={{access_key_secret}}
ALIYUN_SMS_SIGN_NAME=粘豆包
ALIYUN_SMS_TEMPLATE_CODE={{模板CODE，如"SMS_123456789"}}
```

> **获取方式（给技术小白）**
> - Supabase 密钥：supabase.com → 你的项目 → Settings → API
> - DeepSeek API Key：platform.deepseek.com → API Keys → 创建
> - Resend API Key：resend.com → API Keys → Create API Key（免费 3000封/月）
> - 阿里云SMS：console.aliyun.com → 短信服务（审核约1-3天，不急）

### 2.5 Supabase 数据库初始化 SQL

在 Supabase Dashboard → SQL Editor 中执行：

```sql
-- 用户扩展信息表
CREATE TABLE public.user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  phone TEXT,
  email TEXT,                       -- 邮箱登录时记录
  nickname TEXT DEFAULT '小豆包',
  reminder_email TEXT,              -- 提醒发送目标（可与登录邮箱不同）
  reminder_time TIME DEFAULT '21:00:00',
  reminder_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 每日签到会话表
CREATE TABLE public.sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_date DATE NOT NULL,
  emotion_type TEXT CHECK (emotion_type IN ('焦虑','空虚','低落','平静','愉悦','混乱')),
  emotion_snapshot TEXT,
  micro_action TEXT,
  micro_action_done BOOLEAN DEFAULT false,
  micro_action_feedback TEXT,
  messages JSONB DEFAULT '[]',
  status TEXT CHECK (status IN ('in_progress','completed')) DEFAULT 'in_progress',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, session_date)
);

-- 跨会话记忆表（每用户一条，滚动更新）
CREATE TABLE public.memory_summary (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  key_facts JSONB DEFAULT '[]',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security（用户只能读写自己的数据）
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memory_summary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "用户只能操作自己的数据" ON public.user_profiles
  FOR ALL USING (auth.uid() = id);
CREATE POLICY "用户只能操作自己的数据" ON public.sessions
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "用户只能操作自己的数据" ON public.memory_summary
  FOR ALL USING (auth.uid() = user_id);
```

### 2.6 核心依赖版本

```json
{
  "dependencies": {
    "next": "14.2.x",
    "react": "^18.3.x",
    "typescript": "^5.x",
    "@supabase/supabase-js": "^2.45.x",
    "@supabase/ssr": "^0.5.x",
    "openai": "^4.67.x",
    "resend": "^3.5.x",
    "clsx": "^2.x",
    "tailwind-merge": "^2.x",
    "lucide-react": "^0.460.x",
    "date-fns": "^4.x"
  }
}
```

### 2.7 DeepSeek 客户端初始化

```typescript
// lib/deepseek/client.ts
import OpenAI from 'openai'

export const aiClient = new OpenAI({
  apiKey: process.env.KIMI_API_KEY ?? process.env.DEEPSEEK_API_KEY ?? 'sk-placeholder',
  baseURL: process.env.KIMI_BASE_URL ?? process.env.DEEPSEEK_BASE_URL ?? 'https://api.moonshot.cn/v1',
})

export const CHAT_MODEL = process.env.AI_MODEL ?? 'moonshot-v1-8k'
```

---

## 模块3：设计规范（Design Tokens）

> 最后更新：2026-03-14
> 依赖模块：模块2
> 风格：D · 纸本晴天

### 3.1 Tailwind CSS 配置

替换 `tailwind.config.ts` 内容：

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // 主色系（棕褐）
        primary: {
          DEFAULT: '#8B7355',
          light:   '#A89070',
          dark:    '#6B5640',
        },
        // 强调色（鼠尾草绿）
        accent: {
          DEFAULT: '#7BAE84',
          light:   '#A3C9A8',
          dark:    '#5A9468',
        },
        // 背景与表面
        background: '#FBF7F0',   // 米白底
        surface:    '#FFFFFF',   // 卡片白
        'surface-2': '#F5EFE6',  // 稍深一层
        // 文字
        'text-primary':   '#3D2F1F',  // 深棕主文字
        'text-secondary': '#7A6350',  // 次级文字
        'text-muted':     '#B8A898',  // 提示文字
        // 边框
        border:       'rgba(139,115,85,0.15)',
        'border-dark':'rgba(139,115,85,0.25)',
        // 危机色
        crisis: '#C0392B',
      },
      fontFamily: {
        serif: ['"Lora"', '"Noto Serif SC"', 'Georgia', 'serif'],
        sans:  ['"Noto Sans SC"', '"PingFang SC"', 'sans-serif'],
      },
      fontSize: {
        'title-lg': ['22px', { lineHeight: '1.4', fontWeight: '600' }],
        'title-md': ['18px', { lineHeight: '1.5', fontWeight: '600' }],
        'title-sm': ['15px', { lineHeight: '1.5', fontWeight: '600' }],
        'body-lg':  ['15px', { lineHeight: '1.8' }],
        'body-md':  ['14px', { lineHeight: '1.8' }],
        'body-sm':  ['13px', { lineHeight: '1.7' }],
        'label':    ['11px', { lineHeight: '1.4', letterSpacing: '0.06em' }],
      },
      borderRadius: {
        'card':   '12px',
        'bubble': '14px',
        'input':  '10px',
        'btn':    '8px',
        'chip':   '99px',
      },
      boxShadow: {
        'card':   '0 1px 6px rgba(139,115,85,0.08), 0 4px 16px rgba(139,115,85,0.04)',
        'card-hover': '0 4px 16px rgba(139,115,85,0.14)',
        'btn':    '0 2px 8px rgba(139,115,85,0.2)',
      },
      spacing: {
        'page-x':  '20px',   // 页面水平内边距
        'page-y':  '24px',   // 页面垂直内边距
        'section': '24px',   // 区块间距
        'item':    '12px',   // 列表项间距
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
```

### 3.2 全局 CSS 变量

在 `app/globals.css` 顶部添加：

```css
@import url('https://fonts.googleapis.com/css2?family=Lora:wght@400;600&family=Noto+Sans+SC:wght@300;400;500&family=Noto+Serif+SC:wght@400;600&display=swap');

:root {
  --color-primary:      #8B7355;
  --color-accent:       #7BAE84;
  --color-background:   #FBF7F0;
  --color-surface:      #FFFFFF;
  --color-text-primary: #3D2F1F;
  --color-border:       rgba(139,115,85,0.15);
}

body {
  background-color: var(--color-background);
  color: var(--color-text-primary);
  font-family: 'Noto Sans SC', 'PingFang SC', sans-serif;
  -webkit-font-smoothing: antialiased;
}

/* 标题统一用衬线字体 */
h1, h2, h3 {
  font-family: 'Lora', 'Noto Serif SC', Georgia, serif;
}
```

### 3.3 组件级样式常量

在 `lib/styles.ts` 中集中定义复用 className：

```typescript
// lib/styles.ts
export const styles = {
  // 页面容器
  page: 'min-h-screen bg-background px-page-x py-page-y max-w-md mx-auto',

  // 卡片
  card: 'bg-surface rounded-card shadow-card border border-border p-4',

  // 对话气泡
  bubbleAI:   'bg-surface border border-border rounded-[4px_14px_14px_14px] px-4 py-3 text-body-md text-text-primary shadow-card max-w-[85%]',
  bubbleUser: 'bg-[rgba(139,115,85,0.08)] border border-border-dark rounded-[14px_4px_14px_14px] px-4 py-3 text-body-md text-text-primary ml-auto max-w-[85%]',

  // 按钮
  btnPrimary:   'bg-primary text-white rounded-btn px-4 py-2.5 text-body-sm font-medium shadow-btn hover:bg-primary-dark transition-colors',
  btnSecondary: 'bg-surface border border-border text-text-primary rounded-btn px-4 py-2.5 text-body-sm hover:bg-surface-2 transition-colors',
  btnText:      'text-primary text-body-sm hover:underline',

  // 输入框
  input: 'bg-surface border border-border rounded-input px-4 py-3 text-body-md text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary-light w-full',

  // 微行动卡片
  actionCard: 'bg-[rgba(123,174,132,0.08)] border border-[rgba(123,174,132,0.2)] rounded-card p-4',

  // 危机卡片
  crisisCard: 'bg-[#FEF2F2] border border-[rgba(192,57,43,0.2)] rounded-card p-4',
}
```

---

## 模块4：页面与组件清单

> 最后更新：2026-03-14
> 依赖模块：模块2、模块3

### 4.1 页面清单

#### `/login` — 登录页

```
布局：全屏居中，背景 #FBF7F0
内容：
  ├── Logo + 产品名"粘豆包"（Lora字体，primary色）
  ├── 一句话slogan（"每天3分钟，记住你的故事"）
  ├── Tab切换（手机号 / 邮箱）
  ├── LoginForm.tsx
  └── 底部：隐私政策说明（小字，text-muted）
```

#### `/chat` — 核心签到对话页（主页面）

```
布局：固定高度视口，flex column
内容：
  ├── AppHeader.tsx（顶部，固定）
  │     ├── 左：Logo文字
  │     └── 右：用户昵称 + 头像
  ├── 对话区（flex-1，可滚动，底部有padding防输入框遮挡）
  │     ├── 日期标签（"3月14日 · 第12天"）
  │     ├── ChatBubble.tsx × N（AI/用户交替）
  │     └── MicroActionCard.tsx（签到完成后显示）
  ├── CrisisCard.tsx（触发后替换输入框）
  └── ChatInput.tsx（底部固定，safe-area-inset-bottom）
```

#### `/settings` — 设置页

```
布局：普通滚动页面
内容：
  ├── AppHeader.tsx（带返回按钮）
  ├── 个人信息区：昵称修改
  ├── 提醒设置区：
  │     ├── 提醒邮箱（输入框）
  │     ├── 提醒时间（time picker）
  │     └── 开启/关闭 Toggle
  └── 账号区：退出登录
```

### 4.2 组件规格

#### `ChatBubble.tsx`

```typescript
interface ChatBubbleProps {
  role: 'ai' | 'user'
  content: string
  isStreaming?: boolean   // AI流式输出时显示打字光标
}
// AI气泡：左对齐，styles.bubbleAI，前置豆包头像（12px棕色圆圈）
// 用户气泡：右对齐，styles.bubbleUser，无头像
// isStreaming=true时：content末尾追加 | 光标，0.8s闪烁
```

#### `ChatInput.tsx`

```typescript
interface ChatInputProps {
  onSend: (message: string) => void
  disabled?: boolean
  placeholder?: string
}
// 布局：圆角输入框（多行，最高4行自动扩展）+ 右侧发送按钮
// 发送按钮：bg-primary，圆形，箭头icon
// disabled=true时：输入框变灰，显示"粘豆包正在思考…"
// 支持 Enter 发送，Shift+Enter 换行
```

#### `MicroActionCard.tsx`

```typescript
interface MicroActionCardProps {
  action: string
  done: boolean
  onMarkDone: () => void
}
// 样式：styles.actionCard
// 顶部标签：accent色小字"今日微行动"
// 正文：Lora字体，action内容
// 底部：done=false → "我去做了" 按钮；done=true → "✓ 已完成" 绿色文字
```

#### `CrisisCard.tsx`

```typescript
// 无 props，固定内容
// 样式：styles.crisisCard，替换输入框
// 内容：
//   标题："我在这里陪着你"（Lora，crisis色）
//   文字：温柔的过渡语 + 专业支持提示
//   热线列表：400-161-9995 / 010-82951332（可点击拨打）
//   底部：小字"粘豆包不是心理医生，但这些人可以帮你"
```

#### `LoginForm.tsx`

```typescript
// Tab A（手机号）：
//   手机号输入框（+86前缀）→ 发送验证码按钮（60s倒计时）→ 验证码输入框 → 登录
// Tab B（邮箱）：
//   邮箱输入框 → "发送登录链接"按钮 → 成功提示"链接已发送，请查收邮件"
// 首次登录自动创建 user_profiles 记录（nickname默认'小豆包'）
```

#### `AppHeader.tsx`

```typescript
interface AppHeaderProps {
  showBack?: boolean
  onBack?: () => void
  title?: string
}
// 高度 56px，bg-surface，border-bottom
// 左：showBack ? 返回箭头 : Logo（"粘豆包" Lora字体）
// 中：title（如有）
// 右：用户头像（首字母圆圈，primary色背景）
```

---

## 模块5：AI能力配置

> 最后更新：2026-03-14
> 依赖模块：模块2、模块1（语气规范）

### 5.1 主对话 System Prompt

存放于 `lib/deepseek/prompts.ts`：

```typescript
export function buildChatSystemPrompt(memory: MemoryFact[], yesterdayAction?: string): string {
  const memoryBlock = memory.length > 0
    ? `\n\n【你记住的关于她的事】\n${memory.map(f => `- ${f.fact}`).join('\n')}`
    : ''

  const yesterdayBlock = yesterdayAction
    ? `\n\n【昨天给她的微行动】\n"${yesterdayAction}"\n对话开始时，先温柔地问她做了没有、感觉怎样，再进入今天的签到。`
    : ''

  return `你是粘豆包，一个陪伴年轻女性的AI情绪助手。

【你的性格】
- 像一个懂她的闺蜜，温柔、细腻、有共情，偶尔带点小幽默，但绝不油腻
- 永远先接住情绪，不急着给建议
- 说话简短，像发微信，不写长段落
- 每条回复80字以内，结尾带一个具体的追问推动对话
- 绝对不说教，不出现"你应该"、"你要学会"、"这很正常"这类话

【今日签到任务】
引导她完成一次3-5分钟的情绪签到，按顺序推进：
1. 先问今天大概感觉怎样（开放式，不给选项）
2. 追问具体——是什么让她有这种感觉？
3. 再追问深一层——这件事让她担心/难受的点是什么？
4. 给出一个情绪的"命名"（"听起来你现在是…的感觉"）
5. 给出1个今天可以做的微行动（具体、小、今天能完成的）
6. 签到结束时说一句温暖的结束语，告诉她明天还会在

【微行动规范】
- 只给1个，不给清单
- 必须是今天能完成的小事（5-15分钟以内）
- 方向是走向真实生活，不是"多用粘豆包"
- 示例：散步10分钟、给一个朋友发一条消息、吃一顿好一点的饭、写下3件今天还不错的事
- 格式：直接描述行动，不用"建议你"开头${memoryBlock}${yesterdayBlock}

【禁止事项】
- 不做心理诊断，不评判她的情绪好坏
- 不问超过2个问题（一次只问1个）
- 不生成长于80字的回复
- 不重复她刚说过的话（不要"我听到你说…"句式）`
}
```

### 5.2 记忆提炼 Prompt

```typescript
export const MEMORY_EXTRACT_PROMPT = `你是一个信息提炼助手。
从下面这段对话中，提炼出最多5条关于用户的重要事实。
这些事实将在未来的对话中帮助AI更好地了解她。

要求：
- 只提炼稳定的、有价值的信息（压力来源、重要关系、近期困境、有效的微行动等）
- 不提炼当天心情（太短暂）
- 格式：JSON数组，每条 {"fact": "...", "category": "压力源|人际关系|近期困境|有效策略|其他"}
- 最多5条，宁缺勿滥

输出示例：
[
  {"fact": "她在备考考研，主要压力来自统计学", "category": "压力源"},
  {"fact": "她和室友关系有些紧张，不愿意在宿舍待太久", "category": "人际关系"}
]

只输出JSON数组，不要其他文字。`
```

### 5.3 DeepSeek 调用参数

```typescript
// 主对话：流式输出
const stream = await deepseek.chat.completions.create({
  model: CHAT_MODEL,
  stream: true,
  temperature: 0.85,       // 稍高，语气更自然
  max_tokens: 200,         // 限制回复长度
  presence_penalty: 0.3,  // 减少重复
  messages: [
    { role: 'system', content: systemPrompt },
    ...conversationHistory,  // 当日对话历史
    { role: 'user', content: userMessage },
  ],
})

// 记忆提炼：非流式，单次调用
const extraction = await deepseek.chat.completions.create({
  model: CHAT_MODEL,
  stream: false,
  temperature: 0.2,   // 低温，稳定输出JSON
  max_tokens: 400,
  messages: [
    { role: 'system', content: MEMORY_EXTRACT_PROMPT },
    { role: 'user', content: `对话内容：\n${conversationText}` },
  ],
})
```

### 5.4 危机关键词检测

```typescript
// lib/crisis/detector.ts
const CRISIS_KEYWORDS = [
  '想死', '去死', '不想活', '自杀', '结束生命', '活不下去',
  '不想活了', '消失算了', '了结', '跳楼', '割腕', '轻生',
]

export function detectCrisis(text: string): boolean {
  return CRISIS_KEYWORDS.some(keyword => text.includes(keyword))
}

// 使用：每次用户发送消息前检测
// 检测到 → 停止AI对话，显示 CrisisCard，记录到 sessions.emotion_type='危机'（扩展枚举）
```

---

## 模块6：数据模型

> 最后更新：2026-03-14
> 依赖模块：模块2（数据库表结构）

### 6.1 TypeScript 类型定义

全部放入 `types/index.ts`：

```typescript
// types/index.ts

// ── 用户 ──────────────────────────────────────
export interface UserProfile {
  id: string
  phone: string | null
  email: string | null
  nickname: string
  reminder_email: string | null
  reminder_time: string        // "21:00:00"
  reminder_enabled: boolean
  created_at: string
  updated_at: string
}

// ── 对话消息 ──────────────────────────────────
export interface Message {
  role: 'ai' | 'user'
  content: string
  timestamp: string            // ISO string
}

// ── 每日签到会话 ──────────────────────────────
export type EmotionType = '焦虑' | '空虚' | '低落' | '平静' | '愉悦' | '混乱' | '危机'

export interface Session {
  id: string
  user_id: string
  session_date: string         // "2026-03-14"
  emotion_type: EmotionType | null
  emotion_snapshot: string | null   // AI生成的本次情绪摘要
  micro_action: string | null
  micro_action_done: boolean
  micro_action_feedback: string | null
  messages: Message[]
  status: 'in_progress' | 'completed'
  created_at: string
}

// ── 跨会话记忆 ────────────────────────────────
export interface MemoryFact {
  fact: string
  category: '压力源' | '人际关系' | '近期困境' | '有效策略' | '其他'
  updated_at: string
}

export interface MemorySummary {
  id: string
  user_id: string
  key_facts: MemoryFact[]      // 最多保留10条，按 updated_at 滚动
  updated_at: string
}

// ── API请求/响应 ──────────────────────────────
export interface ChatRequest {
  message: string
  session_id: string
}

export interface ChatResponse {
  // 流式响应，见模块7
}
```

---

## 模块7：核心业务逻辑

> 最后更新：2026-03-14
> 依赖模块：模块5、模块6

### 7.1 对话接口（流式）

```typescript
// app/api/chat/route.ts
import { NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { deepseek, CHAT_MODEL } from '@/lib/deepseek/client'
import { buildChatSystemPrompt } from '@/lib/deepseek/prompts'
import { detectCrisis } from '@/lib/crisis/detector'

export async function POST(req: NextRequest) {
  const { message, session_id } = await req.json()
  const supabase = createServerClient()

  // 1. 鉴权
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  // 2. 危机检测（优先于一切）
  if (detectCrisis(message)) {
    await supabase.from('sessions').update({
      emotion_type: '危机'
    }).eq('id', session_id)
    return Response.json({ type: 'crisis' })
  }

  // 3. 读取记忆 + 昨日微行动
  const [{ data: memory }, { data: yesterday }] = await Promise.all([
    supabase.from('memory_summary').select('key_facts').eq('user_id', user.id).single(),
    supabase.from('sessions')
      .select('micro_action')
      .eq('user_id', user.id)
      .eq('session_date', new Date(Date.now() - 86400000).toISOString().slice(0, 10))
      .single(),
  ])

  // 4. 读取当前session历史消息
  const { data: session } = await supabase
    .from('sessions').select('messages').eq('id', session_id).single()

  const history = (session?.messages ?? []).map((m: Message) => ({
    role: m.role === 'ai' ? 'assistant' : 'user',
    content: m.content,
  }))

  // 5. 构建system prompt + 调用DeepSeek（流式）
  const systemPrompt = buildChatSystemPrompt(
    memory?.key_facts ?? [],
    yesterday?.micro_action ?? undefined
  )

  const stream = await deepseek.chat.completions.create({
    model: CHAT_MODEL,
    stream: true,
    temperature: 0.85,
    max_tokens: 200,
    presence_penalty: 0.3,
    messages: [
      { role: 'system', content: systemPrompt },
      ...history,
      { role: 'user', content: message },
    ],
  })

  // 6. 流式返回 + 后台保存消息
  let fullResponse = ''
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content ?? ''
        if (text) {
          fullResponse += text
          controller.enqueue(new TextEncoder().encode(text))
        }
      }
      controller.close()

      // 7. 流结束后，保存消息到数据库
      const updatedMessages = [
        ...(session?.messages ?? []),
        { role: 'user', content: message, timestamp: new Date().toISOString() },
        { role: 'ai', content: fullResponse, timestamp: new Date().toISOString() },
      ]
      await supabase.from('sessions').update({ messages: updatedMessages }).eq('id', session_id)

      // 8. 如果AI回复包含微行动标记，提取并保存
      //    （Agent实现时：在AI回复中检测"今日微行动："后的内容）
    },
  })

  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
```

### 7.2 记忆提炼（签到完成后触发）

```typescript
// lib/memory/extract.ts
// 调用时机：session.status 从 in_progress → completed 时，后台异步触发

export async function extractAndUpdateMemory(
  supabase: SupabaseClient,
  userId: string,
  sessionMessages: Message[]
) {
  const conversationText = sessionMessages
    .map(m => `${m.role === 'ai' ? '粘豆包' : '用户'}：${m.content}`)
    .join('\n')

  // 调用DeepSeek提炼
  const result = await deepseek.chat.completions.create({
    model: CHAT_MODEL,
    temperature: 0.2,
    max_tokens: 400,
    messages: [
      { role: 'system', content: MEMORY_EXTRACT_PROMPT },
      { role: 'user', content: `对话内容：\n${conversationText}` },
    ],
  })

  let newFacts: MemoryFact[] = []
  try {
    newFacts = JSON.parse(result.choices[0].message.content ?? '[]')
    newFacts = newFacts.map(f => ({ ...f, updated_at: new Date().toISOString() }))
  } catch { return }  // 解析失败静默跳过

  // 合并到现有记忆（最多保留10条，新的替换旧的同类）
  const { data: existing } = await supabase
    .from('memory_summary').select('key_facts').eq('user_id', userId).single()

  const merged = mergeMemoryFacts(existing?.key_facts ?? [], newFacts)

  await supabase.from('memory_summary').upsert({
    user_id: userId,
    key_facts: merged,
    updated_at: new Date().toISOString(),
  })
}

function mergeMemoryFacts(old: MemoryFact[], incoming: MemoryFact[]): MemoryFact[] {
  const merged = [...old]
  for (const fact of incoming) {
    const sameCategory = merged.filter(f => f.category === fact.category)
    if (sameCategory.length >= 3) {
      // 同类超过3条，替换最旧的
      const oldestIdx = merged.indexOf(sameCategory[0])
      merged[oldestIdx] = fact
    } else {
      merged.push(fact)
    }
  }
  return merged.slice(-10)  // 最多10条
}
```

### 7.3 每日提醒（邮件）

```typescript
// app/api/remind/route.ts
// 调用方式：Vercel Cron Job，每小时整点触发，筛选该小时应提醒的用户

import { Resend } from 'resend'
import { createServerClient } from '@/lib/supabase/server'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function GET() {
  const supabase = createServerClient()
  const currentHour = new Date().getHours().toString().padStart(2, '0')

  // 查询当前小时应提醒的用户
  const { data: users } = await supabase
    .from('user_profiles')
    .select('reminder_email, nickname, reminder_time')
    .eq('reminder_enabled', true)
    .like('reminder_time', `${currentHour}:%`)

  if (!users?.length) return Response.json({ sent: 0 })

  // 批量发送
  const results = await Promise.allSettled(
    users.map(u => resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: u.reminder_email!,
      subject: `${u.nickname}，今天来签到一下吧 🌱`,
      html: `
        <div style="font-family:'PingFang SC',sans-serif;max-width:480px;margin:0 auto;color:#3D2F1F">
          <h2 style="font-family:Georgia,serif;color:#8B7355">粘豆包在等你</h2>
          <p>今天过得怎么样？花3分钟来说说吧，我记得你上次说的事。</p>
          <a href="{{APP_URL}}/chat" style="display:inline-block;background:#8B7355;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;margin-top:16px">
            打开粘豆包
          </a>
          <p style="color:#B8A898;font-size:12px;margin-top:24px">
            在设置中可以修改提醒时间或关闭提醒
          </p>
        </div>
      `,
    }))
  )

  return Response.json({ sent: results.filter(r => r.status === 'fulfilled').length })
}
```

在 `vercel.json` 中配置 Cron：

```json
{
  "crons": [{
    "path": "/api/remind",
    "schedule": "0 * * * *"
  }]
}
```

---

## 模块8：状态管理

> 最后更新：2026-03-14
> 依赖模块：模块6、模块7

MVP 使用 React 内置 hooks，不引入 Redux/Zustand，降低复杂度。

### 8.1 聊天页状态（`app/(main)/chat/page.tsx`）

```typescript
// 核心状态
const [messages, setMessages] = useState<Message[]>([])
const [session, setSession] = useState<Session | null>(null)
const [isStreaming, setIsStreaming] = useState(false)
const [showCrisis, setShowCrisis] = useState(false)
const [inputDisabled, setInputDisabled] = useState(false)

// 发送消息
async function handleSend(text: string) {
  if (isStreaming || !session) return
  setInputDisabled(true)
  setIsStreaming(true)

  // 乐观更新：先显示用户消息
  const userMsg: Message = { role: 'user', content: text, timestamp: new Date().toISOString() }
  setMessages(prev => [...prev, userMsg])

  const res = await fetch('/api/chat', {
    method: 'POST',
    body: JSON.stringify({ message: text, session_id: session.id }),
  })

  // 危机响应
  if (res.headers.get('content-type')?.includes('json')) {
    const data = await res.json()
    if (data.type === 'crisis') { setShowCrisis(true); setInputDisabled(true); return }
  }

  // 流式读取AI回复
  const aiMsg: Message = { role: 'ai', content: '', timestamp: new Date().toISOString() }
  setMessages(prev => [...prev, aiMsg])

  const reader = res.body!.getReader()
  const decoder = new TextDecoder()
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    const chunk = decoder.decode(value)
    setMessages(prev => {
      const updated = [...prev]
      updated[updated.length - 1] = { ...aiMsg, content: updated[updated.length - 1].content + chunk }
      return updated
    })
  }

  setIsStreaming(false)
  setInputDisabled(false)
}
```

### 8.2 初始化逻辑（页面加载时）

```typescript
useEffect(() => {
  async function init() {
    // 1. 获取或创建今日session
    const today = new Date().toISOString().slice(0, 10)
    let { data: session } = await supabase
      .from('sessions').select('*').eq('session_date', today).single()

    if (!session) {
      const { data } = await supabase.from('sessions').insert({
        user_id: user.id,
        session_date: today,
        messages: [],
        status: 'in_progress',
      }).select().single()
      session = data
    }

    setSession(session)
    setMessages(session.messages ?? [])

    // 2. 如果是全新对话（消息为空），触发AI发送开场白
    if ((session.messages ?? []).length === 0) {
      triggerAIGreeting(session)
    }
  }
  init()
}, [])
```

---

## 模块9：错误处理与兜底策略

> 最后更新：2026-03-14
> 依赖模块：模块7

| 场景 | 处理方式 | 展示给用户 |
|------|---------|-----------|
| DeepSeek API 超时（>10s） | 中断流式请求，重试1次 | "粘豆包走神了，再说一遍？" |
| DeepSeek API 报错（5xx） | 返回固定兜底回复 | 见下方兜底文案 |
| 网络断开 | 检测 `navigator.onLine`，暂停发送 | "网络不太好，稍等一下" |
| Supabase 写入失败 | console.error，不阻塞用户 | 静默失败，下次恢复 |
| 记忆提炼 JSON 解析失败 | catch 后跳过本次提炼 | 静默失败 |
| 危机关键词误触发 | CrisisCard 底部加"我没事，继续聊"按钮 | 用户可手动关闭 |
| 用户未登录访问 /chat | middleware 重定向到 /login | — |

**AI兜底文案**（DeepSeek不可用时返回）：

```typescript
const FALLBACK_RESPONSES = [
  '粘豆包刚才走神了，你刚才说的我想再认真听一遍，能再说说吗？',
  '不好意思，我刚才没反应过来，你再说一次？',
  '嗯…我好像没跟上，你方便再说一遍吗？',
]
export const getFallback = () => FALLBACK_RESPONSES[Math.floor(Math.random() * FALLBACK_RESPONSES.length)]
```

**Next.js 中间件（路由保护）**：

```typescript
// middleware.ts
import { createMiddlewareClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  const { data: { session } } = await supabase.auth.getSession()

  const isAuthRoute = req.nextUrl.pathname.startsWith('/login')
  const isApiRoute = req.nextUrl.pathname.startsWith('/api')

  if (!session && !isAuthRoute && !isApiRoute) {
    return NextResponse.redirect(new URL('/login', req.url))
  }
  if (session && isAuthRoute) {
    return NextResponse.redirect(new URL('/chat', req.url))
  }
  return res
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] }
```

---

## 模块10：迭代 Roadmap

> 最后更新：2026-03-14
> 依赖模块：模块1（MVP范围）

### V1 上线目标（本文档范围）

```
核心循环跑通：登录 → 签到对话 → 微行动 → 次日反馈 → 循环
记忆系统可用：连续使用3天后，AI能自然引用历史
提醒机制生效：每日邮件准时到达，点击直达对话
安全底线兜底：危机关键词触发，显示热线
```

### V2 功能（验证留存后启动）

| 功能 | 价值 | 前置条件 |
|------|------|---------|
| 情绪曲线可视化 | 让用户看见自己的变化，增加成就感 | 积累≥14天数据 |
| 手机号登录 | 降低邮箱依赖，提升注册转化 | 阿里云SMS审核通过 |
| 个性化提醒时间推荐 | 根据历史打开时间智能调整 | 积累≥7天行为数据 |
| 微行动完成率统计 | 让用户看见成长轨迹 | V2情绪曲线后加入 |
| 月度情绪回顾报告 | 增加分享传播属性 | 积累≥30天数据 |

### V3 功能（商业化阶段）

| 功能 | 商业价值 |
|------|---------|
| 导出情绪记录（给心理咨询师） | 付费功能，打通专业服务渠道 |
| 匿名社区（"和我情绪类似的人今天在做什么"） | 社区留存，降低流失 |
| 微信登录 | 降低中国用户注册门槛 |
| AI主动发起对话（非邮件，站内push） | 提升DAU，需App包装 |

---

## 给 AI 编程 Agent 的执行指引

> 状态：2026-03-14 · 完成

### 推荐执行顺序

```
Step 1  初始化项目（模块2.1）
Step 2  配置环境变量（模块2.4）
Step 3  执行数据库SQL（模块2.5）
Step 4  配置 Tailwind + 全局样式（模块3）
Step 5  实现登录页 + LoginForm.tsx（模块4）
Step 6  实现 AppHeader.tsx（模块4）
Step 7  实现 /api/chat 流式接口（模块7.1）
Step 8  实现聊天页主体 + ChatBubble / ChatInput（模块4、模块8）
Step 9  实现 MicroActionCard + CrisisCard（模块4）
Step 10 实现记忆提炼逻辑（模块7.2）
Step 11 实现设置页 + 邮件提醒接口（模块4、模块7.3）
Step 12 配置路由保护中间件（模块9）
Step 13 部署到 Vercel，配置 Cron Job
```

### 修改某个模块的方法

修改某模块后，将对应模块章节内容重新投喂给 Agent，说明：
> "按照这个模块的新规范，更新 `{{对应文件路径}}`，其他文件不要动。"

### 关键约束提醒

- 所有颜色必须使用模块3定义的 Token，不要硬编码 hex 值
- System Prompt 只在 `lib/deepseek/prompts.ts` 中修改，不要散落在其他文件
- 危机检测必须在 API 侧执行，不能只在前端检测
- `memory_summary` 每用户只有一条记录，更新用 `upsert`，不要 `insert`

