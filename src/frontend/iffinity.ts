import $ from "jquery";
import { Story } from "./models/Story";

$(function () {
    var story = new Story(
        $("#iff-story-data").data("title"),
        {
            name: $("#iff-story-data").data("author-name"),
            email: $("#iff-story-data").data("author-email") || undefined,
        },
        $("#iff-story-data").data("version"),
        $(".iff-snippet-data"),
        $("#iff-story-code").html()
    );

    $("#iff-story-data").remove();

    story.start();
});
