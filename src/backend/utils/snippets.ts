import fs from "fs";
import path from "path";
import * as cheerio from "cheerio";
import { encode } from "html-entities";

export function injectSnippetCodeAndStyle(
    snippetDataElem: cheerio.Cheerio<cheerio.Element>,
    projectRootPath: string
) {
    const snippetCodeFiles =
        (snippetDataElem.data("scripts") as string)?.split(";") || [];
    if (snippetCodeFiles.length > 0) {
        for (const snippetCodeFile of snippetCodeFiles.reverse()) {
            const snippetCodeContent = fs.readFileSync(
                path.isAbsolute(snippetCodeFile)
                    ? snippetCodeFile
                    : path.join(projectRootPath, snippetCodeFile.trim()),
                "utf8"
            );
            if (snippetCodeContent)
                snippetDataElem.prepend(
                    `<!-- code for snippet "${snippetCodeFile}" (file: "${snippetCodeFile}) -->` +
                        `\n<%\n${encode(snippetCodeContent)}\n%>\n\n`
                );
        }
    }

    const snippetStyleFiles =
        (snippetDataElem.data("styles") as string)?.split(";") || [];
    if (snippetStyleFiles.length > 0) {
        for (const snippetStyleFile of snippetStyleFiles.reverse()) {
            const snippetStyleContent = fs.readFileSync(
                path.isAbsolute(snippetStyleFile)
                    ? snippetStyleFile
                    : path.join(projectRootPath, snippetStyleFile.trim()),
                "utf8"
            );
            if (snippetStyleContent)
                snippetDataElem.prepend(
                    `<!-- style for snippet "${snippetStyleFile}" (file: "${snippetStyleFile}") -->` +
                        `\n<style>\n${snippetStyleContent}\n</style>\n\n`
                );
        }
    }
}
