---
title: Code inside snippets
layout: default
permalink: /ejs/
nav_order: 5
---

You can write whatever JavaScript code you like inside your snippets. The iffinity engine uses the [EJS template system](https://ejs.co/). You don't need to worry much about it, though. The following cases will cover you 99% of the time.

## Arbitrary JavaScript

You can write any JavaScript you want inside `<% ... %>` EJS tags. Note that each such section is **scoped**, meaning that no variables or other stuff will leak from it. The code will run as soon as the snippet is shown (every time). Example:

```ejs
<snippet name="A Snippet">
    ...
    <%
        alert('Hello world!') // an alert will pop up every time this snippet is shown
    %>
    ....
</snippet>
```

Important note: Always remember to use `$(function () { ... });` provided by jQuery (which is available in every EJS code segment by iffinity) **whenever you want to access DOM elements from your code**. Example:

```ejs
<snippet name="A Snippet">
    <h1>Chapter 1</h1>
    <%
        $(function () {
            // create a fade in effect for the snippet title
            $("h1").hide().fadeIn(1000);
        });
    %>
    ....
</snippet>
```

## Value interpolation

You can interpolate JavaScript values using the `<%- ... %>` EJS tags (same as before, plus a `-`). Example:

```ejs
<snippet name="A Snippet">
    <% if (s.TIMES_DIED === undefined) s.TIMES_DIED = 0 %>
    <p>You have died <%- s.TIMES_DIED %> times.</p>
    ....
</snippet>
```

## Exposed variables inside EJS snippets

Every code you write inside EJS tags has access to the following variables created by iffinity:

 - `story`: The [story object](/author-api/#the-story-object)
 - `snippet`: The current [snippet object](/author-api/#the-snippet-object)
 - `s`: The story state object (shorthand for the `story.state` field)
 - `f`: The story functions object (shorthand for the `story.funcs` field)

Note that the only way to have variables/computations etc escape a certain EJS segment and live on is to store them in the story state `s`. For functions, the pseudo-variable `f` is recommended (shorthand for the `story.funcs` field). The only difference between `s` and `f` is that `s` is serialized by the `save()` method of the `Story` object, so functions won't survive this. For more information, see the page on [the author API](/author-api/).
