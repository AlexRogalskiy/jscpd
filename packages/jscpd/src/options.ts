import {dirname, isAbsolute, resolve} from "path";
import {existsSync} from "fs";
import {Command} from 'commander';
import {readJSONSync} from 'fs-extra';
import {getDefaultOptions, IOptions} from '@jscpd/core';
import {parseFormatsExtensions} from '@jscpd/finder';

export function prepareOptions(cli: Command): IOptions {
	let config: string = cli.config ? resolve(cli.config) : resolve('.jscpd.json');
	let storedConfig: Partial<IOptions> = {};
	let packageJsonConfig: Partial<IOptions>;

  const argsConfig: Partial<IOptions> = {
		minTokens: cli.minTokens ? Number(cli.minTokens) : undefined,
		minLines: cli.minLines ? Number(cli.minLines) : undefined,
		maxLines: cli.maxLines ? Number(cli.maxLines) : undefined,
		maxSize: cli.maxSize,
		debug: cli.debug,
		executionId: cli.executionId,
		silent: cli.silent,
		blame: cli.blame,
		verbose: cli.verbose,
		cache: cli.cache,
		output: cli.output,
		format: cli.format,
		formatsExts: parseFormatsExtensions(cli.formatsExts),
		list: cli.list,
		mode: cli.mode,
		absolute: cli.absolute,
		noSymlinks: cli.noSymlinks,
		skipLocal: cli.skipLocal,
		ignoreCase: cli.ignoreCase,
		gitignore: cli.gitignore,
	};

	if (cli.threshold !== undefined) {
		argsConfig.threshold = Number(cli.threshold);
	}

	if (cli.reporters) {
		argsConfig.reporters = cli.reporters.split(',');
	}

	if (cli.format) {
		argsConfig.format = cli.format.split(',');
	}

	if (cli.ignore) {
		argsConfig.ignore = cli.ignore.split(',');
	}

	argsConfig.path = cli.path ? [cli.path].concat(cli.args) : cli.args;

	Object.keys(argsConfig).forEach((key) => {
		if (typeof argsConfig[key] === 'undefined') {
			delete argsConfig[key];
		}
	});

	if (!existsSync(config)) {
		config = '';
	} else {
		storedConfig = readJSONSync(config);
	}

	if (existsSync(process.cwd() + '/package.json')) {
		packageJsonConfig = readJSONSync(process.cwd() + '/package.json').jscpd || {};
	}

	const result: IOptions = {
		...{config},
		...getDefaultOptions(),
		...packageJsonConfig,
		...storedConfig,
		...argsConfig,
	};

	if (config in result && result.config && isAbsolute(result.config) && result.path) {
		result.path = result.path.map((path: string) => resolve(dirname(config), path));
	}

	result.reporters = result.reporters || [];
	result.listeners = result.listeners || [];

	if (result.silent) {
		result.reporters = result.reporters
			.filter(
				(reporter) => !reporter.includes('console'),
			)
			.concat('silent');
	}

	if (result.threshold !== undefined) {
		result.reporters = [...result.reporters, 'threshold'];
	}

	return result;
}
