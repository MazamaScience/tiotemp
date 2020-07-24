HTMLWidgets.widget({

  name: 'timeseriesBarChart',

  type: 'output',

  factory: function (el, width, height) {

    let margin = {
      top: 25,
      bottom: 45,
      left: 45,
      right: 10
    };

    // color ramp map
    let col = d3.scaleThreshold()
      .domain([12, 35, 55, 75, 100])
      // SCAQMD profile
      .range(["#abe3f4", "#118cba", "#286096", "#8659a5", "#6a367a"]);

    // TODO: define shared variables for this instance

    d3.selectAll("svg").remove()

    let svgPlot = d3.select(el).append("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("preserveAspectRatio", "xMinYMin meet")
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("style", "background-color:white")
      .classed("svg-content", true);


    let ct_sel = new crosstalk.SelectionHandle();

    return {

      renderValue: function (x) {

        let date;
        let val;
        let data;
        let meta;
        let focusData;

        meta = HTMLWidgets.dataframeToD3(x.meta);
        data = HTMLWidgets.dataframeToD3(x.data);

        sensorIDs = meta.map(d => {
          return d.monitorID
        })




        let formatVal = d3.format(".1f");

        focusData = sensorIDs.map(id => {
          return {
            id: id,
            data: data.map(d => {
              return {
                date: d.datetime,
                value: formatVal(+d[id]),
                color: col(+d[id])
              }
            })
          }
        })

        let yMax = 50; //d3.max(selectedData.data, d => { return d.value });
        let xDomain = data.map(d => {
          return d.datetime
        }) //selectedData.data.map(d => { return d.date });

        let xScale = d3.scaleBand()
          .domain(xDomain)
          .range([margin.left, width - margin.right - margin.left])
          .padding(0.5);
        let yScale = d3.scaleLinear()
          .domain([0, yMax])
          .range([height - margin.bottom, margin.top]);


        let xAxis = d3.axisBottom(xScale)
          .tickSizeOuter(0)
          .tickValues(xScale.domain().filter((d, i) => {
            return !(i % 24)
          })
          );

        let yAxis = d3.axisLeft(yScale)
          .tickSizeOuter(0);

        svgPlot.append("g")
          .attr("class", "x-axis")
          .attr("transform", `translate(0,${ height - margin.bottom })`)
          .call(xAxis);

        svgPlot.append("g")
          .attr("class", "y-axis")
          .attr("transform", `translate(${ margin.left },0)`)
          .call(yAxis);
        // y axis label
        svgPlot.append("text")
          .attr("transform", "rotate(-90)")
          .attr("y", 0)
          .attr("x", 0 - (height / 2))
          .attr("dy", "0.8em")
          .style("text-anchor", "middle")
          .text(x.ylab);
        // title, subtitle
        let title = svgPlot.append("text")
          .attr("x", (width / 2))
          .attr("y", (margin.top / 2))
          .attr("text-anchor", "middle")
          .style("font-size", "1em")
        //.style("text-decoration", "underline");

        let subtitle = svgPlot.append("text")
          .attr("x", (width / 2))
          .attr("y", (margin.top / 2 + 16))
          .attr("text-anchor", "middle")
          .style("font-size", "0.5em")
        //.style("text-decoration", "underline");


        if (meta.length > 1) {
          let dropdown = d3.select(el).insert("select", ":first-child")
            .attr("display", "block")

          dropdown.selectAll("option")
            .data(sensorIDs)
            .enter()
            .append("option")
            .attr("value", d => {
              return d
            })
            .text(d => {
              return d
            });
          dropdown.on("change", dropdownChange);

        }

        let tooltip = d3.select("body")
          .append("div")
          .style("position", "absolute")
          .style("z-index", "10")
          .style("visibility", "hidden")

        let updateBars = function (d) {

          let bars = svgPlot.selectAll(".bar")
            .data(d.data);

          bars.enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", d => {
              return xScale(d.date)
            })
            .attr("y", d => {
              return yScale(d.value)
            })
            .attr("date", d => {
              return d.date
            })
            .attr("width", xScale.bandwidth())
            .attr("height", d => {
              return yScale(0) - yScale(d.value)
            })
            .style("fill", d => {
              return d.color
            })
            .on("mouseover", mouseIn)
            .on("mouseout", mouseOut)
            .on("mousemove", mouseMove);

          // Update old ones, already have x / width from before
          bars.transition()
            .duration(300)
            .attr("y", (d, i) => {
              return yScale(d.value);
            })
            .attr("height", (d, i) => {
              return yScale(0) - yScale(d.value);
            })
            .style("fill", d => {
              return d.color
            });

            //axis update
            d3.selectAll(".x-axis").transition().duration(100).call(xAxis)

          if (x.title != null) {
            title.text(x.title);
          }

          if (x.subtitle != null) {
            subtitle.text(x.subtitle);
          }

          // Remove old ones
          bars.exit().remove();
          svgPlot.exit().remove();

          };

        function mouseIn(d) {
          date = d.date;
          val = d.value;
          d3.select(d3.event.target)
            .style("stroke", "red")
          tooltip
            .transition()
            .duration(150)
            .style("visibility", "visible").text(val)
        };

        function mouseOut(d) {
          d3.select(d3.event.target)
            .transition()
            .duration(150)
            .style("stroke", "transparent");
          tooltip
            .transition()
            .duration(150)
            .style("visibility", "hidden");
        };

        function mouseMove(d) {
          tooltip
            .transition()
            .duration(10)
            .style("top", (yScale(d.value) - 10 + "px"))
            .style("left", (xScale(d.date) + 8 + "px"));
        };

        function dropdownChange() {
          let selectedID = d3.select(this).property('value')
          selectedData = focusData.filter(d => {
            return d.id == selectedID
          })[0]
          updateBars(selectedData)
        };



        let initData = focusData[0]
        updateBars(initData)

      },

      resize: function (width, height) {

        // TODO: code to re-render the widget with a new size
        svgPlot.attr("width", width)
          .attr("height", height);
        //width(width).height(height)(false);

      }

    };
  }
});
