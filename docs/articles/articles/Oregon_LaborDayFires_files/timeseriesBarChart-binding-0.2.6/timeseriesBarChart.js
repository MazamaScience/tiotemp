HTMLWidgets.widget({

  name: 'timeseriesBarChart',

  type: 'output',

    factory: function(el, width, height) {

    // TODO: define shared variables for this instance

    return {

      renderValue: function(x) {


        // Create color ramp profile using options
        let colorMap = d3.scaleThreshold()
          .domain(x.breaks)
          .range(x.colors);

        // Load the data
        const meta = HTMLWidgets.dataframeToD3(x.meta);
        const data = HTMLWidgets.dataframeToD3(x.data);

        // Index IDs using passed in index str
        let indexIds = meta.map(d => { return d[x.index] });

                // create bar data
        let barData = indexIds.map(id => {
          return {
            id: id,
            label: meta.filter(d => { return d[x.index] == id })[0][x.label],
            data: data.map(d => {
              return {
                date: new Date(d.datetime),
                value: +d[id],
                color: colorMap(+d[id])
              }
            })
          }
        });

        let selectedData = barData[0];

        // Allow shiny updating
        if(x.inputId != null) {
          let selectedLabel;
          $("#" + x.inputId).on("change", function() {
            selectedLabel = this.value;
            selectedData = barData.filter(d => {
              return d.label == selectedLabel
            })[0]
            update(selectedData)
            });
        };

        function update(selectedData) {
          canvas = document.getElementById(el.id);
          let plotData = [
            {
              x: selectedData.data.map(d=>{return d.date}),
              y: selectedData.data.map(d=>{return d.value}),
              marker: {
                color: selectedData.data.map(d=>{return d.color}),
              },
              type: 'bar'
            }
          ];

          let layout = {
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
          };

          let config = {
            displayModeBar: false,
            responsive: true
          };

          // Plotly.react has the same signature as Plotly.newPlot
          return Plotly.react(canvas, plotData, layout, config);
        }

        update(selectedData);

      },

      resize: function(el, width, height) {

        // TODO: code to re-render the widget with a new size
        Plotly.relayout(el.id, {width: width, height: height});

      }

    };
  }
});

