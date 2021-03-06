HTMLWidgets.widget({

  name: 'timeseriesCalendar',

  type: 'output',

  // prepare the html element
  factory: function (el, width, height) {


    let cellMargin = 2,
        cellSize = width / (29 + 2 * cellMargin); // 29 days per row and padding

    function prepData(X) {

      // Remap the colors
      const colorMap = function (value) {
        if (value === null) {
          return "#F4F4F4";
        } else {
          return d3.scaleThreshold()
            .domain(X.breaks)
            .range(X.colors)(value);
        }
      };

      // Remap the values
      const valueMap = function (value) {
        if (value === 0) {
          return undefined;
        } else {
          return value;
        }
      };

      // Load the data
      const meta = HTMLWidgets.dataframeToD3(X.meta);
      const data = HTMLWidgets.dataframeToD3(X.data);

      let dateDomain = data.map(d => {
        return d.datetime;
      });
      let sd = new Date(dateDomain.slice(1)[0]),
        ed = new Date(dateDomain.slice(-1)[0]);

      // Index IDs using passed in index str
      const indexIds = meta.map(d => {
        return d[X.index];
      });

      const dailyData = indexIds.map(id => {
        return {
          id: id,
          label: meta.filter(d => {
            return d[X.index] == id;
          })[0][X.label],
          data: data.map(d => {
            return {
              date: d3.timeFormat("%Y-%m-%d")(d3.timeParse("%Y-%m-%dT%H:%M:%SZ")(d.datetime)),
              value: valueMap(+d[id]),
              color: colorMap(+d[id])
            };
          }),
          domain: {
            sd,
            ed
          }
        };
      });
      return dailyData;

    }

    if (width < 0) width = 0;
    if (height < 0) height = 0;

    // Create root canvas grid element
    let canvas = d3.select(el)
      .append("div")
      .attr("class", "grid-container")
      .style("display", "grid")
      .style("grid-template-columns", "auto auto auto auto")
      .style("grid-template-rows", "auto auto auto")
      .style("padding", "5px")
      .selectAll("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("style", "background-color:white")
      .classed("svg-content", true);

    // Create tooltip content div
    let tooltip = d3.select(".tooltip-calendar");
    if (tooltip.empty()) {
      tooltip = d3.select("body")
        .append("div")
        .style("visibility", "hidden")
        .attr("class", "tooltip-calendar")
        .style("background-color", "#282b30")
        .style("border", "solid")
        .style("border-color", "#282b30")
        .style("border-width", "2px")
        .style("border-radius", "5px")
        .style("width", width / 12)
        .style("color", "#F4F4F4")
        .style("position", "absolute");
    }

    // Return the widget instance object
    return {

      renderValue: function (x) {

        // Create array of day data objects for each sensor
        const dayta = prepData(x);

        // Draw the months within the data date domain
        function drawMonths(data) {

          d3.selectAll(".month-cell").remove();

          // Create svg for each month of data
          months = d3.timeMonth.range(d3.timeMonth.floor(data.domain.sd), data.domain.ed);
          let elem = document.querySelector("div#" + el.id);
          let view = elem.getBoundingClientRect();


          let svg = canvas
            .data(months)
            .enter()
            .append("svg")
            .attr("class", "month-cell")
            .attr("width", view.width / 4) //(cellSize * 7) + (cellMargin * 8) + cellSize)
            .attr("height", () => {
              let rows = 8;
              return (cellSize * rows) + (cellMargin * (rows + 1));
            });

          // Add the title of each svg month
          svg
            .append("text")
            .attr("class", "month-label")
            .attr("x", ((cellSize * 7) + cellMargin * 8) / 2)
            .attr("y", "1em")
            .attr("text-anchor", "middle")
            .attr("font-family", "sans-serif")
            .attr("font-size", cellSize * 0.5)
            .text(d => {
              return d3.timeFormat("%B")(d);
            });

          // Add the g layer to each day to append rect and text to
          svg
            .selectAll("g.day")
            .data((d, i) => {
              return d3.timeDays(d, new Date(d.getFullYear(), d.getMonth() + 1, 1));
            })
            .enter()
            .append("g")
            .attr("class", "day");

          // Add the default color fill
          svg
            .selectAll("g.day")
            .append("rect")
            .attr("class", "day-fill")
            .attr("width", cellSize)
            .attr("height", cellSize)
            .attr("rx", 3).attr("ry", 3) // round corners
            .attr("fill", "#F4F4F4") // Default colors
            .style("opacity", 0.95)
            .attr("x", d => {
              let n = d3.timeFormat("%w")(d);
              return ((n * cellSize) + (n * cellMargin) + cellSize / 2 + cellMargin);
            })
            .attr("y", d => {
              let firstDay = new Date(d.getFullYear(), d.getMonth(), 1);
              return ((d3.timeFormat("%U")(d) - d3.timeFormat("%U")(firstDay)) * cellSize) +
                ((d3.timeFormat("%U")(d) - d3.timeFormat("%U")(firstDay)) * cellMargin) + cellMargin + cellSize;
            });

          // Add the day text to each cell
          svg
            .selectAll("g.day")
            .append("text")
            .attr("class", "day-text")
            .attr("text-anchor", "middle")
            .attr("font-family", "sans-serif")
            .attr("font-size", cellSize * 0.45)
            .style("opacity", 0.75)
            .text(d => {
              return d3.timeFormat("%e")(d);
            })
            .attr("x", d => {
              let n = d3.timeFormat("%w")(d);
              return ((n * cellSize) + (n * cellMargin) + cellSize + cellMargin);
            })
            .attr("y", d => {
              let firstDay = new Date(d.getFullYear(), d.getMonth(), 1);
              return ((d3.timeFormat("%U")(d) - d3.timeFormat("%U")(firstDay)) * cellSize) +
                ((d3.timeFormat("%U")(d) - d3.timeFormat("%U")(firstDay)) * cellMargin) + cellMargin + cellSize + (cellSize / 2 + cellSize * 0.45 / 2);
            });

          // Add the weekday text below title (mon, tues, etc)
          svg
            .selectAll("g.rect.day")
            .data((d, i) => {
              return d3.timeDays(d, new Date(d.getFullYear(), d.getMonth() + 1, 1));
            })
            .enter()
            .append("text")
            .attr("class", "weekday-text")
            .attr("text-anchor", "middle")
            .attr("font-family", "sans-serif")
            .attr("font-size", cellSize * 0.33)
            .attr("width", cellSize)
            .attr("height", cellSize)
            .attr("x", (d, i) => {
              if (i < 7) {
                let n = d3.timeFormat("%w")(d);
                return ((n * cellSize) + (n * cellMargin) + cellSize + cellMargin);
              }
            })
            .attr("y", cellSize)
            .text((d, i) => {
              if (i < 7) {
                return d3.timeFormat("%a")(d);
              }
            });
        }

        // Draw the date color fill on the calendar days using passed in data
        function drawDateColor(data) {

          // Make the day cell tooltip/highlight
          d3.selectAll("g.day")
            .on("mouseover", d => {
              tooltip
                .style("visibility", "visible")
                .style('left', `${event.pageX + 10}px`)
                .style('top', `${event.pageY + 10}px`)
                .text(() => {
                  let cell = (data.data.filter(h => {
                    return h.date == d3.timeFormat("%Y-%m-%d")(d);
                  }))[0];
                  if (cell.value !== undefined) {
                    // // //return d3.timeFormat("%B %d, %Y")(d) + ": " + cell.value.toFixed(1) + " \u00B5g/m\u00B3";
                    return cell.value.toFixed(1) + x.unitString;
                  } else {
                    // // //return d3.timeFormat("%B %d, %Y")(d) + "";
                    return "NA";
                  }

                })
                .style("text-anchor", "middle")
                .style("font-family", "sans-serif")
                .style("font-size", "0.7em");

              d3.select(this.event.target.parentNode)
                .select("rect.day-fill")
                .style("stroke", "#2D2926")
                .style("stroke-width", cellMargin);
            })
            .on("mouseout", d => {
              d3.select(this.event.target.parentNode)
                .select("rect.day-fill")
                .style("stroke", "transparent");
              tooltip
                .style("visibility", "hidden")
                .text(""); // Erase the text on mouse out
            });

          // Fill colors
          d3.selectAll("rect.day-fill")
            .transition()
            .duration(500)
            .attr("fill", (d, i) => {
              let col = data.data.filter(h => {
                return h.date == d3.timeFormat("%Y-%m-%d")(d);
              })[0];
              if (typeof col !== 'undefined') {
                return col.color;
              } else {
                return "#F4F4F4";
              }
            });
        }

        // initialize using datetime axis of first (if only) data
        drawMonths(dayta[0]);

        // update teh colors
        function update(data) {
          drawDateColor(data);
        };

        // Allow shiny updating
        if (x.inputId !== null) {

          // Init
          let label = $("#" + x.inputId)[0].selectize.getValue();
          let data = dayta.filter(d => { return d.label == label; })[0];
          update(data);

          $("#" + x.inputId).on("change", function () {
            label = this.value;
            data = dayta.filter(d => { return d.label == label; })[0];
            update(data);
          });

        } else {
          update(dayta[0]);
        }

      },

      resize: function (width, height) {

      }

    };
  }
});
