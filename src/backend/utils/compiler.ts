import fs from "fs";
import path from "path";
import * as cheerio from "cheerio";
import { readAllHtmlAndEjsFilesUnder } from "./crawler";
import { performInitialSanityChecks } from "./checks";
import { loadConfigFile } from "./config";
import { injectTagsScriptsAndStyles } from "./tags";
import { injectSnippetCodeAndStyle } from "./snippets";
import yargs from "yargs";
import { bold, green, red } from "ansis/colors";
import { encode } from "html-entities";
import { asArray, concatFileContents } from "../types/Config";

export async function compileProject(argv: yargs.Arguments): Promise<void> {
    const projectRootPath = (argv.projectRoot as string) || process.cwd();
    const config = loadConfigFile(argv);
    let outputFilePath =
        (argv.outputFile as string) ||
        (config.story.title + (argv.testFrom ? "_from_" + argv.testFrom : ""))
            .replace(/[ -]/g, "_")
            .replace(/[^a-zA-Z0-9_]/g, "") + ".html";

    let [allUserSource, allUserFiles] = await readAllHtmlAndEjsFilesUnder(
        projectRootPath,
        config
    );

    const $ = cheerio.load(allUserSource);
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
    let foundTestingSnippet = false;
    userSnippets.each((_, snippet) => {
        const snippetElem = $(snippet);

        let snippetDataElem = $(
            '<div class="iff-snippet-data"></div>'
        ) as cheerio.Cheerio<cheerio.Element>;
        snippetDataElem.html(snippetElem.html() ?? "");
        // remove all <iff-link> elements from the snippet
        snippetDataElem.find("iff-link").remove();

        for (const k in snippetElem.attr())
            snippetDataElem.attr("data-" + k, snippetElem.attr(k));

        if (argv.testFrom) {
            if (snippetDataElem.data("name") === argv.testFrom) {
                console.log(
                    `Overriding starting snippet to ${green(
                        argv.testFrom.toString()
                    )} as requested.`
                );
                snippetDataElem.attr("data-start", "");
                foundTestingSnippet = true;
            } else {
                snippetDataElem.removeAttr("data-start");
            }
        }

        try {
            // snippet-specific code and style
            injectSnippetCodeAndStyle(snippetDataElem, projectRootPath);

            // tag-related code and style (it is prepended
            // so it will go before the snippet-specific code and style)
            injectTagsScriptsAndStyles(
                snippetDataElem,
                config,
                projectRootPath
            );
        } catch (e) {
            console.error(
                `${red("Error")} while processing snippet ${red(
                    snippetDataElem.data("name") as string
                )}:`
            );
            console.error(" - " + (e as Error).message);
            console.error("Aborting.");
            process.exit(1);
        }

        storyDataElem.append(snippetDataElem);
    });

    if (argv.testFrom && !foundTestingSnippet) {
        console.error(
            `${red("Error:")} snippet ${red(
                argv.testFrom.toString()
            )} (requested as testing starting point) not found.`
        );
        console.error("Aborting.");
        process.exit(1);
    }

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

        console.log(`Rendered game saved to ${bold(outputFilePath)}. Enjoy!`);
    });
}
