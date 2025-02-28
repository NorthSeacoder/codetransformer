# CodeTransformer

**CodeTransformer** is a powerful VSCode extension that leverages Babel's custom rules to transform and analyze JavaScript and TypeScript code effortlessly. Supporting `.js`, `.jsx`, `.ts`, and `.tsx` files, it’s perfect for code refactoring, content extraction, or generating analysis reports.

**[中文 README](README.md)**

## 🚀 Features

-   🔄 **Code Transformation**: Automate code changes with Babel plugins and presets.
-   📊 **Code Analysis**: Generate JSON, TXT, or other custom-format analysis results.
-   📂 **Recursive Processing**: Automatically resolves file dependencies, with folder batch support.
-   🛠 **Local Plugins**: Integrate custom Babel plugins from your project.
-   📝 **Log Output**: Detailed processing logs in VSCode’s Output Channel.
-   🎯 **Multi-File Support**: Compatible with `.js`, `.jsx`, `.ts`, `.tsx`.

## 📦 Installation

1. Open VSCode.
2. Go to the **Extensions** view (square icon in the sidebar).
3. Search for **CodeTransformer**.
4. Click **Install**.

## ⚙️ Configuration

Create a `.transformer.json` file in your project root to define transformation and analysis rules. Example:

```json
{
    "rules": {
        "plugins": ["@babel/plugin-transform-arrow-functions"],
        "presets": ["@babel/preset-env"]
    }
}
```

### 🔧 Custom Babel Plugins

Craft your own Babel plugins (e.g., for extracting Chinese text). Here’s an example:

#### Example Plugin: `find-chinese.js`

```javascript
import {declare} from '@babel/helper-plugin-utils';
import {hasChineseCharacter} from './utils';

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
            file.metadata['notTransform'] = true; // Do not modify source files
        }
    };
});
```

#### `metadata` Fields

-   **`output`**: Controls analysis output.
    -   `content`: Output content.
    -   `filename`: Output file name (defaults to `out.md`).
    -   `path`: Output directory (optional).
-   **`notTransform`**: Set to `true` to analyze without modifying source files.

### 📍 Using Local Plugins

Reference local plugins in `.transformer.json`:

```json
{
    "rules": {
        "plugins": ["./plugins/find-chinese.js"]
    }
}
```

## 🛠️ Usage

1. In VSCode Explorer, right-click a file or folder.
2. Select **"Transform Code"**.
3. Check the transformed results or generated analysis files.

### Example: Transform Arrow Functions

1. Install the dependency: `npm install @babel/plugin-transform-arrow-functions`.
2. Update `.transformer.json`:

```json
{
    "rules": {
        "plugins": ["@babel/plugin-transform-arrow-functions"]
    }
}
```

3. Right-click a file, select **"Transform Code"**, and apply changes.

## 📜 Logs

Processing logs are sent to VSCode’s **Output Channel**:

1. Go to **View** > **Output**.
2. Select **"CodeTransformer"** from the dropdown.

## 🤝 Contributing

We welcome contributions! Follow these steps:

1. Fork this repository.
2. Create a feature branch.
3. Submit a Pull Request with a clear description.

## 📄 License

WTFPL License - See [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

-   [starter-vscode](https://github.com/antfu/starter-vscode): VSCode extension starter template.
-   [reactive-vscode](https://kermanx.com/reactive-vscode/): Modern extension development tools.
-   [Babel](https://babeljs.io/): Robust code transformation engine.
