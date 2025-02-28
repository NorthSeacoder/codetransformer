/**
 * 检查字符串是否包含中文字符
 * @param str 要检查的字符串
 * @returns 是否包含中文字符
 */
export function hasChineseCharacter(str: string): boolean {
    // 匹配中文字符的正则表达式
    const chineseRegex = /[\u4e00-\u9fa5]/gmu;
    return chineseRegex.test(str);
}
