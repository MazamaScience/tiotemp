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

        d3.select("#" + el.id).selectAll(".month-cell").remove();

                // calc the months in date domain
        months = d3.timeMonth.range(d3.timeMonth.floor(sd), ed);

        // Add month svgs
        let monthCell = canvas
          .data(months)
          .enter()
          .append("svg")
            .attr("class", "month-cell") // HMM
            .attr("width", (cellSize * 7) + (cellMargin * 8) + 10)
            .attr("height", d => {
              let r = 8; //monthRows(d);
              return (cellSize * r) + (cellMargin * (r + 1));
            })
            .append("g");

        // add month labels
        monthCell.append("text")
          .attr("class", "month-label")
          .attr("x", ((cellSize * 7) + cellMargin * 8) / 2)
          .attr("y", 12)
          .attr("text-anchor", "middle")
          .attr("font-family", "sans-serif")
          .text(d => {
            return monthFormat(d)
          });

          // Add date-text
          monthCell.selectAll("rect.day")
          .data((d, i) => {
            return d3.timeDays(d, new Date(d.getFullYear(), d.getMonth() + 1, 1));
          })
          .enter()
          .append("text")
            .attr("class", "day-text")
            .attr("text-anchor","middle")
            .attr("font-family", "sans-serif")
            .attr("font-size", "1em")
            .style("stroke", "black")
            .style("stroke-width", "0.02em")
            .attr("width", cellSize)
            .attr("height", cellSize)
            .attr("x", d => {
              let n = dayFormat(d);
              return ( ( n * cellSize ) + ( n * cellMargin ) + cellSize/2 + cellMargin)
            })
            .attr("y", d => {
              let firstDay = new Date(d.getFullYear(), d.getMonth(), 1)
              let n = weekFormat(d) - weekFormat(firstDay)
              return ( ( n * cellSize ) + ( n  * cellMargin )  +  cellSize + cellSize  - cellSize/4)
            })
            .text(d => { return d3.timeFormat("%e")(d) })

        // add day rects
        let dayCell = monthCell.selectAll("rect.day")
          .data((d, i) => {
            return d3.timeDays(d, new Date(d.getFullYear(), d.getMonth() + 1, 1));
          })
          .enter()
          .append("rect")
            .attr("class", "day-fill")
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
            .style("opacity", 0.8)
            .attr("x", d => {
              return (dayFormat(d) * cellSize + (dayFormat(d) * cellMargin) + cellMargin);
            })
            .attr("y", d => {
              let firstDay = new Date(d.getFullYear(), d.getMonth(), 1)
              return ((weekFormat(d) - weekFormat(firstDay)) * cellSize) +
                ((weekFormat(d) - weekFormat(firstDay)) * cellMargin) + cellMargin + 30
            });



          // Weekday text below title
          let weekDayText = monthCell.selectAll("rect.day")
          .data((d, i) => {
            return d3.timeDays(d, new Date(d.getFullYear(), d.getMonth() + 1, 1));
          })
          .enter()
          .append("text")
            .attr("class", "weekday-text")
            .attr("text-anchor","middle")
            .attr("font-family", "sans-serif")
            .attr("font-size", "0.6em")
            .attr("width", cellSize)
            .attr("height", cellSize)
            .attr("x", (d, i) => {
              if ( i < 7 ) {
                let n = dayFormat(d);
                return ( ( n * cellSize ) + ( n * cellMargin ) + cellSize/2 + cellMargin)
              }
            })
            .attr("y", 30 - cellMargin)
            .text((d,i) => {
              if ( i < 7 ) {
                return d3.timeFormat("%a")(d)
              }
            })

          // Add mouseover highlighting
          function cellMouseOver(d) {
            d3.select(d3.event.target)
              .style("stroke", "red")
          }

          function cellMouseOut(d) {
            d3.select(d3.event.target)
              .transition()
              .duration(150)
              .style("stroke", "transparent");
          }


          dayCell
            .on("mouseover", cellMouseOver)
            .on("mouseout", cellMouseOut)

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
