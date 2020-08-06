HTMLWidgets.widget({

  name: 'timeseriesCalendar',

  type: 'output',

  factory: function (el, width, height) {

    let margin = {
        top: 25,
        bottom: 25,
        left: 25,
        right: 25
    };

    let cellMargin = 2,
        cellSize = 30;

    /*
    Helpers
    */

    // Calulate the number of rows per month
    let monthRows = function (month) {
      let m = d3.timeMonth.floor(month);
      return d3.timeWeeks(d3.timeWeek.floor(m),
        d3.timeMonth.offset(m, 1)).length;
    };

    let dayFormat = d3.timeFormat("%w"),
      weekFormat = d3.timeFormat("%U"),
      format = d3.timeFormat("%Y-%m-%d"),
      titleFormat = d3.utcFormat("%a, %d-%b"),
      monthFormat = d3.timeFormat("%B"),
      yearFormat = d3.timeFormat("%Y");


    let average = (array) => array.reduce((a, b) => a + b) / array.length;

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
        let indexIds = meta.map(d => { return d[x.index] });

        // Create canvas
        let canvas = d3.select('#' + el.id)
          .selectAll("svg")
          .attr("width", width)
          .attr("height", height)
          .attr("preserveAspectRatio", "xMinYMin meet")
          .attr("viewBox", `0 0 ${width} ${height}`)
          .attr("style", "background-color:white")
          .classed("svg-content", true);

        let dailyData = indexIds.map(id => {
          return {
            id: id,
            label: meta.filter(d => { return d[x.index] == id })[0][x.label],
            community: meta.filter(d => { return d[x.index] == id })[0].community,
            data: data.map(d => {
              return {
                date: format(new Date(d.datetime)),
                value: +d[id],
                color: colorMap(+d[id])
              }
            })
          }
        });

        let dateDomain = data.map(d => { return d.datetime });
        let sd = new Date(dateDomain.slice(1)[0]),
            ed = new Date(dateDomain.slice(-1)[0]);

        let selectedData = dailyData[15];

        let drawCalendar = function(dailyData) {

        d3.select("#" + el.id).selectAll(".month").remove();

                // calc the months in date domain
        months = d3.timeMonth.range(d3.timeMonth.floor(sd), ed);

        // Add month svgs
        let month = canvas
          .data(months)
          .enter()
          .append("svg")
            .attr("class", "month")
            .attr("width", (cellSize * 7) + (cellMargin * 8) + 10)
            .attr("height", d => {
              let r = 8; //monthRows(d);
              return (cellSize * r) + (cellMargin * (r + 1));
            })
            .append("g");

        // add month labels
        let monthLabels = month.append("text")
          .attr("class", "month-label")
          .attr("x", ((cellSize * 7) + cellMargin * 8) / 2)
          .attr("y", 15).attr("text-anchor", "middle")
          .text(d => {
            return monthFormat(d)
          });

        // add day rects
        let day = month.selectAll("rect.day")
          .data((d, i) => {
            return d3.timeDays(d, new Date(d.getFullYear(), d.getMonth() + 1, 1));
          })
          .enter()
          .append("rect")
            .attr("class", "day")
            .attr("width", cellSize)
            .attr("height", cellSize)
            .attr("rx", 3).attr("ry", 3) // round corners
            .attr("fill", (d, i) => {
              let col = selectedData.data.filter(h => { return h.date == format(d) })[0];
              if (typeof col !== 'undefined') {
                return col.color
              } else {
                return "#eaeaea"
              }
            })
            .attr("x", d => {
              return (dayFormat(d) * cellSize + (dayFormat(d) * cellMargin) + cellMargin);
            })
            .attr("y", d => {
              let firstDay = new Date(d.getFullYear(), d.getMonth(), 1)
              return ((weekFormat(d) - weekFormat(firstDay)) * cellSize) +
                ((weekFormat(d) - weekFormat(firstDay)) * cellMargin) + cellMargin + 30
            });

        day
        .data((d, i) => {
            return d3.timeDays(d, new Date(d.getFullYear(), d.getMonth() + 1, 1));
          })
          .enter().append("text")
            .attr("x", d => {
              return (dayFormat(d) * cellSize + (dayFormat(d) * cellMargin) + cellMargin);
            })
            .attr("y", d => {
              let firstDay = new Date(d.getFullYear(), d.getMonth(), 1)
              return ((weekFormat(d) - weekFormat(firstDay)) * cellSize) +
                ((weekFormat(d) - weekFormat(firstDay)) * cellMargin) + cellMargin + 30
            })
            .attr("dy", ".35em")
            .style("fill", "white")
            .style("font", "10px sans-serif")
            .style("text-anchor", "end")
            .text(d =>{ return "HI"; });


        };

        // Allow shiny updating
        if(x.inputId != null) {
          let selectedLabel;
          $("#" + x.inputId).on("change", function() {
            selectedLabel = this.value;
            selectedData = dailyData.filter(d => {
              return d.label == selectedLabel
            })[0]
            drawCalendar(selectedData);
          });
        };

        drawCalendar(selectedData);

      },

      resize: function (width, height) {


      }

    };
  }
});
