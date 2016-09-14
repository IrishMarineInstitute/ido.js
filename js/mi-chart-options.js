'use strict';

var configure = function(Highcharts){
    Highcharts.theme = {
        //colors: ['#058DC7', '#50B432', '#ED561B', '#DDDF00', '#24CBE5', '#64E572', '#FF9655', '#FFF263', '#6AF9C4'],
        chart: {
            zoomType: 'x',
            marginRight: 10,
            spacingLeft: 0,
            spacingBottom: 5//30
        },
        xAxis: {
            ordinal: false,
            lineColor: "#333",
            lineWidth: 1,
            title: {
                enabled: false,
                text: 'Time',
                margin: 0
                //offset: 25
            },
            labels: {
                y: 18
            },
            tickLength: 8
            //tickPosition: "inside"
        },
        yAxis: {
            lineColor: "#333",
            lineWidth: 1,
            maxPadding: 0,
            floor: 0,
            title: {
                margin: 5,
                style: {
                    //color: '#333',
                    fontSize: '11px'
                }
            },
            labels: {
                x: -5,
                y: 4,
                style: {
                    //color: '#000',
                    font: '11px Trebuchet MS, Verdana, sans-serif'
                }
            }
        },
        tooltip: {
            shared: true,
            valueDecimals: 2
        },
        legend: {
            enabled: false,
            //floating: true,
            //align: 'right',
            //borderColor: '#333',
            //borderWidth: 1,
            //verticalAlign: 'bottom',
            //y: 30
        },
        rangeSelector: {
            enabled: false,
        },
        navigator: {
            margin: 5,
            enabled: false
        },
        scrollbar: {
            enabled: false
        },
        credits: {
            enabled: false
        },
        exporting: {
            enabled: false
        }
    };

    // Apply the theme
    //Highcharts.setOptions(Highcharts.theme); //doesn't work in Highstock (its a bug)...
    //we add the theme manually in each view instead using Highcharts.merge(theme1, theme2)

    Highcharts.windTheme = Highcharts.merge(Highcharts.theme, {
        tooltip: {
            shared: true,
            valueDecimals: 2,
            useHTML: true,
            formatter: function() {
                //thursday, oct 21, 21:32 - 21:33
                var date = Highcharts.dateFormat('%A, %b %e, %H:%M', new Date(this.x));
                var chart = this.points[0].series.chart; //get the chart object
                var index = this.points[0].series.xData.indexOf(this.x);

                var directionSeries = chart.series[0];
                //var directionSeries = chart.series[1];

                var s = '<tspan style="font-size: 10px">' + date + '</tspan>';
                //s += '<br/><span style="color:#7cb5ec">●</span><span> ' + speedSeries.name +': </span><span style="font-weight:bold">' + Highcharts.numberFormat(speedSeries.data[index].y,  2) + " (knots)</span>";
                s += '<br/><span class="glyphicon glyphicon-arrow-right"></span><span> ' + directionSeries.name +': </span><span style="font-weight:bold">' + Highcharts.numberFormat(directionSeries.data[index].y,  2) + " (degrees)</span>";

                return s;
            }
        },
        plotOptions: {
            series: {
                dataGrouping: {
                    enabled: false
                }
            }
        },
        chart: {
            zoomType: ""
        }
    });



    // Apply the theme
    //Highcharts.setOptions(Highcharts.theme); //doesn't work in Highstock (its a bug)...
    //we add the theme manually in each view instead using Highcharts.merge(theme1, theme2)

    Highcharts.currentsTheme = Highcharts.merge(Highcharts.theme, {
        tooltip: {
            shared: true,
            valueDecimals: 2,
            useHTML: true,
            formatter: function () {
                //thursday, oct 21, 21:32 - 21:33
                var date = Highcharts.dateFormat('%A, %b %e, %H:%M', new Date(this.x));
                var chart = this.points[0].series.chart; //get the chart object
                var index = this.points[0].series.xData.indexOf(this.x);

                var speedSeries = chart.series[0];
                var directionSeries = chart.series[1];

                var s = '<tspan style="font-size: 10px">' + date + '</tspan>';
                s += '<br/><span style="color:#7cb5ec">●</span><span> ' + speedSeries.name + ': </span><span style="font-weight:bold">' + Highcharts.numberFormat(speedSeries.data[index].y, 2) + " (m/s)</span>";
                s += '<br/><span class="glyphicon glyphicon-arrow-right"></span><span> ' + directionSeries.name + ': </span><span style="font-weight:bold">' + Highcharts.numberFormat(directionSeries.data[index].y, 2) + " (degrees true)</span>";

                return s;
            }
        }
    });
  }

  exports.configure = configure;
