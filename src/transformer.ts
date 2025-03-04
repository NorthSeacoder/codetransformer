import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import { window } from 'vscode'
import { logger } from './utils'

// 定义 Babel 的类型（避免 TypeScript 报错）
interface BabelCore {
  transformAsync: (code: string, options: any) => Promise<BabelFileResult>
}

interface BabelFileResult {
  code: string | null
  metadata?: any
}

interface CustomBabelFileResult extends BabelFileResult {
  metadata?: {
    output?: {
      content: string
      filename?: string
      path?: string
    }
    notTransform?: boolean
  }
}

// 动态加载 Babel 方法
async function loadBabelCore(workspaceRoot: string): Promise<BabelCore> {
  const babelPath = require.resolve('@babel/core', { paths: [path.join(workspaceRoot, 'node_modules')] })
  const babel = require(babelPath) // eslint-disable-line ts/no-require-imports
  logger.info(`加载工作区的 @babel/core: ${babelPath}`)
  return babel
}

export async function processFiles(files: string[], config: any, baseDir: string) {
  logger.info(`processFiles: ${files}`)

  // 加载工作区的 @babel/core
  const babel = await loadBabelCore(baseDir)

  return window.withProgress({ location: 15, title: 'Processing Code', cancellable: true }, async (progress) => {
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      logger.info(`Processing file: ${file}`)
      const content = await fs.readFile(file, 'utf8')

      const result = (await babel.transformAsync(content, {
        filename: file,
        plugins: config.plugins || [],
        presets: config.presets || [],
        sourceMaps: false,
      })) as CustomBabelFileResult

      if (result?.code && !result?.metadata?.notTransform) {
        await fs.writeFile(file, result.code, 'utf8')
        logger.info(`Updated source file: ${file}`)
      }

      if (result?.metadata?.output) {
        const output = result.metadata.output
        const outputPath = output.path ?? baseDir
        const outputFilename = output.filename ?? 'out.md'
        const fullOutputPath = path.join(outputPath, outputFilename)

        await fs.mkdir(outputPath, { recursive: true })
        await fs.writeFile(fullOutputPath, output.content, 'utf8')
        logger.info(`Generated output file: ${fullOutputPath}`)
      }

      progress.report({ message: `Processing ${i + 1}/${files.length}`, increment: 100 / files.length })
      logger.info(`Processed: ${file}`)
    }
  })
}
