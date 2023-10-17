import fs from "fs";
import path from "path";
import { Config, TagRule } from "../types/Config";
import yargs from "yargs";
import { checkConfig } from "./checks";
import { green, red } from "ansis/colors";

function readConfigFile(configFilePath: string): Config {
    try {
        return JSON.parse(fs.readFileSync(configFilePath, "utf8")) as Config;
    } catch (error) {
        console.error(
            `${red(
                "Error:"
            )} inexistent, empty or malformed config file. Aborting.`
        );
        process.exit(1);
    }
}

export function loadConfigFile(
    argv: yargs.Arguments,
    check = true,
    printInfo = true
): Config {
    const projectRootPath = (argv.projectRoot as string) || process.cwd();
    const configFilePath =
        (argv.config as string) ||
        path.join(projectRootPath, "iff-config.json");

    const config = readConfigFile(configFilePath);
    if (check) checkConfig(config, projectRootPath, printInfo);

    return config;
}

export function editConfigFile(argv: yargs.Arguments) {
    const projectRootPath = (argv.projectRoot as string) || process.cwd();
    const configFilePath = path.join(projectRootPath, "iff-config.json");
    const config = loadConfigFile(argv, false);

    if ("title" in argv) {
        config.story.title = argv.title as string;
        console.log(`Story title set to ${green(argv.title as string)}`);
    }
    if ("authorName" in argv) {
        config.story.author.name = argv.authorName as string;
        console.log(
            `Story author name set to ${green(argv.authorName as string)}`
        );
    }
    if ("authorEmail" in argv) {
        config.story.author.email = argv.authorEmail as string;
        console.log(
            `Story author email set to ${green(argv.authorEmail as string)}`
        );
    }
    if ("storyVersion" in argv) {
        config.story.version = argv.storyVersion as string;
        console.log(
            `Story version set to ${green(argv.storyVersion as string)}`
        );
    }
    if ("repo" in argv) {
        config.story.repository = {
            type: "git",
            url: argv.repo as string,
        };
        console.log(
            `Story git repository set to ${green(argv.repo as string)}`
        );
    }
    if ("addLibScript" in argv) {
        const newLibScripts = argv.addLibScript as string[];
        if (!config.libraries) config.libraries = {};
        if (!config.libraries.scripts) config.libraries.scripts = [];
        newLibScripts.forEach((element) => {
            if (!config.libraries?.scripts?.includes(element))
                config.libraries?.scripts?.push(element);
        });
        console.log(
            `Added script(s) ${newLibScripts.map(green).join(", ")} to library`
        );
        console.log(
            `Library scripts set to ${config.libraries.scripts
                .map(green)
                .join(", ")}`
        );
    }
    if ("removeLibScript" in argv) {
        const remLibScripts = argv.removeLibScript as string[];
        if (!config.libraries || !config.libraries.scripts) {
            console.error(
                `${red(
                    "Error:"
                )} --remove-lib-script expects a library script to be present in the config file. Skipping...`
            );
        } else {
            config.libraries.scripts = config.libraries.scripts.filter(
                (element) => !remLibScripts.includes(element)
            );
            console.log(
                `Removed script(s) ${remLibScripts
                    .map(red)
                    .join(", ")} from library`
            );
            console.log(
                `Library scripts set to ${config.libraries.scripts
                    .map(green)
                    .join(", ")}`
            );
        }
    }
    if ("addLibStyle" in argv) {
        const newLibStyles = argv.addLibStyle as string[];
        if (!config.libraries) config.libraries = {};
        if (!config.libraries.styles) config.libraries.styles = [];
        newLibStyles.forEach((element) => {
            if (!config.libraries?.styles?.includes(element))
                config.libraries?.styles?.push(element);
        });
        console.log(
            `Added style(s) ${newLibStyles.map(green).join(", ")} to library`
        );
        console.log(
            `Library styles set to ${config.libraries.styles
                .map(green)
                .join(", ")}`
        );
    }
    if ("removeLibStyle" in argv) {
        const remLibStyles = argv.removeLibStyle as string[];
        if (!config.libraries || !config.libraries.styles) {
            console.error(
                `${red(
                    "Error:"
                )} --remove-lib-style expects a library style to be present in the config file. Skipping...`
            );
        } else {
            config.libraries.styles = config.libraries.styles.filter(
                (element) => !remLibStyles.includes(element)
            );
            console.log(
                `Removed style(s) ${remLibStyles
                    .map(red)
                    .join(", ")} from library`
            );
            console.log(
                `Library styles set to ${config.libraries.styles
                    .map(green)
                    .join(", ")}`
            );
        }
    }
    if ("storyScript" in argv) {
        if (!config.scripts) config.scripts = {};
        config.scripts.story = argv.storyScript as string;
        console.log(`Story script set to ${green(argv.storyScript as string)}`);
    }
    if ("globalScript" in argv) {
        if (!config.scripts) config.scripts = {};
        config.scripts.global = argv.globalScript as string;
        console.log(
            `Global script set to ${green(argv.globalScript as string)}`
        );
    }
    if ("storyStyle" in argv) {
        if (!config.styles) config.styles = {};
        config.styles.story = argv.storyStyle as string;
        console.log(`Story style set to ${green(argv.storyStyle as string)}`);
    }
    if ("addTagScriptRule" in argv) {
        const newTagScriptRule = argv.addTagScriptRule as string[];
        if (newTagScriptRule.length !== 2) {
            console.error(
                `${red(
                    "Error:"
                )} --add-tag-script-rule expects two string arguments: a tag rule and a script file. Skipping...`
            );
        } else {
            const newTagRule = {
                rule: newTagScriptRule[0],
                files: newTagScriptRule[1].trim(),
            } as TagRule;
            if (!config.scripts) config.scripts = {};
            if (!config.scripts.tags) config.scripts.tags = [];
            if (!config.scripts.tags.find((e) => e.rule === newTagRule.rule))
                config.scripts.tags.push(newTagRule);
            console.log(
                `Added tag script(s) \`${green(
                    newTagRule.files
                )}\` for tag rule \`${green(newTagRule.rule)}\``
            );
            console.log(" - Tag script rules set to:");
            config.scripts.tags.forEach((e) =>
                console.log(`   - ${green(e.rule)}: ${green(e.files)}`)
            );
        }
    }
    if ("removeTagScriptRule" in argv) {
        const remTagScriptRule = argv.removeTagScriptRule as string;
        if (!config.scripts || !config.scripts.tags) {
            console.error(
                `${red(
                    "Error:"
                )} --remove-tag-script-rule expects a tag rule to be present in the config file. Skipping...`
            );
        } else {
            config.scripts.tags = config.scripts.tags.filter(
                (element) => element.rule !== remTagScriptRule
            );
            console.log(`Removed tag script ${red(remTagScriptRule)}`);
            if (config.scripts.tags.length === 0) {
                console.log(" - No tag script rules set");
                delete config.scripts.tags;
                if (Object.keys(config.scripts).length === 0)
                    delete config.scripts;
            } else {
                console.log(" - Tag script rules set to:");
                config.scripts.tags.forEach((e) =>
                    console.log(`   - ${green(e.rule)}: ${green(e.files)}`)
                );
            }
        }
    }
    if ("addTagStyleRule" in argv) {
        const newTagStyleRule = argv.addTagStyleRule as string[];
        if (newTagStyleRule.length !== 2) {
            console.error(
                `${red(
                    "Error:"
                )} --add-tag-style-rule expects two string arguments: a tag rule and a style file. Skipping...`
            );
        } else {
            const newTagRule = {
                rule: newTagStyleRule[0],
                files: newTagStyleRule[1].trim(),
            } as TagRule;
            if (!config.styles) config.styles = {};
            if (!config.styles.tags) config.styles.tags = [];
            if (!config.styles.tags.find((e) => e.rule === newTagRule.rule))
                config.styles.tags.push(newTagRule);
            console.log(
                `Added tag style \`${green(
                    newTagRule.files
                )}\` for tag rule \`${green(newTagRule.rule)}\``
            );
            console.log(" - Tag style rules set to:");
            config.styles.tags.forEach((e) =>
                console.log(`   - ${green(e.rule)}: ${green(e.files)}`)
            );
        }
    }
    if ("removeTagStyleRule" in argv) {
        const remTagStyleRule = argv.removeTagStyleRule as string;
        if (!config.styles || !config.styles.tags) {
            console.error(
                `${red(
                    "Error:"
                )} --remove-tag-style-rule expects a tag rule to be present in the config file. Skipping...`
            );
        } else {
            config.styles.tags = config.styles.tags.filter(
                (element) => element.rule !== remTagStyleRule
            );
            console.log(`Removed tag style ${red(remTagStyleRule)}`);
            if (config.styles.tags.length === 0) {
                console.log(" - No tag style rules set");
                delete config.styles.tags;
                if (Object.keys(config.styles).length === 0)
                    delete config.styles;
            } else {
                console.log(" - Tag style rules set to:");
                config.styles.tags.forEach((e) =>
                    console.log(`   - ${green(e.rule)}: ${green(e.files)}`)
                );
            }
        }
    }

    console.log();
    console.log("Updated project config:");
    console.log(JSON.stringify(config, null, 4));

    try {
        fs.writeFileSync(
            configFilePath,
            JSON.stringify(config, null, 4) + "\n"
        );
        console.log();
        console.log(`Config file ${configFilePath} updated.`);
    } catch (error: any) {
        console.error(
            `${red("Error")} while writing config file: ${
                error.message
            }. Aborting.`
        );
        process.exit(1);
    }
}
