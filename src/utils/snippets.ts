import fs from "fs";
import path from "path";

export function injectSnippetCodeAndStyle(
    snippetDataElem: cheerio.Cheerio,
    projectRootPath: string
) {
    const snippetCodeFiles = snippetDataElem.data("scripts")?.split(" ") || [];
    if (snippetCodeFiles.length > 0) {
        for (const snippetCodeFile of snippetCodeFiles.reverse()) {
            const snippetCodeContent = fs.readFileSync(
                path.join(projectRootPath, snippetCodeFile.trim()),
                "utf8"
            );
            if (snippetCodeContent)
                snippetDataElem.prepend(
                    `<!-- code for snippet "${snippetCodeFile}" (file: "${snippetCodeFile}) -->` +
                        "\n" +
                        `<% ${snippetCodeContent} %>\n\n`
                );
        }
    }

    const snippetStyleFiles = snippetDataElem.data("styles")?.split(" ") || [];
    if (snippetStyleFiles.length > 0) {
        for (const snippetStyleFile of snippetStyleFiles.reverse()) {
            const snippetStyleContent = fs.readFileSync(
                path.join(projectRootPath, snippetStyleFile.trim()),
                "utf8"
            );
            if (snippetStyleContent)
                snippetDataElem.prepend(
                    `<!-- style for snippet "${snippetStyleFile}" (file: "${snippetStyleFile}") -->` +
                        "\n" +
                        `<style>${snippetStyleContent}</style>\n\n`
                );
        }
    }
}
