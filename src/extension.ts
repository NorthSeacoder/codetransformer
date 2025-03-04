import type { Uri, WorkspaceFolder } from 'vscode'
import * as path from 'node:path'
import { defineExtension, useCommand, useWorkspaceFolders, watchEffect } from 'reactive-vscode'
import { window } from 'vscode'
import { getFilesToTransform } from './dependencyAnalyzer'
import { displayName } from './generated/meta'
import { processFiles } from './transformer'
import { logger } from './utils'
import { getBabelConfig } from './utils/config'

const workspaceNodeModulesPaths = new Set<string>()

function getWorkspaceNodeModulesPath(
  filePath: string,
  workspaceFolders: readonly WorkspaceFolder[] | undefined,
): string | undefined {
  if (!workspaceFolders)
    return undefined
  for (const folder of workspaceFolders) {
    if (filePath.startsWith(folder.uri.fsPath)) {
      return path.join(folder.uri.fsPath, 'node_modules')
    }
  }
  return undefined
}

function updateModuleResolution(workspaceFolders: readonly WorkspaceFolder[] | undefined) {
  workspaceNodeModulesPaths.clear()
  if (workspaceFolders) {
    workspaceFolders.forEach((folder) => {
      const nodeModulesPath = path.join(folder.uri.fsPath, 'node_modules')
      workspaceNodeModulesPaths.add(nodeModulesPath)
    })
  }
  if (require.main) {
    const defaultPaths = require.main.paths.filter(p => !p.includes('node_modules'))
    require.main.paths = [...defaultPaths, ...workspaceNodeModulesPaths]
    logger.info(`模块解析路径已更新: ${require.main.paths.join(', ')}`)
  }
  else {
    const defaultPaths = module.paths.filter(p => !p.includes('node_modules'))
    module.paths = [...defaultPaths, ...workspaceNodeModulesPaths]
    logger.info(`模块解析路径已更新 (使用 module.paths): ${module.paths.join(', ')}`)
  }
}

export const { activate, deactivate } = defineExtension(() => {
  const workspaceFolders = useWorkspaceFolders()
  updateModuleResolution(workspaceFolders.value)
  watchEffect(() => {
    logger.info('工作区文件夹发生变化，更新模块解析路径')
    updateModuleResolution(workspaceFolders.value)
  })

  useCommand('codetransformer.transformCode', async (uri: Uri) => {
    try {
      const filePath = uri.fsPath
      logger.info(`开始处理: ${filePath}`)
      logger.show(true)

      const files = await getFilesToTransform(filePath)
      logger.info(`找到 ${files.length} 个需要处理的文件`)

      const baseDir = path.dirname(filePath)
      const workspaceNodeModulesPath = getWorkspaceNodeModulesPath(filePath, workspaceFolders.value)
      if (workspaceNodeModulesPath && !workspaceNodeModulesPaths.has(workspaceNodeModulesPath)) {
        workspaceNodeModulesPaths.add(workspaceNodeModulesPath)
        updateModuleResolution(workspaceFolders.value)
      }

      const babelConfig = await getBabelConfig(baseDir)
      logger.info(`已加载Babel配置: ${JSON.stringify(babelConfig, null, 2)}`)

      await processFiles(files, babelConfig, baseDir)

      window.showInformationMessage(`代码转换完成: ${filePath}`)
      logger.info(`代码转换完成`)
    }
    catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      logger.error(`错误: ${errorMessage}`)
      window.showErrorMessage(`处理失败: ${errorMessage}`)
    }
  })

  logger.info(`${displayName} 扩展已激活`)
})
