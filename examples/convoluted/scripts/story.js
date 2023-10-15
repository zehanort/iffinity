if (s.INIT_VAR === undefined && true) s.INIT_VAR = 42;

alert("This should run only once: " + s.INIT_VAR.toString());
s.INIT_VAR++;

$(function () {
    // append a new paragraph to the snippet output
    $("#iff-snippet").append("<p>Story script loaded</p>");
});
