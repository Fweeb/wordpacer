# Word Pacer

In short, *[Word Pacer](http://fweeb.github.io/wordpacer)* is a little web app designed to help you adjust the pacing in your writing. Whether it's fiction, essay, or poetry, the idea is that you can control how fast your audience reads (I call it **reader velocity**) by adjusting the length of your words, sentences, and paragraphs. That last sentence, for example, is long. It would slow a reader down. Here are the basic rules:

* **Long words, paragraphs, and sentences reduce reader velocity.**
* **Short words, paragraphs, and sentences increase reader velocity.**
* **Very short paragraphs and sentences (for example, one word long or one sentence long) dramatically reduce reader velocity.**

There's some nuance in there, but that's the gist of it. When you paste your text, the graphs above show breakdowns of each paragraph and the lengths of each word in them. The red line indicates your reader velocity. You can zoom in on part of the graph by drawing a box in it. Or you can use the small navigation graph in the upper right corner. Clicking on individual words in the graph should highlight that word in the rendered text on the right.

*Word Pacer* primarily supports [Markdown syntax](https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet) with a couple additional features. For instance, the `---` is an em dash (---). However, plain text should also work just fine so long as you have two carriage returns between paragraphs. Eventually, I'll add support for just plain text... and perhaps if there's interest, I'll see about adding other text formats.

*Word Pacer* is still very much under development. It should analyze 2000 words of text in just over 3 seconds after you click the *Analyze Text* button. If you're reading this, chances are good that I contacted you directly about checking it out. Please use the Issue Tracker for giving me feedback (you can also hunt me down via email or social media, but the Issue Tracker is easier to follow). I'm mostly interested in feedback on the user interface, performance, and the accuracy of the reader velocity calculations... but I'll take whatever you've got.

## Known Issues

* I'm not overly fond of the name. :P
* Site has only thusfar been tested in Firefox and Chromium. Test results from other browsers are most welcome.
* Highlighting doesn't work for hyperlinks included in the text.
* Abbreviations like e.g., i.e., Dr., etc. tend to mess up velocity calculations.
* Lists (ordered or unordered) mess up highlighting and paragraph calculations.
* Graph does not update as you type; you must click the *Analyze Text* button. This is mostly a performance issue. I'm open to suggestions to how to make the graph update in real time.
* There is no lexical analysis of the text. Reader velocity is calculated *entirely* with word length, sentence length, and paragraph length.

## Legal Notices

Copyright &copy; 2016 [Jason van Gumster](http://monsterjavaguns.com)

### License

[GPL v3](LICENSE)

### External Libraries

* [jQuery](http://jquery.com)
* [jqPlot](http://www.jqplot.com)
* [markdown-it](https://markdown-it.github.io)
