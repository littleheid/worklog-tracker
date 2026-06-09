# Worklog Tracker

个人本地工作事项追踪工具。单文件部署，SQLite 存储，双击即用。

## 特性

- **单二进制文件** — Go 编译，~10MB，无需安装任何依赖
- **SQLite 存储** — 数据存于 `~/.worklog-tracker/worklog.db`
- **守护进程** — 后台运行，`start / stop / status` 管理
- **开机自启** — `install` 注册为 macOS launchd 服务
- **玻璃拟态 UI** — Vue 3 + 暖橙配色 + ECharts 可视化
- **中英双语** — 侧栏一键切换
- **Homebrew 分发** — `brew install` 一条命令安装

## 安装

| 平台 | 命令 |
|------|------|
| macOS | `brew install littleheid/worklog-tracker/worklog-tracker` |
| Windows | `scoop bucket add littleheid https://github.com/littleheid/scoop-worklog-tracker && scoop install worklog-tracker` |
| Linux | [下载二进制](https://github.com/littleheid/worklog-tracker/releases/latest) |

## 使用

```bash
worklog-tracker start      # 后台启动，浏览器自动打开
worklog-tracker status     # 查看状态
worklog-tracker stop       # 停止
worklog-tracker restart    # 重启
worklog-tracker install    # 开机自启（macOS launchd）
worklog-tracker uninstall  # 取消开机自启
worklog-tracker serve      # 前台运行（调试用）
```

## 页面

| 页面 | 功能 |
|------|------|
| 统一面板 | KPI 统计、状态/优先级分布、最近更新 |
| 事项列表 | 卡片网格、筛选排序、滑出详情面板 |
| 数据洞察 | ECharts 仪表盘、环形图、横向条形图 |
| 设置 | 最近更新数量、每页条数、数据重置 |

## 技术栈

| 层 | 技术 |
|----|------|
| 前端 | Vue 3 + TypeScript + Pinia + Tailwind CSS |
| 图表 | ECharts + vue-echarts |
| 后端 | Go + net/http + modernc.org/sqlite |
| 打包 | Go embed + 单文件编译 |
| 国际化 | vue-i18n |

## 构建

```bash
# 需要 Node.js 和 Go
./build.sh          # 本地单平台构建
./release.sh 0.1.0  # 多平台发布构建
```

## 数据

```
~/.worklog-tracker/
├── worklog.db     # SQLite 数据库
├── worklog.pid    # 进程 PID
├── stdout.log     # 运行日志
└── stderr.log     # 错误日志
```
