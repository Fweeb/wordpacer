/*
 * Rules for calculating velocity (tentative):
 *   - Average reader speed is 200 WPM (roughly 1000 characters/minute, or 16.6 characters/second)
 *   - Word influence: 
 *      - Words shorter than 5 characters increase velocity by the length of the word (should be inverse?)
 *      - Words between 4 and 8 characters long maintain current velocity
 *      - Words greater than 7 characters lose velocity for every character over 8
 *   - Sentence influence:
 *      - One-word sentences set velocity to 100 WPM
 *      - Sentences with between 1 and 15 characters long maintain the paragraph multiplier
 *      - Sentences greater than 15 characters drop velocity to 75% of the paragraph by the end of the sentence
 *   - Paragraph influence:
 *      - One word, one-sentence paragraphs set velocity to 60 WPM (would half be better?)
 *      - Paragraphs with between 1 an 5 sentences have a speed multiplier of 1.0 (should be >1?)
 *      - Paragraphs with more than 5 sentences drop velocity by half by the end of the paragraph
 */
function strip(html) {
    var tmp = document.createElement("DIV");
    tmp.innerHTML = html
    return tmp.textContent || tmp.innerText || "";
}
function getWords(sentence) {
    var words = sentence.split(/[ \u2014]/);
    for (var i = 0; i < words.length; i++) {
        words[i] = words[i].replace(/[^A-za-z0-9]+/gi, ''); // Remove special characters
    }
    //XXX Workaround: My regex tends to add an empty element at the front of the array for non-first sentences. The following trims that
    if (words[0] == "") {
        words.splice(0, 1);
    }
    return words;
}
function getWordlengths(words) {
    var wordlengths = [];
    for (var j = 0; j < words.length; j++) {
        wordlengths.push(words[j].length);
    }
    return wordlengths;
}
function addWordticks(words, currentWord) {
    var ticks = [];
    for (var i = 0; i < words.length; i++) {
        ticks.push(currentWord);
        currentWord++;
    }
    return ticks;
}
function getCurrentVelocity(velocities, currentVelocity) {
    var currentVelocity;
    if (velocities.length > 0) {
        currentVelocity = velocities[velocities.length - 1];
    }
    else {
        currentVelocity = currentVelocity;
    }
    return currentVelocity;
}
function calculateVelocity(wordlength, currentVelocity) {
    var velocity;
    if (currentVelocity == 0) {
        currentVelocity = 200; // Baseline reader velocity at 200 WPM at the start
    }
    // Less than 5 letters = velocity increases by letter count
    if (wordlength < 5) {
        velocity = currentVelocity + (16.6 - wordlength);
    }
    // Words 4-8 letters long maintain velocity
    else if (wordlength > 4 && wordlength < 16) {
        velocity = currentVelocity;
    }
    // Words greater than 16 letters long lose velocity for each letter over 17
    else {
        velocity = currentVelocity - wordlength + 17;
    }
    return velocity;
}
function getWordVelocities(words, multiplier, currentVelocity) {
    var velocities = [];

    // One-word sentences set velocity to 100 WPM
    if (words.length == 1) {
        velocities.push(100);
        //console.log(words, velocities); //DEBUG
    }
    // Sentences with more than 15 words drop velocity to 75% of the multiplier
    else if (words.length > 15) {
        for (var i = 0; i < words.length; i++) {
            multiplier = ((((words.length - i) / words.length) * 0.25) + 0.75) * multiplier //XXX Not sure this is right
            currentVelocity = getCurrentVelocity(velocities, currentVelocity);
            //console.log('w:', words[i], 'm:', multiplier, 'v:', currentVelocity) //DEBUG
            velocities.push(calculateVelocity(words[i].length, currentVelocity) * multiplier);
        }
    }
    // Sentences between 1 and 15 words long just use the existing multiplier
    else {
        for (var i = 0; i < words.length; i++) {
            currentVelocity = getCurrentVelocity(velocities, currentVelocity);
            velocities.push(calculateVelocity(words[i].length, currentVelocity) * multiplier);
            //console.log('w:', words[i], 'm:', multiplier, 'v2:', currentVelocity, velocities) //DEBUG
        }
    }
    return velocities;
}
function getSentenceData(sentence, data, currentWord, multiplier) {
    var words = getWords(sentence);
    data.wordcount += words.length;
    var currentVelocity = getCurrentVelocity(data.velocities);
    data.wordlengths.push(getWordlengths(words));
    data.velocities = data.velocities.concat(getWordVelocities(words, multiplier = multiplier, currentVelocity = currentVelocity));
    data.wordticks.push(addWordticks(words, currentWord));
    data.allWords.push(words);
    //console.log(data.velocities); //DEBUG
    return data;
}
function gatherData(text) {
    data = {
        paracount: 0,
        sentcount: 0,
        wordcount: 0,
        wordlengths: [],
        velocities: [],
        allWords: [],
        wordticks: [],
        paragraphStarts: []
    }

    var currentWord = 1;
    data.paragraphStarts.push(currentWord);
    var paragraphs = text.split("\n");
    paragraphs.pop(); // split() apparently adds an empty array element at the end
    data.paracount = paragraphs.length;

    for (var i = 0; i < paragraphs.length; i++) {
        var sentences = paragraphs[i].split(/[.!?]/);
        if (sentences.length > 1)
            sentences.pop(); // split() adds an empty element for multi-word sentences
        data.sentcount += sentences.length;
        //console.log(sentences); //DEBUG
        // One word, one-sentence paragraphs set velocity to 60 WPM
        if (sentences.length == 1 && sentences[0].split(" ").length == 1) {
            var word = sentences[0];
            data.wordcount++;
            data.wordlengths.push([word.length]);
            data.velocities.push(60);
            data.wordticks.push([currentWord]);
            data.allWords.push([word]);
            currentWord++;
            //console.log(word, wordlengths, velocities); //DEBUG
        }
        // One-sentence paragraphs drop word velocity by half
        else if (sentences.length == 1) {
            data = getSentenceData(sentences[0], data, currentWord, multiplier = 0.5);
            currentWord += data.wordticks[data.wordticks.length - 1].length;
            //console.log(words, wordlengths, velocities); //DEBUG
        }
        // Paragraphs with more than 5 sentences drop velocity by half by the end of the paragraph
        else if (sentences.length > 5) {
            for (var j = 0; j < sentences.length; j++) {
                var multiplier = (((sentences.length - j) / sentences.length) * 0.5) + 0.5;
                data = getSentenceData(sentences[j], data, currentWord, multiplier = multiplier);
                currentWord += data.wordticks[data.wordticks.length - 1].length;
                //console.log(data.velocities); //DEBUG
            }
        }
        else {
            for (var j = 0; j < sentences.length; j++) {
                data = getSentenceData(sentences[j], data, currentWord, multiplier = 1.0);
                currentWord += data.wordticks[data.wordticks.length - 1].length;
                //console.log(words, wordlengths, velocities); //DEBUG
            }
        }
        data.paragraphStarts.push(currentWord);
    }
    return data;
    //console.log(paragraphs); //DEBUG
}
function makeParagraphRectangles(paragraphStarts) {
    var rectangles = []
    for (var i = 0; i < paragraphStarts.length - 1; i++) {
        rectangles.push({ rectangle: {
            xmin: paragraphStarts[i] - 0.5, xmax: paragraphStarts[i + 1] - 0.5,
            xminOffset: "0px", xmaxOffset: "0px", yminOffset: "0px", ymaxOffset: "0px",
            color: ((i % 2 == 0) ? "rgba(200, 200, 0, 0.3)" : "rgba(0, 200, 100, 0.3"),
            showTooltip: true, tooltipFormatString: "Paragraph " + (i + 1)
        }});
    }
    return rectangles;
}
