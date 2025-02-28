import * as path from 'path';
import * as fs from 'fs/promises';
// 使用动态导入方式解决madge的兼容性问题
import {logger} from './utils';
import depseeker, {type DepSeeker} from '@nsea/depseeker';
import {workspace} from 'vscode';
import {getProjectConfig} from './utils/projectConfig';
/**
 * 根据文件路径获取工作区根目录
 * @param filePath 文件路径
 * @returns 工作区根目录
 */
export async function getWorkspaceRoot(filePath: string): Promise<string> {
    const workspaceFolders = workspace.workspaceFolders;
    if (workspaceFolders) {
        for (const folder of workspaceFolders) {
            if (filePath.startsWith(folder.uri.fsPath)) {
                return folder.uri.fsPath;
            }
        }
    }
    throw new Error('未找到工作区根目录');
}

/**
 * 分析文件依赖并返回需要处理的文件列表
 * @param startPath 起始文件或文件夹路径
 * @returns 需要处理的文件路径数组
 */
export async function getFilesToTransform(startPath: string): Promise<string[]> {
    try {
        logger.info(`开始分析路径: ${startPath}`);
        return analyzeDependencies(startPath);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error(`依赖分析错误: ${errorMessage}`);
        throw new Error(`依赖分析失败: ${errorMessage}`);
    }
}

/**
 * 统一的依赖分析函数
 * @param filePath 文件或目录路径
 * @returns 需要处理的文件路径数组
 */
async function analyzeDependencies(filePath: string): Promise<string[]> {
    try {
        const {tsConfig, webpackConfig} = await getProjectConfig(filePath);
        // 获取工作区根目录
        let basePath = await getWorkspaceRoot(filePath);
        if (tsConfig) {
            basePath = path.dirname(tsConfig);
        }
        if (webpackConfig) {
            basePath = path.dirname(webpackConfig);
        }

        const options = {
            includeNpm: false,
            fileExtensions: ['js', 'jsx', 'ts', 'tsx'],
            excludeRegExp: [/\.d\.ts$/, /node_modules/, /dist/, /build/, /coverage/],
            detectiveOptions: {
                ts: {
                    skipTypeImports: true
                }
            },
            tsConfig,
            webpackConfig,
            baseDir: basePath // 设置为项目根目录
        };
        logger.info(`depseeker options: ${JSON.stringify(options)}`);
        const result = await depseeker(filePath, options);
        return extractFilesFromMadgeResult(result, basePath);
        // logger.info(basePath,result.getFiles());
        // return result.getFiles();
    } catch (error) {
        logger.error(`依赖分析错误: ${error}`);
        return findJsAndTsFiles(filePath);
    }
}

/**
 * 从madge分析结果中提取文件列表
 * @param madgeResult madge分析结果
 * @returns 文件路径数组
 */
function extractFilesFromMadgeResult(madgeResult: DepSeeker, basePath: string): string[] {
    const result = new Set<string>();

    // 遍历madge结果对象，键是文件路径，值是依赖数组
    const dependencyGraph = madgeResult.obj();
    logger.info(`dependencyGraph: ${JSON.stringify(dependencyGraph, null, 2)}`);
    logger.info(`files: ${madgeResult.getFiles()}`);
    for (const filePath in dependencyGraph) {
        // 添加源文件
        if (isJsOrTsFile(filePath)) {
            result.add(path.join(basePath, filePath));
        }

        // 添加依赖文件
        const dependencies = dependencyGraph[filePath];
        for (const dependency of dependencies) {
            if (isJsOrTsFile(dependency)) {
                result.add(path.join(basePath, dependency));
            }
        }
    }

    const files = Array.from(result);
    logger.info(`依赖分析完成，找到 ${files.length} 个文件`);
    return files;
}

/**
 * 递归查找目录中的所有 JS/TS 文件
 * @param dirPath 目录路径
 * @returns 文件路径数组
 */
async function findJsAndTsFiles(dirPath: string): Promise<string[]> {
    const result: string[] = [];
    const entries = await fs.readdir(dirPath, {withFileTypes: true});

    for (const entry of entries) {
        const relativePath = entry.name;
        const fullPath = path.join(dirPath, relativePath);

        if (entry.isDirectory() && entry.name !== 'node_modules') {
            // 递归处理子目录，但排除 node_modules
            const subDirFiles = await findJsAndTsFiles(fullPath);
            result.push(...subDirFiles);
        } else if (entry.isFile() && isJsOrTsFile(entry.name)) {
            result.push(fullPath);
        }
    }

    return result;
}

/**
 * 检查文件是否为 JS/TS 文件
 * @param filePath 文件路径
 * @returns 是否为 JS/TS 文件
 */
function isJsOrTsFile(filePath: string): boolean {
    const ext = path.extname(filePath).toLowerCase();
    return ['.js', '.ts', '.jsx', '.tsx'].includes(ext);
}
