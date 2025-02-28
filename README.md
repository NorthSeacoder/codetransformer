# CodeTransformer

**CodeTransformer** 是一款强大的 VSCode 扩展，基于 Babel 自定义规则，帮助开发者轻松转换和分析 JavaScript 与 TypeScript 代码。支持 `.js`、`.jsx`、`.ts`、`.tsx` 文件，适用于代码重构、内容提取或生成分析报告等场景。

**[English README](README-EN.md)**

## 🚀 特性

- 🔄 **代码转换**：通过 Babel 插件和预设实现自动化代码转换。
- 📊 **代码分析**：自定义规则，输出 JSON、TXT 等格式的分析结果。
- 📂 **递归处理**：自动解析文件及其依赖，支持文件夹批量操作。
- 🛠 **本地插件**：支持引用项目中的自定义 Babel 插件，扩展功能。
- 📝 **日志输出**：详细记录处理过程，输出至 VSCode Output Channel。
- 🎯 **多文件支持**：兼容 `.js`、`.jsx`、`.ts`、`.tsx`。

## 📦 安装

1. 打开 VSCode。
2. 进入 **扩展** 视图（侧边栏方块图标）。
3. 搜索 **CodeTransformer**。
4. 点击 **安装**。

## ⚙️ 配置

在项目根目录创建 `.transformer.json` 文件，定义转换和分析规则。例如：

```json
{
  "rules": {
    "plugins": ["@babel/plugin-transform-arrow-functions"],
    "presets": ["@babel/preset-env"]
  }
}
```

### 🔧 自定义 Babel 插件

你可以通过编写 Babel 插件实现特定功能（如提取中文）。以下是一个示例：

#### 示例插件：`find-chinese.js`

```javascript
import { declare } from '@babel/helper-plugin-utils';
import { hasChineseCharacter } from './utils';

export default declare(() => {
  const chineseTexts = new Set();

  return {
    name: 'find-chinese',
    visitor: {
      'StringLiteral|JSXText|TemplateElement': (path) => {
        const value = path.isTemplateElement() ? path.node.value.raw : path.node.value || '';
        if (hasChineseCharacter(value)) {
          chineseTexts.add(value);
        }
      }
    },
    post(file) {
      file.metadata['output'] = {
        content: Array.from(chineseTexts).join('\n'),
        filename: 'chinese-texts.txt'
      };
      file.metadata['notTransform'] = true; // 不修改源文件
    }
  };
});
```

#### `metadata` 字段说明

- **`output`**：控制分析结果输出。
  - `content`：输出内容。
  - `filename`：输出文件名（默认 `out.md`）。
  - `path`：输出目录（可选）。
- **`notTransform`**：设为 `true` 时，仅分析，不修改源文件。

### 📍 使用本地插件

在 `.transformer.json` 中引用本地插件：

```json
{
  "rules": {
    "plugins": ["./plugins/find-chinese.js"]
  }
}
```

## 🛠️ 使用方法

1. 在 VSCode 资源管理器中，右键单击文件或文件夹。
2. 选择 **"Transform Code"**。
3. 处理完成后，查看转换结果或分析文件。

### 示例：转换箭头函数

1. 安装依赖：`npm install @babel/plugin-transform-arrow-functions`。
2. 配置 `.transformer.json`：

```json
{
  "rules": {
    "plugins": ["@babel/plugin-transform-arrow-functions"]
  }
}
```

3. 右键文件，选择 **"Transform Code"**，完成转换。

## 📜 日志查看

处理日志会输出到 VSCode 的 **Output Channel**：

1. 点击 **"查看"** > **"输出"**。
2. 在下拉菜单中选择 **"CodeTransformer"**。

## 🤝 贡献

欢迎为项目贡献代码！步骤如下：

1. Fork 本仓库。
2. 创建功能分支。
3. 提交 Pull Request，描述你的更改。

## 📄 许可证

WTFPL 许可证 - 详情见 [LICENSE](LICENSE) 文件。

## 🙏 致谢

- [starter-vscode](https://github.com/antfu/starter-vscode)：VSCode 扩展开发模板。
- [reactive-vscode](https://kermanx.com/reactive-vscode/)：现代化扩展开发工具。
- [Babel](https://babeljs.io/)：强大的代码转换引擎。