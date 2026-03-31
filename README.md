# MD Reader - Markdown 阅读器

一个基于 Tauri + Vue 3 构建的轻量级 Markdown 阅读器，支持本地文件浏览、代码高亮、主题切换等功能。

## 功能特性

- 📁 **文件树浏览** - 可折叠的目录树，快速导航
- 📖 **Markdown 渲染** - 支持 GFM (GitHub Flavored Markdown)
- 🎨 **代码高亮** - highlight.js 提供多语言语法高亮
- 🌓 **主题切换** - 支持亮色/暗色主题
- 🔗 **文件关联** - 双击 `.md` 文件可直接打开
- ⚡ **轻量高效** - Tauri 原生应用，内存占用低

## 技术架构

```
┌─────────────────────────────────────────────────────┐
│                    MD Reader                        │
├─────────────────────┬───────────────────────────────┤
│      前端 (Vue 3)    │       后端 (Tauri/Rust)       │
├─────────────────────┼───────────────────────────────┤
│ • Vue 3 + TypeScript│ • Tauri 2 框架                │
│ • Vite 构建工具     │ • 文件系统操作                │
│ • Tailwind CSS 4    │ • 文件关联处理                │
│ • Pinia 状态管理    │ • 深链接协议                  │
│ • markdown-it 渲染  │ • 对话框插件                  │
│ • highlight.js 高亮 │                               │
└─────────────────────┴───────────────────────────────┘
```

### 项目结构

```
markdown-reader/
├── src/                    # Vue 前端源码
│   ├── components/         # Vue 组件
│   │   ├── common/         # 通用组件 (Header, Sidebar)
│   │   └── reader/         # 阅读器组件
│   ├── composables/        # 组合式函数
│   │   ├── useFileSystem   # 文件系统操作
│   │   ├── useMarkdown     # Markdown 渲染
│   │   └── useTheme        # 主题管理
│   ├── stores/             # Pinia 状态管理
│   └── styles/             # CSS 样式文件
├── src-tauri/              # Tauri/Rust 后端
│   ├── src/commands/       # Tauri 命令
│   ├── icons/              # 应用图标
│   └── tauri.conf.json     # Tauri 配置
├── public/                 # 静态资源
└── index.html              # 入口 HTML
```

## 本地开发

### 环境要求

| 工具 | 版本要求 |
|------|---------|
| Node.js | 18+ |
| Rust | 1.70+ |
| pnpm/npm | 最新版 |

### 安装步骤

1. **克隆仓库**
   ```bash
   git clone https://github.com/dragon84867/markdown-reader.git
   cd markdown-reader
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **启动开发模式**
   ```bash
   npm run tauri dev
   ```

   这会同时启动 Vite 开发服务器和 Tauri 应用窗口。

### 可用命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动 Vite 开发服务器 (仅前端) |
| `npm run tauri dev` | 启动完整应用开发模式 |
| `npm run build` | 构建前端产物 |
| `npm run tauri build` | 构建可发布应用 |

## 构建发布

构建平台特定的安装包：

```bash
npm run tauri build
```

产物位于 `src-tauri/target/release/bundle/` 目录：

| 平台 | 产物格式 |
|------|---------|
| macOS | `.app`, `.dmg` |
| Windows | `.exe`, `.msi` |
| Linux | `.deb`, `.AppImage` |

## IDE 推荐

- [VS Code](https://code.visualstudio.com/)
- [Vue - Official](https://marketplace.visualstudio.com/items?itemName=Vue.volar) - Vue 语法支持
- [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) - Tauri 开发支持
- [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer) - Rust 语言支持

## 许可证

MIT License