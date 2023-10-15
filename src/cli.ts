#!/usr/bin/env node

import yargs, { array } from "yargs";
import { compileProject } from "./utils/compiler";
import { showProjectDetails } from "./utils/viewer";
import { initializeProject } from "./utils/initializer";
import { editConfigFile } from "./utils/config";
import { red } from "ansis/colors";

const usageStr = `~~~ The iffinity engine compiler ~~~

Running $0 with no command is equivalent to running $0 compile.

For help and options of a specific command, run:
$0 <command> --help/-h (e.g. $0 show --help)

Usage: $0 [command] [commandOptions]`;

yargs
    .usage(usageStr)
    .version(
        "version",
        "Show iffinity engine version number",
        `iffinity engine v${require("../package.json").version}`
    )
    .command(
        ["$0 [options]", "compile [options]"],
        "Compile the project in the given directory to a single HTML file",
        (yargs) => {
            yargs
                .option("projectRoot", {
                    alias: "p",
                    describe:
                        "The root directory of the project (if not specified, the current directory is used)",
                    type: "string",
                })
                .option("config", {
                    alias: "c",
                    describe:
                        "Specify a configuration file for your project (default: <projectRoot>/iff-config.json)",
                    type: "string",
                })
                .option("outputFile", {
                    alias: "o",
                    describe: "The output HTML file path",
                    type: "string",
                });
        },
        compileProject
    )
    .command(
        "init",
        "Create a new iffinity project in the current directory",
        {},
        async (_) => await initializeProject()
    )
    .command(
        "edit [options]",
        "Edit the configuration file of the project",
        (yargs) => {
            yargs
                .option("config", {
                    alias: "c",
                    describe:
                        "Specify a configuration file for your project (default: <projectRoot>/iff-config.json)",
                    type: "string",
                })
                .option("title", {
                    describe: "Change the title of the story",
                    type: "string",
                })
                .option("author-name", {
                    describe: "Change the name of the story author",
                    type: "string",
                })
                .option("author-email", {
                    describe: "Change the email of the story author",
                    type: "string",
                })
                .option("story-version", {
                    describe: "Change the version of the story",
                    type: "string",
                })
                .option("repo", {
                    describe: "Change the repository of the story",
                    type: "string",
                })
                .option("add-lib-script", {
                    describe: "Add a library script to the story",
                    type: "string",
                })
                .option("remove-lib-script", {
                    describe: "Remove a library script from the story",
                    type: "string",
                })
                .option("add-lib-style", {
                    describe: "Add a library style to the story",
                    type: "string",
                })
                .option("remove-lib-style", {
                    describe: "Remove a library style from the story",
                    type: "string",
                })
                .option("story-script", {
                    describe: "Set/change the story script",
                    type: "string",
                })
                .option("global-script", {
                    describe: "Set/change the global script",
                    type: "string",
                })
                .option("story-style", {
                    describe: "Set/change the story style",
                    type: "string",
                })
                .option("add-tag-script-rule", {
                    describe:
                        "Add a tag rule to the story, along with the corresponding script",
                    example: '--add-tag-script "TAG1 && !TAG2" script.js',
                    type: "array",
                })
                .option("remove-tag-script-rule", {
                    describe:
                        "Remove a tag rule from the story, along with the corresponding script",
                    type: "string",
                })
                .option("add-tag-style-rule", {
                    describe:
                        "Add a tag rule to the story, along with the corresponding style",
                    type: "array",
                })
                .option("remove-tag-style-rule", {
                    describe:
                        "Remove a tag rule from the story, along with the corresponding style",
                    type: "string",
                })
                .example("$0 edit --story-version 1.1.0", "")
                .example("$0 edit --repo https://github.com/user/repo.git", "")
                .example(
                    "$0 edit --add-tag-script-rule 'TAG1 && !TAG2' script.js",
                    ""
                )
                .example("$0 edit --remove-tag-style-rule 'TAG1 || TAG2'", "")
                .check((argv) => {
                    if (Object.keys(argv).length <= 2) {
                        yargs.showHelp();
                        process.exit(0);
                    }
                    Object.entries(argv).forEach(([key, value]) => {
                        if (key === "$0") return;
                        if (
                            value === "" ||
                            (Array.isArray(value) && value.length === 0)
                        ) {
                            console.error(
                                `${red(
                                    "Error:"
                                )} option \`${key}\` requires a value. Aborting.`
                            );
                            process.exit(1);
                        }
                    });
                    return true;
                });
        },
        editConfigFile
    )
    .command(
        "show [options]",
        "Show several project details",
        (yargs) => {
            yargs
                .option("projectRoot", {
                    alias: "p",
                    describe: "The root directory of the project",
                    type: "string",
                })
                .option("config", {
                    alias: "c",
                    describe:
                        "Specify a configuration file for your project (default: <projectRoot>/iff-config.json)",
                    type: "string",
                })
                .option("snippets", {
                    alias: "s",
                    describe: "Show all snippets in the project",
                    type: "boolean",
                })
                .option("tags", {
                    alias: "t",
                    describe: "Show all tags in the project",
                    type: "boolean",
                })
                .option("graph", {
                    alias: "g",
                    describe: "Show the snippet graph of the project",
                    type: "boolean",
                })
                .check((argv) => {
                    if (Object.keys(argv).length === 2) {
                        yargs.showHelp();
                        process.exit(0);
                    }
                    return true;
                });
        },
        async (argv) => await showProjectDetails(argv)
    )
    .alias("v", "version")
    .alias("h", "help")
    .help().argv;
