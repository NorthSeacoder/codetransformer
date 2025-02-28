import {declare} from '@babel/helper-plugin-utils';
import {hasChineseCharacter} from './utils';
import * as t from '@babel/types';

export default declare(() => {
    // 用于存储找到的中文内容
    const chineseTexts = new Set();

    return {
        name: 'find-chinese',
        visitor: {
            'StringLiteral|JSXText|TemplateElement': function (path) {
                const value = path.isTemplateElement()
                    ? path.node.value.raw
                    : (path.node as t.StringLiteral | t.JSXText).value || '';
                if (hasChineseCharacter(value)) {
                    chineseTexts.add(value);
                }
            }
        },
        // 在遍历完成后，将收集到的中文内容通过metadata输出
        post(file: { metadata: { [key: string]: any } }) {
            if (!file.metadata) {
                file.metadata = {};
            }
            file.metadata.notTransform = true;
            file.metadata['output'] = {
                content: Array.from(chineseTexts).join('\n'),
                filename: 'chinese-texts.txt'
            };
        }
    };
});
