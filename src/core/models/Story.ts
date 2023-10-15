import ejs from "ejs";
import { Checkpoint, IStory, SaveObj } from "../interfaces/IStory";
import { ISnippet } from "../interfaces/ISnippet";
import { Snippet } from "./Snippet";
import { decode } from "html-entities";

export class Story implements IStory {
    title: string;
    author: { name: string; email?: string };
    version: string;
    snippets: ISnippet[];
    history: number[] = [];
    state: any = {};
    funcs: any = {};
    checkpoint?: Checkpoint = undefined;
    scode?: string;

    constructor(
        title: string,
        author: { name: string; email?: string },
        version: string,
        snippets: JQuery<HTMLElement>,
        scode?: string
    ) {
        this.title = title;
        this.author = author;
        this.version = version;
        this.snippets = snippets
            .map((i, e) => {
                const snippet = $(e);
                snippet.attr("id", i);
                return new Snippet(
                    i,
                    snippet.data("name"),
                    snippet.data("start") !== undefined,
                    decode(snippet.html())
                );
            })
            .get();
        this.scode = decode(scode);
    }

    getSnippet(id: string | number): ISnippet | undefined {
        if (typeof id === "string") {
            return this.snippets.find((s) => s.name === id);
        }
        return this.snippets[id];
    }

    getStartingSnippet(): ISnippet | undefined {
        return this.snippets.find((s) => s.start);
    }

    /**
     * Render the snippet with the given id, returning the rendered HTML.
     * If the snippet is not found, an error is logged and an empty string is returned.
     *
     * The snippet is rendered using EJS, with the following exposed data:
     * - story: the story object
     * - snippet: the snippet object
     * - s: the story state object (alias for this.state)
     * - f: the story functions object (alias for this.funcs)
     *
     * @param id the id of the snippet to render (can be a string or a number)
     * @returns the rendered HTML of the snippet (or an empty string if the snippet is not found)
     */
    renderSnippet(id: string | number): string {
        const snippet = this.getSnippet(id);

        if (!snippet) {
            if (typeof id === "string")
                console.error(`Error: snippet "${id}" not found in the story.`);
            else
                console.error(
                    `Error: snippet with id ${id} not found in the story.`
                );
            return "";
        }

        // render the snippet
        let exposedData = {
            story: this,
            snippet: snippet,
            s: this.state,
            f: this.funcs,
        };
        let renderedSnippetHTML = ejs.render(
            // should we render the story code? (only once at the beginning)
            (this.scode ? "<% " + this.scode + "%>\n" : "") + snippet.source,
            exposedData
        );
        this.scode = undefined;

        return renderedSnippetHTML;
    }

    /**
     * Show the snippet with the given id, rendering it on the `#iff-snippet` element,
     * overwriting the snippet that was already shown.
     *
     * @param id the id of the snippet to show (can be a string or a number)
     * @param addToHistory whether to add the snippet to the history (default: true)
     * @returns true if the snippet was found and shown, false otherwise
     */
    showSnippet(id: string | number, addToHistory = true): boolean {
        $("#iff-snippet").html(this.renderSnippet(id));

        // set up the behavior for the snippet links
        $("a[data-snippet]").on("click", (event: JQuery.ClickEvent) => {
            const targetSnippetName = $(event.target).data("snippet");
            const targetSnippet = this.getSnippet(targetSnippetName);
            if (!targetSnippet) {
                console.error(
                    `Error: snippet "${targetSnippetName}" not found in the story.`
                );
                return false;
            }
            this.showSnippet(targetSnippet.id);
        });

        // add the snippet to the history
        const snippet = this.getSnippet(id);
        if (addToHistory && snippet) this.history.push(snippet.id);

        return true;
    }

    start() {
        // show the starting snippet
        const startingSnippet = this.getStartingSnippet();
        if (!startingSnippet) {
            console.error("Error: no starting snippet found in the story.");
            return;
        }
        this.showSnippet(startingSnippet.id);
    }

    /**
     * Save the story state and history.
     *
     * @returns a `StoryState` object with the following properties:
     * - state: the story state (user-defined object)
     * - history: the story history (list of snippet numerical IDs)
     */
    save(): SaveObj {
        return {
            state: this.state,
            history: this.history,
            checkpoint: this.getCheckpoint(),
        };
    }

    /**
     *
     * @param data the `StoryState` to load (as returned by `save()`)
     * @param cb (optional) a callback function to call after the story state is loaded.
     * The callback function is passed the loaded `StoryState` object.
     * @param landingSnippet (optional) the snippet to show after loading the story state.
     * If this is not provided, the last snippet in the history is shown.
     * @param loadNoHistory (optional) whether to add the loaded snippet
     * (i.e., landing snippet or last visited snippet) to the history. (default: true)
     */
    load(
        data: SaveObj,
        cb?: (s: object) => void,
        landingSnippet?: string,
        loadNoHistory: boolean = true
    ) {
        this.state = data.state;
        this.history = data.history;

        if (cb) cb(this.state);

        if (landingSnippet) this.showSnippet(landingSnippet, loadNoHistory);
        else
            this.showSnippet(
                this.history[this.history.length - 1],
                loadNoHistory
            );
    }

    /**
     * Create a checkpoint of the story state and history.
     */
    createCheckpoint() {
        return (this.checkpoint = {
            state: JSON.parse(JSON.stringify(this.state)),
            history: [...this.history],
        } as Checkpoint);
    }

    /**
     * Get the current checkpoint or undefined if there is no checkpoint.
     */
    getCheckpoint() {
        return this.checkpoint;
    }

    /**
     * Restore the checkpoint, optionally jumping to the last visited snippet.
     *
     * @param restoreHistory whether to restore the history to the checkpoint's history (default: false)
     * @param jumpToCheckpoint whether to jump to the last visited snippet (default: true)
     * @param addToHistory whether to add the last visited snippet to the history
     * (works only if jumpToCheckpoint = true) (default: true)
     */
    restoreCheckpoint(
        restoreHistory = false,
        jumpToCheckpoint = true,
        addToHistory = true
    ) {
        if (!this.checkpoint) return false;

        this.state = JSON.parse(JSON.stringify(this.checkpoint.state));
        if (restoreHistory) this.history = [...this.checkpoint.history];

        if (jumpToCheckpoint)
            this.showSnippet(
                this.history[this.history.length - 1],
                addToHistory
            );

        return true;
    }
}
