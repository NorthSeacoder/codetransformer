import { useLogger, getDefaultLoggerPrefix } from 'reactive-vscode'
import { displayName } from '../generated/meta'
import * as fs from 'fs/promises'
import * as path from 'path'
import { workspace, WorkspaceFolder } from 'vscode'

// 创建带时间戳的日志记录器
export const logger = useLogger(displayName, {
  getPrefix: getDefaultLoggerPrefix
})

/**
 * 在指定目录及其父目录中查找配置文件，但不会超出工作区根目录
 * @param dir 起始目录
 * @param filename 要查找的文件名
 * @returns 找到的配置文件路径，如果未找到则返回undefined
 */
export async function findConfigFile(dir: string, filename: string): Promise<string | undefined> {
  logger.info(`开始查找配置文件: ${dir}, ${filename}`);
  try {
    // 获取所有工作区
    const workspaceFolders = workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      logger.warn('未找到工作区');
      return undefined;
    }
    // 找到包含当前目录的工作区
    const workspaceFolder = findContainingWorkspace(dir, workspaceFolders);
    if (!workspaceFolder) {
      logger.warn(`未找到包含目录 ${dir} 的工作区`);
      return undefined;
    }

    // 确保当前目录在工作区内
    if (!dir.startsWith(workspaceFolder.uri.fsPath)) {
      logger.warn(`当前目录 ${dir} 不在工作区 ${workspaceFolder.uri.fsPath} 内`);
      return undefined;
    }
    
    const filePath = path.join(dir, filename);
    await fs.access(filePath);
    return filePath;
  } catch(err) {
    logger.error(`findConfigFile查找配置文件失败: ${err}`);
    const parentDir = path.dirname(dir);
    // 如果已经到达工作区根目录或系统根目录，则停止查找
    const workspaceFolder = findContainingWorkspace(dir, workspace.workspaceFolders || []);
    if (parentDir === dir || (workspaceFolder && !parentDir.startsWith(workspaceFolder.uri.fsPath))) {
      return undefined;
    }
    return findConfigFile(parentDir, filename);
  }
}

/**
 * 查找包含指定目录的工作区
 * @param dir 目录路径
 * @param workspaceFolders 工作区列表
 * @returns 包含该目录的工作区，如果未找到则返回undefined
 */
function findContainingWorkspace(dir: string, workspaceFolders: readonly WorkspaceFolder[]): WorkspaceFolder | undefined {
  return workspaceFolders.find(folder => dir.startsWith(folder.uri.fsPath));
}
