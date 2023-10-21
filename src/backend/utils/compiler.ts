import fs from "fs";
import path from "path";
import * as cheerio from "cheerio";
import { readAllHtmlAndEjsFilesUnder } from "./crawler";
import { performInitialSanityChecks } from "./checks";
import { loadConfigFile } from "./config";
import { injectTagsScriptsAndStyles } from "./tags";
import { injectSnippetCodeAndStyle } from "./snippets";
import yargs from "yargs";
import { bold, green, red, yellow } from "ansis/colors";
import { encode } from "html-entities";
import { asArray, concatFileContents } from "../types/Config";

export function compileProject(argv: yargs.Arguments): void {
    const projectRootPath = (argv.projectRoot as string) || process.cwd();
    const config = loadConfigFile(argv);
    let outputFilePath =
        (argv.outputFile as string) ||
        config.story.title.replace(/[ -]/g, "_").replace(/[^a-zA-Z0-9_]/g, "") +
            (argv.testFrom ? "_from_" + argv.testFrom : "") +
            ".html";

    let [allUserSnippetsSource, allUserFiles] =
        readAllHtmlAndEjsFilesUnder(projectRootPath);

    const processedUserTemplate = allUserSnippetsSource.replace(
        /\[\[([^\]]*)\]\]/g,
        (match, p1: string) => {
            const parts = p1
                .split("|")
                .map((s) => s.trim().replace(/\n+ */g, " "));
            if (parts.length === 1) {
                // case [[<snippet name>]]
                return `<a href="javascript:void(0)" data-snippet="${parts[0]}">${parts[0]}</a>`;
            } else if (parts.length === 2) {
                // case [[<text>|<snippet name>]]
                return `<a href="javascript:void(0)" data-snippet="${parts[1]}">${parts[0]}</a>`;
            } else if (parts.length === 3) {
                // case [[<snippet name>||<id/classes>]]
                if (parts[1] !== "") {
                    console.error(
                        `${red(
                            "Error:"
                        )} invalid syntax for snippet link ${yellow(match)}`
                    );
                    console.error(
                        "\tWhen providing an id for the link, it is the callback's responsibility to show"
                    );
                    console.error(
                        "\ta different snippet via the story.showSnippet() method, if so desired."
                    );
                    console.error("Aborting.");
                    process.exit(1);
                }
                // break second part into id(s) and class(es)
                const ids = (parts[2].match(/#[\w-]+/g) || []) as string[];
                const classes = (parts[2].match(/\.[\w-]+/g) || []) as string[];
                if (ids.length > 1) {
                    console.warn(
                        `${yellow("Warning:")} snippet link ${yellow(
                            match
                        )} has more than one id.`
                    );
                    console.warn(
                        `\tWill only use the first one (${bold(
                            ids[0].slice(1)
                        )}).`
                    );
                }
                // return the link
                return `<a href="javascript:void(0)" ${
                    ids.length > 0 ? `id="${ids[0].slice(1)}"` : ""
                } ${
                    classes.length > 0
                        ? `class="${classes.map((c) => c.slice(1)).join(" ")}"`
                        : ""
                }>${parts[0]}</a>`;
            } else {
                // problem raise an error
                console.error("Error parsing the input template file.");
                return "";
            }
        }
    );

    const $ = cheerio.load(processedUserTemplate);
    const userSnippets = $("snippet");

    performInitialSanityChecks(userSnippets, allUserFiles.length);
    console.info("So far so good. Compiling...");

    const outputHTML = cheerio.load(
        `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title></title>
</head>
<body>
    <div id="iff-story">
        <div id="iff-snippet"></div>
    </div>
</body>
</html>
`
    );

    outputHTML("title").text(config.story.title);

    let storyDataElem = $('<div id="iff-story-data"></div>');
    userSnippets.each((_, snippet) => {
        const snippetElem = $(snippet);

        let snippetDataElem = $(
            '<div class="iff-snippet-data"></div>'
        ) as cheerio.Cheerio<cheerio.Element>;
        snippetDataElem.html(snippetElem.html() ?? "");

        for (const k in snippetElem.attr())
            snippetDataElem.data(k, snippetElem.attr(k));

        if (argv.testFrom) {
            if (snippetDataElem.data("name") === argv.testFrom) {
                console.log(
                    `Overriding starting snippet to ${green(
                        argv.testFrom.toString()
                    )} as requested.`
                );
                snippetDataElem.attr("data-start", "");
            } else {
                snippetDataElem.removeAttr("data-start");
            }
        }

        // snippet-specific code and style
        injectSnippetCodeAndStyle(snippetDataElem, projectRootPath);

        // tag-related code and style (it is prepended
        // so it will go before the snippet-specific code and style)
        injectTagsScriptsAndStyles(snippetDataElem, config, projectRootPath);

        storyDataElem.append(snippetDataElem);
    });

    // save title, author and version in the story data
    storyDataElem.attr("data-title", config.story.title);
    storyDataElem.attr("data-author-name", config.story.author.name);
    storyDataElem.attr("data-author-email", config.story.author.email ?? "");
    storyDataElem.attr("data-version", config.story.version ?? "1.0.0");

    storyDataElem.attr("hidden", "");
    outputHTML("body").append(storyDataElem);

    /**
     * engine code
     */
    outputHTML("head").append(
        `<script>${fs.readFileSync(
            path.join(
                path.dirname(__dirname),
                "..",
                "frontend",
                "iffinity-browser.js"
            ),
            "utf8"
        )}</script>`
    );

    /**
     * user libraries
     */
    // TODO: add support for external libraries and option to bundle them
    //       (right now, they are just copied as-is)
    if (config.libraries?.styles)
        for (const style of asArray(config.libraries.styles)) {
            let fullFilePath = path.join(projectRootPath, style);
            if (!fs.existsSync(fullFilePath))
                console.warn(
                    `Script library "${fullFilePath}" not found, skipping...`
                );
            else
                outputHTML("head").append(
                    `<style>${fs.readFileSync(
                        path.join(projectRootPath, style),
                        "utf8"
                    )}</style>`
                );
        }

    if (config.libraries?.scripts)
        for (const script of asArray(config.libraries.scripts)) {
            let fullFilePath = path.join(projectRootPath, script);
            if (!fs.existsSync(fullFilePath))
                console.warn(
                    `Script library "${fullFilePath}" not found, skipping...`
                );
            else
                outputHTML("head").append(
                    `<script>${fs.readFileSync(
                        path.join(projectRootPath, script),
                        "utf8"
                    )}</script>`
                );
        }

    /**
     * user story code
     */
    // append story code files to the body as simple
    // text, the engine code will take care of it
    if (config.scripts?.story) {
        const fullStoryCode = concatFileContents(
            projectRootPath,
            config.scripts.story
        );
        outputHTML("#iff-story-data").append(
            `<div id="iff-story-code" hidden="">${encode(fullStoryCode)}</div>`
        );
    }

    /**
     * user global code
     */
    if (config.scripts?.global) {
        const fullGlobalCode = concatFileContents(
            projectRootPath,
            config.scripts.global
        );
        outputHTML(".iff-snippet-data").prepend(
            `<%\n${encode(fullGlobalCode)}\n%>\n\n`
        );
    }

    /**
     * user story style
     */
    if (config.styles?.story) {
        const fullStoryStyle = concatFileContents(
            projectRootPath,
            config.styles.story
        );
        outputHTML("head").append(`<style>${fullStoryStyle}</style>`);
    }

    fs.writeFile(outputFilePath, outputHTML.html(), (err) => {
        if (err) {
            console.error("Error writing to the output file:", err);
            return;
        }

        console.log(`Rendered game saved to ${outputFilePath}. Enjoy!`);
    });
}
