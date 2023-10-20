import fs from "fs";
import path from "path";
import * as cheerio from "cheerio";

// search all the tree under the project root
// for any file that ends with .html or .ejs
// and parse each file to find all the snippets
export function readAllHtmlAndEjsFilesUnder(dir: string): [string, string[]] {
    let allContent: string = "";
    let snippetFiles: string[] = [];
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const filePath = path.join(dir, file);

        if (fs.statSync(filePath).isDirectory()) {
            // If it's a directory, recurse into it
            const subtreeRes = readAllHtmlAndEjsFilesUnder(filePath);
            allContent += subtreeRes[0];
            snippetFiles = snippetFiles.concat(subtreeRes[1]);
        } else {
            // If it's a file, check the extension
            const extname = path.extname(filePath);
            if ([".html", ".htm", ".ejs"].includes(extname)) {
                const $ = cheerio.load(fs.readFileSync(filePath, "utf8"));
                if ($("snippet").length === 0) continue;
                allContent += $.html();
                snippetFiles.push(filePath);
            }
        }
    }

    return [allContent, snippetFiles];
}
