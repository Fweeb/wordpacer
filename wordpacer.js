
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
function getCurrentVelocity(velocities, currentVelocity = 0) {
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
    // Less than 5 letters = velocity increases by letter count
    if (wordlength < 5) {
        velocity = currentVelocity + wordlength;
    }
    // Words 4-8 letters long maintain velocity
    if (wordlength > 4 && wordlength < 8) {
        velocity = currentVelocity;
    }
    // Words greater than 7 letters long lose velocity for each letter over 8
    else {
        velocity = currentVelocity - wordlength + 8;
    }
    return velocity;
}
function getWordVelocities(words, multiplier, currentVelocity) {
    var velocities = [];

    // One-word sentences set velocity to the length of the word
    if (words.length == 1) {
        velocities.push(words[0].length);
        //console.log(words, velocities); //DEBUG
    }
    // Sentences with more than 15 words drop velocity to 75% of the multiplier
    else if (words.length > 15) {
        for (var i = 0; i < words.length; i++) {
            multiplier = ((((words.length - i) / words.length) * 0.25) + 0.75) * multiplier //XXX Not sure this is right
            currentVelocity = getCurrentVelocity(velocities, currentVelocity);
            //console.log('m:', multiplier, 'v:', currentVelocity) //DEBUG
            var velocity = calculateVelocity(words[i].length, currentVelocity) * multiplier;
            velocities.push(velocity);
        }
    }
    // Sentences between 1 and 15 words long just use the existing multiplier
    else {
        for (var i = 0; i < words.length; i++) {
            currentVelocity = getCurrentVelocity(velocities, currentVelocity);
            velocities.push(calculateVelocity(words[i].length, currentVelocity) * multiplier);
            //console.log(words[i], velocities); //DEBUG
        }
    }
    return velocities;
}
function gatherData(text) {
    var wordlengths = [];
    var velocities = [];
    var allWords = [];
    var wordticks = [];
    var currentWord = 1;
    var totalParagraphs = 0;
    var totalSentences = 0;
    var totalWords = 0;
    var paragraphs = text.split("\n");
    paragraphs.pop(); // split() apparently adds an empty array element at the end
    totalParagraphs = paragraphs.length;

    for (var i = 0; i < paragraphs.length; i++) {
        var sentences = paragraphs[i].split(/[.!?]/);
        if (sentences.length > 1)
            sentences.pop(); // split() adds an empty element for multi-word sentences
        totalSentences += sentences.length;
        //console.log(sentences); //DEBUG
        // One-word paragraphs drop word velocity to zero
        if (sentences.length == 1 && sentences[0].split(" ").length == 1) {
            var word = sentences[0];
            totalWords++;
            wordlengths.push([word.length]);
            velocities.push(0);
            wordticks.push([currentWord]);
            allWords.push([word]);
            currentWord++;
            //console.log(word, wordlengths, velocities); //DEBUG
        }
        // One-sentence paragraphs drop word velocity by half
        else if (sentences.length == 1) {
            var words = getWords(sentences[0]);
            totalWords += words.length;
            var currentVelocity = getCurrentVelocity(velocities);
            wordlengths.push(getWordlengths(words));
            velocities = velocities.concat(getWordVelocities(words, multiplier = 0.5), currentVelocity = currentVelocity);
            wordticks.push(addWordticks(words, currentWord));
            allWords.push(words);
            currentWord += wordticks[wordticks.length - 1].length;
            //console.log(words, wordlengths, velocities); //DEBUG
        }
        // Paragraphs with more than 5 sentences drop velocity by half by the end of the paragraph
        else if (sentences.length > 5) {
            for (var j = 0; j < sentences.length; j++) {
                var words = getWords(sentences[j]);
                totalWords += words.length;
                var currentVelocity = getCurrentVelocity(velocities);
                var multiplier = (((sentences.length - j) / sentences.length) * 0.5) + 0.5;
                wordlengths.push(getWordlengths(words));
                velocities = velocities.concat(getWordVelocities(words, multiplier = multiplier, currentVelocity = currentVelocity));
                wordticks.push(addWordticks(words, currentWord));
                allWords.push(words);
                currentWord += wordticks[wordticks.length - 1].length;
                //console.log(words, wordlengths, velocities); //DEBUG
            }
        }
        else {
            for (var j = 0; j < sentences.length; j++) {
                var words = getWords(sentences[j]);
                totalWords += words.length;
                var currentVelocity = getCurrentVelocity(velocities);
                wordlengths.push(getWordlengths(words));
                velocities = velocities.concat(getWordVelocities(words, multiplier = 1.0, currentVelocity = currentVelocity));
                wordticks.push(addWordticks(words, currentWord));
                allWords.push(words);
                currentWord += wordticks[wordticks.length - 1].length;
                //console.log(words, wordlengths, velocities); //DEBUG
            }
        }
    }
    return {
        paragraphs: totalParagraphs,
        sentences: totalSentences,
        words: totalWords,
        wordlengths: wordlengths,
        velocities: velocities,
        allWords: allWords,
        wordticks: wordticks
    }
    //console.log(paragraphs); //DEBUG
}
