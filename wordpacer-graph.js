$(document).ready(function () {
    var md = window.markdownit({typographer: true});

    $('#doit').click(function () {
        var html = md.render($('#source').val());
        $('#result-html').html(html);

        var text = strip(html); // Get plain text XXX assumes Markdown -> HTML
        wordData = gatherData(text);

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
        var plotSeries = [];
        for (var i = 0; i < wordCombo.length - 1; i++) {
            plotSeries.push({});
        }
        plotSeries.push({
            renderer: $.jqplot.LineRenderer,
            color: '#f00',
            yaxis: 'y2axis'
        });
        var paragraphRectangles = makeParagraphRectangles(wordData.paragraphStarts);
        //console.log(wordCombo) //DEBUG
        $.jqplot.config.enablePlugins = true;
        //console.log($('#wordchart').width() / wordData.wordcount); //DEBUG
        var plot1 = $.jqplot('wordchart', wordCombo, {
            // Only animate if we're not using excanvas (not in IE 7 or IE 8)..
            animate: !$.jqplot.use_excanvas,
            animateReplot: true,
            seriesColors: ['#889', '#ccd'],
            seriesDefaults: {
                renderer: $.jqplot.BarRenderer,
                rendererOptions: {
                    barWidth: $('#wordchart').width() / wordData.wordcount,
                    barPadding: - $('#wordchart').width() / wordData.wordcount,
                    barMargin: 0 
                },
                pointLabels: { show: true },
            },
            series: plotSeries,
            axes: {
                xaxis: {
                    //renderer: $.jqplot.CategoryAxisRenderer,
                    ticks: ticks
                },
                yaxis: {
                    rendererOptions: {
                        forceTickAt0: true
                    }
                },
                y2axis: {
                    rendererOptions: {
                        alignTicks: true,
                        forceTickAt0: true
                    }
                }
            },
            canvasOverlay: {
                show: true,
                objects: paragraphRectangles,
            },
            highlighter: { show: false }
        });
        //plot1.series[plot1.series.length - 1].renderer = $.jqplot.LineRenderer();
        //console.log(plot1.series[plot1.series.length - 1]); //DEBUG

        $('#wordchart').bind('jqplotDataClick',
            function (ev, seriesIndex, pointIndex, data) {
                seriesIndex++;
                pointIndex++;
                $('#info').html('sentence: '+seriesIndex+', word: '+pointIndex+' ('+data[2]+'), word length: '+data[1]); //XXX only works right for the bar graph right now
            }
        );
        plot1.replot({ resetAxes: true });
        $('#debug').html(text); //DEBUG
    });
});
