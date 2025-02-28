import * as fs from 'fs/promises';
import * as path from 'path';
import {defineConfigs} from 'reactive-vscode';
import {logger, findConfigFile} from '.';

const CONFIG_FILENAME = '.transformer.json';

export const {webpackConfig, tsConfig} = defineConfigs('codetransformer', {
    webpackConfig: [String, null],
    tsConfig: [String, null]
});

export interface BabelConfig {
    plugins: any[];
    presets: any[];
}

export interface TransformerConfig {
    rules: {
        plugins?: string[];
        presets?: string[];
    };
}

export async function getBabelConfig(workspaceRoot: string): Promise<BabelConfig> {
    try {
        const configPath = await findConfigFile(workspaceRoot, CONFIG_FILENAME);

        if (!configPath) {
            logger.info('配置文件不存在，使用默认配置');
            return {plugins: [], presets: []};
        }

        logger.info(`读取配置文件: ${configPath}`);
        const configContent = await fs.readFile(configPath, 'utf8');
        const config: TransformerConfig = JSON.parse(configContent);

        const {plugins = [], presets = []} = config.rules || {};

        logger.info(`配置加载成功，插件数量: ${plugins.length}，预设数量: ${presets.length}`);

        const resolvedPlugins = await Promise.all(
            plugins.map(async (plugin) => {
                if (typeof plugin === 'string') {
                    if (plugin.startsWith('./') || plugin.startsWith('../') || plugin.startsWith('/')) {
                        const pluginPath = plugin.startsWith('/')
                            ? plugin
                            : path.resolve(path.dirname(configPath), plugin);
                        try {
                            // 使用动态 import() 加载本地插件
                            const resolvedPluginModule = await import(pluginPath);
                            const resolvedPlugin = resolvedPluginModule.default || resolvedPluginModule;
                            logger.info(`加载本地插件: ${pluginPath}`);
                            return resolvedPlugin;
                        } catch (err) {
                            logger.error(`加载本地插件失败: ${pluginPath}, ${err}`);
                            throw err;
                        }
                    } else {
                        // 对于 npm 包，显式解析并加载模块
                        try {
                            const pluginPath = require.resolve(plugin, {
                                paths: [path.join(workspaceRoot, 'node_modules')]
                            });
                            const resolvedPlugin = require(pluginPath);
                            logger.info(`加载 npm 插件: ${plugin} -> ${pluginPath}`);
                            return resolvedPlugin;
                        } catch (err) {
                            logger.error(`无法解析插件: ${plugin}, ${err}`);
                            throw new Error(
                                `插件 ${plugin} 未在工作区中安装，请运行: npm install ${plugin} --save-dev`
                            );
                        }
                    }
                }
                return plugin;
            })
        );

        return {
            plugins: resolvedPlugins,
            presets
        };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error(`配置加载错误: ${errorMessage}`);
        throw new Error(`配置加载失败: ${errorMessage}`);
    }
}

export function validateConfig(config: TransformerConfig): boolean {
    if (!config.rules) return false;
    const {plugins = [], presets = []} = config.rules;
    return plugins.length > 0 || presets.length > 0;
}
