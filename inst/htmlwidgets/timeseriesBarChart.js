let date;
HTMLWidgets.widget({

  name: 'timeseriesBarChart',

  type: 'output',

  factory: function(el, width, height) {

    let margin = {
      top: 10,
      bottom: 40,
      left: 25,
      right: 10
    };

    // color ramp map
    let col = d3.scaleThreshold()
      .domain([12, 35, 55, 75, 100])
      // SCAQMD profile
      .range(["#abe3f4", "#118cba", "#286096", "#8659a5", "#6a367a"]);

    // TODO: define shared variables for this instance
      let dropdown = d3.select(el).append("select")
        .attr("display", "block")
      let svgPlot = d3.select(el).append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("preserveAspectRatio", "xMinYMin meet")
        .attr("viewBox", `0 0 ${width} ${height}` )
        .classed("svg-content", true);;

    let ct_sel = new crosstalk.SelectionHandle();

    return {

      renderValue: function(x) {


        let data;
        let meta;
      let focusData;

        meta = HTMLWidgets.dataframeToD3(x.meta);
        data = HTMLWidgets.dataframeToD3(x.data);

        sensorIDs = meta.map(d => {
          return d.monitorID
        })

        focusData = sensorIDs.map(id => {
          return {
            id: id,
            data: data.map(d => {
              return {
                date: d.datetime,
                value: +d[id],
                color: col(+d[id])
              }
            })
          }
        })

        let yMax = 50; //d3.max(selectedData.data, d => { return d.value });
        let xDomain = data.map(d => { return d.datetime }) //selectedData.data.map(d => { return d.date });

        let xScale = d3.scaleBand()
                      .domain(xDomain)
                      .range([ margin.left, width - margin.right - margin.left ])
                      .padding(0.5);
        let yScale = d3.scaleLinear()
                      .domain([ 0, yMax ])
                      .range([ height - margin.bottom, margin.top ]);


        let xAxis = d3.axisBottom(xScale)
                      .tickSizeOuter(0);
        let yAxis = d3.axisLeft(yScale)
                      .tickSizeOuter(0);

        svgPlot.append("g")
                .attr("class", "x-axis")
                .attr("transform", `translate(0,${ height - margin.bottom })`)
                .call(xAxis)

        svgPlot.append("g")
                .attr("class", "y-axis")
                .attr("transform", `translate(${ margin.left },0)`)
                .call(yAxis)

        let updateBars = function(d) {

          let bars = svgPlot.selectAll(".bar")
               .data( d.data );

          bars.enter()
              .append("rect")
                  .attr("class", "bar")
                  .attr("x", d => { return xScale(d.date) })
                  .attr("y", d => { return yScale(d.value) })
                  .attr("date", d => { return d.date })
                  .attr("width", xScale.bandwidth())
                  .attr("height", d => { return yScale(0) - yScale(d.value) })
                  .style("fill",  d => { return d.color })
              .on("mouseover", mouseIn)
              .on("mouseout", mouseOut);


        // Update old ones, already have x / width from before
          bars.transition()
          .duration(300)
          .attr("y", (d, i) =>  { return yScale(d.value); })
          .attr("height", (d,i) => { return yScale(0) - yScale(d.value); })
          .style("fill",  d => { return d.color });

        };

          function mouseIn(d) {
            date = d.date;
            d3.select(d3.event.target)
              .style("stroke", "red")
          };

          function mouseOut(d) {
            d3.select(d3.event.target)
            .transition()
            .duration(150)
            .style("stroke", "transparent");
          };

          dropdown.selectAll("option")
                    .data(sensorIDs)
                    .enter()
                    .append("option")
                    .attr("value", d => { return d })
                    .text(d => { return d });
          dropdown.on("change", dropdownChange);

          function dropdownChange() {
            let selectedID = d3.select(this).property('value')
            selectedData = focusData.filter(d => { return d.id == selectedID })[0]
            console.log(selectedData)
            updateBars(selectedData)
          };

        let initData = focusData[0]
        updateBars(initData)

        // Remove old ones
        bars.exit().remove();



      },

      resize: function(width, height) {

        // TODO: code to re-render the widget with a new size
        svgPlot.attr("width", width)
        .attr("height", height);
//width(width).height(height)(false);

      }

    };
  }
});
