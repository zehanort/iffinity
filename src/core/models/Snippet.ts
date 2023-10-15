import { ISnippet } from "../interfaces/ISnippet";

export class Snippet implements ISnippet {
    id: number;
    name: string;
    start: boolean;
    source: string;

    constructor(id: number, name: string, start: boolean, source: string) {
        this.id = id;
        this.name = name;
        this.start = start;
        this.source = source;
    }
}
