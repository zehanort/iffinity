export type TagRule = {
    rule: string;
    files: string;
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
        scripts?: string[];
        styles?: string[];
    };

    scripts?: {
        story?: string;
        global?: string;
        tags?: TagRule[];
    };

    styles?: {
        story?: string;
        tags?: TagRule[];
    };
};
