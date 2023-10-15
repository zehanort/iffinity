if (s.GLU === undefined) s.GLU = 1;
else s.GLU++;

f.say = function (msg) {
    $("#iff-snippet").append(`<strong>${msg}</strong>`);
};

$(function () {
    // append a new paragraph to the snippet output
    $("#iff-snippet").append(
        `<p id="glu">Global script loaded ${s.GLU} times!</p>`
    );
    $("#glu").css("border", "1px solid yellow");
});
