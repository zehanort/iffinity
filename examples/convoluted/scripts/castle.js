if (s.CASTLE_VISITS === undefined) s.CASTLE_VISITS = 1;
else s.CASTLE_VISITS++;

$(function () {
    $("#iff-snippet").append(
        `<p style="border: 2px dashed red">It's a castle! You have visited the castle ` +
            s.CASTLE_VISITS +
            " times.</p>"
    );
});
