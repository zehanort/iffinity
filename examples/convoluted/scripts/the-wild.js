if (s.WILD_VISITS === undefined && true) s.WILD_VISITS = 1;
else s.WILD_VISITS++;

$(function () {
    alert(
        "The wild is a dangerous place! Watch out for bears! Times visited the wild: " +
            s.WILD_VISITS +
            "."
    );
});
