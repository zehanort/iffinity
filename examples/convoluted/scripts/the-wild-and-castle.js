s.BOTH_TAGS = "both tags";

$(function () {
    $("#iff-snippet").append(
        `<p style="border: 2px dashed magenta"> ${s.BOTH_TAGS} work!.</p>`
    );
    f.say("GLOBAL FUNCTIONS WORK!");
});
