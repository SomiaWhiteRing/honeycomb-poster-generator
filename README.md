# 蜂窝图生成器 (Honeycomb Poster Generator)

一个用于创建蜂窝状图片拼贴的网页应用程序。支持拖放操作、自动布局、主题切换等功能。

## 功能特点

- 🖼️ 图片管理
  - 支持拖放上传图片
  - 图片库预览和管理
  - 一键自动铺设图片
  - 支持图片在蜂窝格子间拖动调整

- 🎨 布局控制
  - 可调整蜂窝格子大小和位置
  - 可设置行数和列数
  - 可调整画布尺寸
  - 支持导出为PNG格式

- 🌓 界面设计
  - 支持浅色/深色主题切换
  - 现代化的界面设计
  - 响应式布局
  - 自定义确认对话框

- 💾 数据存储
  - 使用 IndexedDB 保存图片和布局
  - 自动保存配置到 localStorage
  - 主题偏好记忆功能

## 技术栈

- 纯原生 JavaScript (ES6+)
- HTML5 Canvas
- CSS3 (使用变量实现主题切换)
- IndexedDB
- localStorage
- 原生拖放 API

## 文件结构

```
honeycomb-poster-generator/
├── index.html      # 主页面结构
├── styles.css      # 样式表
├── script.js       # 主要逻辑
├── LICENSE         # MIT许可证
└── README.md       # 说明文档
```

## 使用说明

1. 图片上传
   - 点击"上传图片"按钮选择图片
   - 或直接将图片拖放到图片库区域

2. 布局调整
   - 在配置设置中调整参数
   - 可以通过拖动来调整图片位置
   - 使用"铺设图片"按钮自动填充

3. 主题切换
   - 点击右上角的主题图标切换明暗主题
   - 主题选择会被自动保存

4. 导出作品
   - 点击"导出图片"按钮将作品保存为PNG格式

## 本地运行

1. 克隆仓库：
   ```bash
   git clone https://github.com/yourusername/honeycomb-poster-generator.git
   ```

2. 使用本地服务器运行（比如 Python 的 SimpleHTTPServer）：
   ```bash
   python -m http.server 8000
   ```

3. 在浏览器中访问：
   ```
   http://localhost:8000
   ```

## 浏览器支持

- Chrome (推荐)
- Firefox
- Safari
- Edge

需要支持以下特性：
- ES6+
- IndexedDB
- HTML5 Canvas
- CSS Variables
- Drag and Drop API

## 开发计划

- [ ] 添加图片编辑功能
- [ ] 支持更多导出格式
- [ ] 添加更多蜂窝样式
- [ ] 支持撤销/重做操作
- [ ] 添加键盘快捷键

## 许可证

本项目采用 MIT 许可证。详见 [LICENSE](LICENSE) 文件。

## 贡献

欢迎提交 Issue 和 Pull Request。在提交 PR 之前，请确保：

1. 代码风格保持一致
2. 添加必要的注释
3. 更新相关文档
