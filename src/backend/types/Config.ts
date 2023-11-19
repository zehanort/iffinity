import fs from "fs";
import path from "path";

export type StringOrStringArray = string | string[];

export function asArray(value: StringOrStringArray): string[] {
    if (Array.isArray(value)) {
        return value;
    } else {
        return [value];
    }
}

export function concatFileContents(
    projectRootPath: string,
    filelist: StringOrStringArray
): string {
    return asArray(filelist).reduce(
        (acc, script) =>
            acc +
            fs.readFileSync(path.join(projectRootPath, script), "utf8") +
            "\n",
        ""
    );
}

export type TagRule = {
    rule: string;
    files: StringOrStringArray;
};

export type Config = {
    story: {
        title: string;
        author: {
            name: string;
            email?: string;
        };
        version: string;
        repository?: { type: string; url: string };
    };

    libraries?: {
        scripts?: StringOrStringArray;
        styles?: StringOrStringArray;
    };

    scripts?: {
        story?: StringOrStringArray;
        global?: StringOrStringArray;
        tags?: TagRule[];
    };

    styles?: {
        story?: StringOrStringArray;
        tags?: TagRule[];
    };

    validation?: Record<string, any>;
};
