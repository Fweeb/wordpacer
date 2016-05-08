function markitdown(source) {
    var html = source;
    $('#result-html').html(html);
    var text = strip(html); // Get plain text XXX assumes Markdown -> HTML
    $('#debug').html(text); //DEBUG
    return text;
}
function graphText(text) {
    console.log('Gathering data...'); //DEBUG
    var start = performance.now(); //DEBUG
    wordData = gatherData(text);
    var end = performance.now(); //DEBUG
    console.log('Gathered. (', end - start, 'ms)'); //DEBUG

    var stats = {
        avgWordlength: 0,
        minVelocity: Math.min.apply(null, wordData.velocities),
        maxVelocity: Math.max.apply(null, wordData.velocities),
        avgVelocity: (wordData.velocities.reduce(function(sum, x) {return sum + x;}, 0)) / wordData.velocities.length
    };
    var allLetters = 0;
    for (var i = 0; i < wordData.wordlengths.length; i++) {
        for (var j = 0; j < wordData.wordlengths[i].length; j++) {
            allLetters += wordData.wordlengths[i][j];
        }
    }
    stats.avgWordlength = allLetters / wordData.wordcount;
    $('#result-stats #wordcount').html(wordData.wordcount);
    $('#result-stats #sentcount').html(wordData.sentcount);
    $('#result-stats #paracount').html(wordData.paracount);
    $('#result-stats #avg_wordlength').html(stats.avgWordlength);
    $('#result-stats #min_velocity').html(stats.minVelocity);
    $('#result-stats #max_velocity').html(stats.maxVelocity);
    $('#result-stats #avg_velocity').html(stats.avgVelocity);
    //console.log(wordData.wordlengths, stats.avgWordlength); //DEBUG

    start = performance.now(); //DEBUG
    console.log('Assembling graph data...'); //DEBUG
    var ticks = Array.apply(null, Array(wordData.wordcount + 2)).map(function(_, i) {return i;}); // the +2 is needed
    var wordCombo = [];
    var velocityCombo = [];
    velocityCombo.push([0,0]);
    for (var i = 0; i < wordData.wordticks.length; i++) {
        wordCombo[i] = [];
        for (var j = 0; j < wordData.wordticks[i].length; j++) {
            wordCombo[i][j] = [wordData.wordticks[i][j], wordData.wordlengths[i][j], wordData.allWords[i][j]];
            velocityCombo.push([wordData.wordticks[i][j], wordData.velocities[wordData.wordticks[i][j]-1]]);
            //console.log('i:',i,'j:',j,'wordcombo:',wordCombo[i][j]); //DEBUG
        }
    }
    //console.log(velocityCombo); //DEBUG
    wordCombo.push(velocityCombo);
    end = performance.now(); //DEBUG
    console.log('Assembled. (', end - start, 'ms)'); //DEBUG
    start = performance.now(); //DEBUG
    console.log('Creating graph...');
    var plotSeries = [];
    for (var i = 0; i < wordCombo.length - 1; i++) {
        plotSeries.push({});
    }
    plotSeries.push({
        renderer: $.jqplot.LineRenderer,
        color: '#f00',
        yaxis: 'y2axis',
        showMarker: false
    });
    var paragraphRectangles = makeParagraphRectangles(wordData.paragraphStarts);
    //console.log(wordCombo) //DEBUG
    $.jqplot.config.enablePlugins = true;
    //console.log($('#wordchart').width() / wordData.wordcount); //DEBUG
    var plot1 = $.jqplot('wordchart', wordCombo, {
        // Only animate if we're not using excanvas (not in IE 7 or IE 8)..
        //animate: !$.jqplot.use_excanvas,
        //animateReplot: true,
        seriesColors: ['#889', '#ccd'],
        seriesDefaults: {
            renderer: $.jqplot.BarRenderer,
            rendererOptions: {
                barWidth: $('#wordchart').width() / wordData.wordcount,
                barPadding: - $('#wordchart').width() / wordData.wordcount,
                barMargin: 0,
                shadowOffset: 0
            },
            pointLabels: { show: true },
        },
        series: plotSeries,
        cursor: {
            show: true,
            zoom: true,
            showTooltip: false,
        },
        axesDefaults: {
            rendererOptions: {
                alignTicks: true,
            }
        },
        axes: {
            xaxis: {
                //renderer: $.jqplot.CategoryAxisRenderer,
                //ticks: ticks,
                min: 0,
                max: ticks.length - 1,
                showTicks: false
            },
            yaxis: {
                rendererOptions: {
                    forceTickAt0: true
                },
                label: 'Word Length',
                labelRenderer: $.jqplot.CanvasAxisLabelRenderer
            },
            y2axis: {
                rendererOptions: {
                    alignTicks: true,
                    forceTickAt0: true
                },
                min: stats.minVelocity - 20,
                max: stats.maxVelocity + 20,
                label: 'Reader Velocity',
                labelRenderer: $.jqplot.CanvasAxisLabelRenderer
            }
        },
        canvasOverlay: {
            show: true,
            objects: paragraphRectangles,
        },
        highlighter: { show: false }
    });

    controlPlot = $.jqplot('controlchart', [velocityCombo], {
        seriesDefaults: {
            color: '#f00',
            showMarker: false,
            pointLabels: { show: false }
        },
        cursor: {
            show: true,
            zoom: true,
            showTooltip: false,
            constrainZoomTo: 'x'
        },
        axesDefaults: {
            showTicks: false
        },
        axes: {
            xaxis: {
                //ticks: ticks,
                min: 0,
                max: ticks.length - 1,
                showTicks: false
            },
            yaxis: {
                rendererOptions: {
                    alignTicks: true,
                    forceTickAt0: true,
                    min: stats.minVelocity,
                    max: stats.maxVelocity,
                }
            },
        },
        canvasOverlay: {
            show: true,
            objects: paragraphRectangles,
        },
        highlighter: { show: false }
    });
    $.jqplot.Cursor.zoomProxy(plot1, controlPlot);
    //plot1.series[plot1.series.length - 1].renderer = $.jqplot.LineRenderer();
    //console.log(plot1.series[plot1.series.length - 1]); //DEBUG
    end = performance.now(); //DEBUG
    console.log('Graphed. (', end - start, 'ms)'); //DEBUG

    $.jqplot.postDrawHooks.push(zoomHandler); // Catch zoom event

    $('#wordchart').bind('jqplotDataClick',
        function (ev, seriesIndex, pointIndex, data) {
            // Clear highlighting
            $('#result-html').find('mark').contents().unwrap();
            // Figure out which paragraph the selected word is in, and highlight it
            var tokens;
            for (var i = 0; i < wordData.paragraphStarts.length; i++) {
                if (wordCombo[seriesIndex][pointIndex][0] >= wordData.paragraphStarts[i]) {
                    continue;
                }
                else {
                    var tag = $('#result-html').children()[i-1];
                    tag = jQuery(tag).prop("tagName").toLowerCase();
                    // Find em dashes
                    var paragraph = $('#result-html '+tag+':nth-child('+i+')').html();
                    var regex = /\u2014/g, result, indicies = [];
                    while ((result = regex.exec(paragraph))) {
                        indicies.push(result.index);
                    }
                    //console.log(indicies); //DEBUG

                    tokens = paragraph.split(/[ \u2014]/);
                    word = wordCombo[seriesIndex][pointIndex][0] - wordData.paragraphStarts[i - 1];
                    tokens[word] = "<mark>" + tokens[word] + "</mark>";
                    paragraph = tokens.join(' ');

                    //Put em dashes back
                    for (var j = 0; j < indicies.length; j++) {
                        if (paragraph.search("<mark>") > indicies[j]) {
                            paragraph = paragraph.substr(0, indicies[j]) + '\u2014' + paragraph.substr(indicies[j] + 1);
                        }
                        else {
                            paragraph = paragraph.substr(0, indicies[j] + 13) + '\u2014' + paragraph.substr(indicies[j] + 14);
                        }
                        //console.log(paragraph); //DEBUG
                    }
                    $('#result-html '+tag+':nth-child('+i+')').html(paragraph);
                    break;
                }
            }
            //console.log(tokens, word,
            //            wordData.paragraphStarts,
            //            wordCombo[seriesIndex][pointIndex]); //DEBUG
            seriesIndex++;
            pointIndex++;
            if (data.length == 3) {
                $('#info').html('sentence: '+seriesIndex+', word: '+pointIndex+' ('+data[2]+'), word length: '+data[1]);
            }
            else {
                $('#info').html('sentence: '+seriesIndex+', word: '+pointIndex+', reader velocity: '+data[1]+' WPM');
            }
        }
    );
    plot1.replot({
        resetAxes: true,
        axes: {
            xaxis: {
                min: 0,
                max: ticks.length - 1
            },
            y2axis: {
                min: stats.minVelocity - 20,
                max: stats.maxVelocity + 20
            }
        }
    });
}
function showhideLabels() {
    if ($('#show_labels').prop('checked')) {
        $('.jqplot-point-label').css('display', 'block');
    }
    else {
        $('.jqplot-point-label').css('display', 'none');
    }
}
function zoomHandler() {
    var c = this.plugins.cursor;
    if (c._zoom.zooming) { //Zoom in
        $('#show_labels').prop('checked', true);
        showhideLabels();
        //console.log('Zoom in'); //DEBUG
    }
    else { // Zoom out
        $('#show_labels').prop('checked', false);
        showhideLabels();
        //console.log('Zoom out'); //DEBUG
    }
}

$(document).ready(function () {
    var md = window.markdownit({typographer: true});
    var text;

    text = markitdown(md.render($('#source').val()));
    graphText(text);
    showhideLabels();

    $('#source').keyup(function () {
        text = markitdown(md.render($('#source').val()));
    });

    $('#doit').click(function () {
        graphText(text);
        showhideLabels();
    });

    $('#reset_graph').click(function () {
        controlPlot.resetZoom();
        showhideLabels();
    });

    $('#show_labels').click(function () {
        //var $checkbox = $(this);
        //console.log($(this).prop('checked')); //DEBUG
        showhideLabels();
    });
});
