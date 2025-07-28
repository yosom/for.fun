# 墨水屏图像处理服务器

专为墨水屏设备优化的图像处理服务器，支持多种抖动算法和调色板。

## ✨ 功能特性

- 🖼️ **服务器端截图** - 使用Puppeteer进行高质量截图
- 🎨 **多种抖动算法** - 误差扩散、有序抖动、随机抖动
- 🎨 **丰富调色板** - Spectra 6、Gallery (ACEP)、灰度等
- 📱 **墨水屏优化** - 专为e-ink显示优化的图像处理
- 🔄 **实时预览** - 原始图像与处理后图像对比
- 📤 **设备发送** - 支持发送原始图像和处理后图像到墨水屏设备
- ⚙️ **前端配置** - 配置信息保存在用户浏览器中，支持多用户使用

## 🚀 快速开始

### 安装依赖
```bash
npm install
```

### 启动服务器
```bash
npm start
```

### 配置设备
1. 访问 `http://localhost:3001/codepen_gallery.html`
2. 点击右上角的 "⚙️ 设备配置" 按钮
3. 填入您的设备信息：
   - API 主机地址
   - API 路径
   - API Token
   - 设备 ID
4. 点击 "保存配置"

配置信息会保存在您的浏览器中，下次访问时无需重新配置。

## 📁 项目结构

```
├── final_server.js          # 主服务器
├── html_renderer.js         # HTML渲染器
├── screenshot_service.js    # 截图服务
├── epd_image_processor.js   # 图像处理器 (epdoptimize)
├── codepen_gallery.html     # 主页面
└── weights/                 # 项目文件
    ├── clock/              # 时钟项目
    │   └── dist/           # 构建输出目录
    │       ├── index.html  # 主页面
    │       ├── style.css   # 样式文件
    │       └── script.js   # 脚本文件
    ├── clock2/             # 时钟项目2
    │   └── dist/           # 构建输出目录
    └── 3/                  # 项目3
        └── dist/           # 构建输出目录
```

## 🎛️ 图像处理选项

### 调色板
- **默认** - 黑白调色板
- **Spectra 6** - 6色调色板
- **Gallery (ACEP)** - ACEP设备调色板
- **灰度** - 灰度调色板

### 抖动类型
- **误差扩散** - Floyd-Steinberg、Atkinson、Jarvis等
- **有序抖动** - Bayer矩阵抖动
- **随机抖动** - 黑白/RGB随机抖动
- **仅量化** - 无抖动量化

### 设备颜色
- **默认** - 标准颜色映射
- **Spectra 6** - Spectra设备颜色
- **ACEP** - ACEP设备颜色

## 🔧 API 端点

- `GET /api/projects` - 获取项目列表
- `POST /api/screenshot` - 服务器端截图
- `POST /api/process-image` - 图像处理
- `POST /api/send-to-device` - 发送到设备
- `GET /preview/:projectName` - 项目预览页面

## 🛠️ 技术栈

- **Node.js** - 服务器环境
- **Puppeteer** - 服务器端截图
- **epdoptimize** - 墨水屏图像优化
- **canvas** - 图像处理
- **JSDOM** - HTML解析

## 📖 使用说明

1. **选择项目** - 在主页选择要处理的项目
2. **捕获预览** - 点击"捕获预览"获取原始图像
3. **调整选项** - 选择调色板、抖动类型等处理选项
4. **处理显示** - 点击"处理并显示"查看效果
5. **发送设备** - 满意后点击"发送到设备"或"发送原始图像"

## ⚠️ 注意事项

- 确保 `weights/` 目录下有有效的项目文件
- 每个项目需要包含 `dist/index.html` 文件
- 支持CSS和JavaScript文件的自动加载
- 图像处理基于 `epdoptimize` 库，专为墨水屏优化 # for.fun
