let data;
let dailyData;
let sensorIDs;
HTMLWidgets.widget({

  name: 'timeseriesCalendar',

  type: 'output',

  factory: function(el, width, height) {

    // Calulate the number of rows per month
    let monthRows = function(month) {
      let m = d3.timeMonth.floor(month);
      return d3.timeWeeks(d3.timeWeek.floor(m),
                          d3.timeMonth.offset(m,1)).length;
    };

    // aes
    let cellMargin = 2,
        cellSize = 20;

    // helpers
    let dayFormat = d3.timeFormat("%w"),
        weekFormat = d3.timeFormat("%U"),
        format = d3.timeFormat("%Y-%m-%d"),
        titleFormat = d3.utcFormat("%a, %d-%b"),
        monthFormat = d3.timeFormat("%B")

    // Create canvas
    let canvas = d3.select(el)
                  .selectAll("svg")
                  .attr("width", width)
                  .attr("height", height)
                  .attr("preserveAspectRatio", "xMinYMin meet")
                  .attr("viewBox", `0 0 ${width} ${height}`)
                  .attr("style", "background-color:white")
                  .classed("svg-content", true);

    let tooltip = d3.select("body")
                    .append("div")
                    .style("opacity", 0)
                    .attr("class", "tooltip")
                    .style("background-color", "white")
                    .style("border", "solid")
                    .style("border-width", "2px")
                    .style("border-radius", "5px")
                    .style("padding", "5px")
                      .style("position", "absolute")
                    .style("z-index", "10")
/*                    .append("div")

                    .style("visibility", "hidden")*/

                      // create a tooltip
 // var Tooltip = d3.select("#div_template")


    // Create color ramp profile
    let colorMap = d3.scaleThreshold()
      .domain([12, 35, 55, 75, 100])
      // SCAQMD profile
      .range(["#abe3f4", "#118cba", "#286096", "#8659a5", "#6a367a"]);

    return {

      renderValue: function(x) {

        // Access data

        let meta;

        data = HTMLWidgets.dataframeToD3(x.data);
        meta = HTMLWidgets.dataframeToD3(x.meta);

        // Sensor IDs
        sensorIDs = meta.map(d => {
          return d.monitorID
        });

        dailyData = sensorIDs.map(id => {
          return {
            id: id,
            data: data.map(d => {
              return {
                date: format(new Date(d.datetime)),
                value: d3.format(".1f")(+d[id]),
                color: colorMap(+d[id])
              }
            })
          }
        });

        // DEV
        let dd = dailyData[0];

        // create start and enddates
        let sd = d3.min(data, d => { return new Date(d.datetime) });
        let ed = d3.max(data, d => { return new Date(d.datetime) });

        // calc the months in date domain
        months = d3.timeMonth.range(d3.timeMonth.floor(sd), ed);

        // Add month svgs
        let month = canvas.data(months)
                              .enter()
                              .append("svg")
                                .attr("class", "month")
                                .attr("width", (cellSize*7) + (cellMargin*8) + 10)
                                .attr("height", d => {
                                  let r = 8;//monthRows(d);
                                  return (cellSize*r) + (cellMargin*(r+1));
                                })
                              .append("g")
        // add month labels
        let monthLabels = month.append("text")
                .attr("class", "month-label")
                .attr("x", ((cellSize*7) + cellMargin*8) / 2)
                .attr("y", 15)                .attr("text-anchor", "middle")
                .text(d => { return monthFormat(d) });

        // add day rects
        let day = month.selectAll("rect.day")
                        .data((d,i) => {
                          return d3.timeDays(d, new Date(d.getFullYear(), d.getMonth()+1, 1));
                        })
                        .enter().append("rect")
                        .attr("class", "day")
                        .attr("width", cellSize)
                        .attr("height", cellSize)
                        .attr("rx", 3).attr("ry", 3) // round corners
                        .attr("fill", (d,i) => {
                          let colData = dd.data.filter(h => { return h.date == format(d) })[0];
                          if ( typeof colData !== 'undefined' ) {
                            return colData.color
                          } else {
                            return "#eaeaea"
                          }
                        })
                        .attr("x", d => {
                          return (dayFormat(d)*cellSize+(dayFormat(d)*cellMargin)+cellMargin);
                        })
                        .attr("y", d => {
                          let firstDay = new Date(d.getFullYear(), d.getMonth(),1)
                          return ((weekFormat(d) - weekFormat(firstDay)) * cellSize) +
                          ((weekFormat(d) - weekFormat(firstDay)) * cellMargin) + cellMargin + 30
                        });

        let focus,
            focusValue,
            focusDate;

        // Add mouseover
        function mouseOver(d) {
          focus = dd.data.filter(h => { return h.date == format(d) })[0];
          focusDate = focus.date;
          focusVal = focus.value;
          if ( typeof focus !== 'undefined' ) {

          } else {

          }

          console.log(d)

          d3.select(d3.event.target)
            .style("stroke", "red")

    tooltip
      .style("opacity", 1)
    d3.select(this)
      .style("stroke", "black")
      .style("opacity", 1)
        };
        // mouseout
        function mouseOut(d) {
          d3.select(d3.event.target)
            .transition()
            .duration(150)
            .style("stroke", "transparent");

   tooltip
      .style("opacity", 0)
    d3.select(this)
      .style("stroke", "none")
      .style("opacity", 0.8)
        };
  let mouseMove = function(d) {
    console.log(d3.mouse(this))
    tooltip
      .html("Value: " + focusVal)
      .style("left", (d3.mouse(this)[0]) + "px")
      .style("top", (d3.mouse(this)[1]) + "px")
  }

        day.on("mouseover", mouseOver)
            .on("mouseout", mouseOut)
            .on("mousemove", mouseMove)


      },

      resize: function(width, height) {

        // TODO: code to re-render the widget with a new size

      }

    };
  }
});
