import { logger, findConfigFile } from '.';
import { webpackConfig, tsConfig } from './config';

interface ProjectConfig {
  webpackConfig?: string;
  tsConfig?: string;
}


/**
 * 获取项目配置
 * @param startPath 项目路径
 * @returns 项目配置
 */
export async function getProjectConfig(startPath: string): Promise<ProjectConfig> {
  const config: ProjectConfig = {};

  // 优先使用用户配置
  if (webpackConfig.value) {
    config.webpackConfig = webpackConfig.value;
  }
  if (tsConfig.value) {
    config.tsConfig = tsConfig.value;
  }

  // 如果没有用户配置，尝试自动查找
  if (!config.webpackConfig) {
    const webpackConfigPath = await findConfigFile(startPath, 'webpack.config.js');
    if (webpackConfigPath) {
      config.webpackConfig = webpackConfigPath;
      logger.info(`找到webpack配置文件: ${webpackConfigPath}`);
    }
  }

  if (!config.tsConfig) {
    const tsConfigPath = await findConfigFile(startPath, 'tsconfig.json');
    if (tsConfigPath) {
      config.tsConfig = tsConfigPath;
      logger.info(`找到TypeScript配置文件: ${tsConfigPath}`);
    }
  }

  return config;
}