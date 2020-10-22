HTMLWidgets.widget({

  name: 'timeseriesBarChart',

  type: 'output',

  factory: function (el, width, height) {

    // TODO: define shared variables for this instance

    return {

      renderValue: function (x) {

        // Create color ramp profile using options
        let colorMap = d3.scaleThreshold()
          .domain(x.breaks)
          .range(x.colors);

        // Load the data
        const meta = HTMLWidgets.dataframeToD3(x.meta);
        const data = HTMLWidgets.dataframeToD3(x.data);

        // Index IDs using passed in index str
        let indexIds = meta.map(d => {
          return d[x.index]
        });

        // create bar data
        let barData = indexIds.map(id => {
          return {
            id: id,
            label: meta.filter(d => {
              return d[x.index] == id
            })[0][x.label],
            data: data.map(d => {
              return {
                date: new Date(d.datetime),
                value: +d[id],
                color: colorMap(+d[id])
              }
            })
          }
        });

        round = function(x) {
          return Math.ceil(x / 10) * 10;
        }

        let selectedData = barData[0];

        function initPlot(domain, range) {

          canvas = document.getElementById(el.id);

          let initPlotData = [{
            x: domain,
            y: range,
            marker: {},
            type: 'bar'
          }];

          let layout = {
            title: {
              text: '',
              x: 0.05
            },
            yaxis: {
              title: x.ylab,
              range: [0, x.ymax],
              fixedrange: true
            },
            xaxis: {
              // :(
              title:  x.xlab//"Date" //d3.timeFormat("%Y")(new Date()) + " (" + new window.Intl.DateTimeFormat().resolvedOptions().timeZone + ")"
            },
            margin: {
              l: 45,
              r: 25,
              b: 50,
              t: 50,
              pad: 0
            },
          };

          let config = {
            displayModeBar: false,
            responsive: true
          };

          // Plotly.react has the same signature as Plotly.newPlot
          Plotly.newPlot(canvas, initPlotData, layout, config);

        }

        // Update the plot
        function update(selectedData) {

          canvas = document.getElementById(el.id);

          let plotData = [{
            x: selectedData.data.map(d => {
              return d.date
            }),
            y: selectedData.data.map(d => {
              return d.value
            }),
            marker: {
              color: selectedData.data.map(d => {
                return d.color
              }),
            },
            type: 'bar'
          }];

          Plotly.animate(canvas, {
            data: [{
              x: selectedData.data.map(d => {
                return d.date
              }),
              y: selectedData.data.map(d => {
                return d.value
              }),
              marker: {
                color: selectedData.data.map(d => {
                  return d.color
                }),
              },
              type: 'bar'
            }],
            traces: [0],
            layout: {
              title: {
                text: selectedData.label,
                x: 0.05
              },
              yaxis: {
                title: x.ylab,
                fixedrange: true
              },
              margin: {
                l: 45,
                r: 25,
                b: 50,
                t: 50,
                pad: 0
              },
            }
          }, {
            transition: {
              duration: 250,
              easing: 'cubic-in-out'
            },
            frame: {
              duration: 250
            }
          });

        }

        // Allow shiny updating
        if (x.inputId !== null) {

          let selectedLabel;

          $("#" + x.inputId).on("change", function () {
            selectedLabel = this.value;
            selectedData = barData.filter(d => {
              return d.label == selectedLabel
            })[0]

            let domain = selectedData.data.map(d => { return d.date }),
                initY = selectedData.data.map(d => { return 0});

              /*
              NOTE: redrawing the plot with newPlot is not the most efficent method,
              but it does negate the need to address any layout issues that may arise
              */
              initPlot(domain, initY);

              update(selectedData);
          });

        } else {

          // By default use first of data
          let domain = barData[0].data.map(d => { return d.date }),
              initY = barData[0].data.map(d => { return 0 });

          initPlot(domain, initY);

          update(barData[0]);
        };

      },

      resize: function (el, width, height) {

        // TODO: code to re-render the widget with a new size
        Plotly.relayout(el.id, {
          width: width,
          height: height
        });

      }

    };
  }
});

