import findChinesePlugin from './find-chinese';

/**
 * 导出查找中文字符的Babel插件
 * 该插件会收集代码中的所有中文字符串，并通过metadata.output输出
 */
export default findChinesePlugin;