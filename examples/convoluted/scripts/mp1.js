s.LALA = "MP1";

$(function () {
    $("#iff-snippet").append(
        `<p style="border: 2px dashed yellow">It's a hi from ` +
            s.LALA +
            "!.</p>"
    );
});
