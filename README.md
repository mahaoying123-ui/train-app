# AI 训练计划生成器

一个基于 Next.js 的独立 Web 前端，调用 Dify Cloud 上的 Workflow 应用，根据用户填写的身体状态、精力状态、伤病情况、可用时间和训练目标，生成个性化训练计划。

## 项目结构

```
app/
  page.tsx              前端主页面（表单 + 结果 + 历史记录）
  layout.tsx            全局布局与页面标题
  api/train-plan/
    route.ts            后端接口：接收表单数据，安全调用 Dify Workflow API
components/
  TrainForm.tsx          表单组件，含伤病相关字段的条件显示
  SelectField.tsx        通用下拉选择框
  ResultCard.tsx          展示 Dify 返回结果
  HistoryList.tsx         展示本地保存的历史提交记录
lib/
  formOptions.ts          下拉选项的中文文案与对应的 Dify 变量值
  types.ts                TypeScript 类型定义
  history.ts              浏览器 localStorage 读写（历史记录、匿名用户 ID）
```

## 本地运行

1. 复制环境变量示例文件，并填入你的 Dify API Key：

   ```bash
   cp .env.local.example .env.local
   ```

   打开 `.env.local`，把 `DIFY_API_KEY` 换成你在 Dify 应用「访问 API」页面里生成的密钥（以 `app-` 开头）。

2. 安装依赖（已经装过可跳过）：

   ```bash
   npm install
   ```

3. 启动开发服务器：

   ```bash
   npm run dev
   ```

   打开浏览器访问 http://localhost:3000

## 部署到 Vercel

1. 把项目推送到 GitHub 仓库。
2. 在 [vercel.com](https://vercel.com) 用该仓库新建项目。
3. 在 Vercel 项目的 Environment Variables 里添加：
   - `DIFY_API_KEY`：你的 Dify API Key
   - `DIFY_API_BASE_URL`：`https://api.dify.ai/v1`（默认值，一般不用改）
4. 点击 Deploy，几分钟后即可通过 Vercel 分配的网址访问。

## 关于历史记录

历史提交记录保存在浏览器的 localStorage 里，不需要登录、不需要数据库。换设备或清除浏览器数据后历史会清空，这是当前设计的预期行为。

## 关于 Dify 返回结果的展示

`ResultCard` 组件会把 Dify Workflow 返回的 `outputs` 里的每个字段都展示出来。如果字段是纯文本，会保留换行直接展示；如果是更复杂的结构（数组/对象），会以 JSON 格式展示。等你的 Dify Workflow 输出字段确定下来后，可以进一步定制展示样式（比如把训练计划展示为按天分组的列表）。
