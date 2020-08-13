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

    /*
    Helpers
    */

    let formatDateIntoDay = d3.timeFormat("%b %d");
    let formatDateIntoHr = d3.timeFormat("%b %d %H:00");
    let strictIsoParse = d3.utcParse("%Y-%m-%dT%H:%M:%SZ");
    let roundUtcDate = d3.utcFormat("%Y-%m-%dT%H:00:00Z");
    let formatValue = d3.format(".1f");

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

        let xScale; // init function for scaling function
        let yScale;

        // Remove old stuff first!
        d3.select("#" + el.id).selectAll("svg").remove()

        let canvas = d3.select("#"+el.id)
            .append("svg")
            .attr("width", width)
            .attr("height", height)
            .attr("preserveAspectRatio", "xMinYMin meet")
            .attr("viewBox", `0 0 ${width} ${height}`)
            .attr("style", "background-color:white")
            .classed("svg-content", true);

        // create bar data
        let barData = indexIds.map(id => {
          return {
            id: id,
            label: meta.filter(d => { return d[x.index] == id })[0][x.label],
            community: meta.filter(d => { return d[x.index] == id })[0].community,
            data: data.map(d => {
              return {
                date: new Date(d.datetime),
                value: formatValue(+d[id]),
                color: colorMap(+d[id])
              }
            })
          }
        });

        let selectedData = barData[0];

        let drawAxis = function(data) {

          d3.select("#" + el.id).selectAll(".axis").remove();

          let dateDomain = data.map(d => { return d3.timeFormat("%m-%d-%Y %H:%M:%S")(new Date(d.datetime)) });
          let sd = dateDomain.slice(1)[0],
              ed = dateDomain.slice(-1)[0];

          xScale = d3.scaleBand()
            .domain(dateDomain)
            .range([margin.left, width - margin.right - margin.left])
            .padding(0.15);
          yScale = d3.scaleLinear()
            .domain([0, 50]) // Set 50 to be constant y lim
            .range([height - margin.bottom, margin.top]);

          let ticks = xScale.domain().filter((d, i) => {
              let n;
              if ( dateDomain.length/24 > 29 ) {
                n = 7;
              } else if ( dateDomain.length/24 > 16  ) {
                n = 4;
              } else {
                n = 1;
              }
              return !(i%(24*n))
          });

          // Create x axis
          let xAxis = d3.axisBottom(xScale)
            .tickSizeOuter(0)
            // tick every 24 hours
            .tickValues(ticks);

          let yAxis = d3.axisLeft(yScale)
            .tickSizeOuter(0);

          // Create axis canvas
          let axisCanvas = d3.select("#"+el.id)
            .select("svg")
            .append("g")
            .attr("class", "axis");

          // Add x axis
          axisCanvas
            .append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0,${ height - margin.bottom })`)
            .call(xAxis);

          // Add y axis
          axisCanvas
            .append("g")
            .attr("class", "y-axis")
            .attr("transform", `translate(${ margin.left },0)`)
            .call(yAxis);

          // Create axis labels
          axisCanvas.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 0)
            .attr("x", 0 - (height / 2))
            .attr("dy", "0.8em")
            .style("text-anchor", "middle")
            .text(x.ylab);

          axisCanvas.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 0)
            .attr("x", 0 - (height / 2))
            .attr("dy", "0.8em")
            .style("text-anchor", "middle")
            .text(x.xlab);
        };

        let drawBars = function(barData) {

          d3.select("#" + el.id).selectAll(".bar").remove();
          d3.select("#" + el.id).selectAll(".tooltip").remove();
                // create a tooltip
          let tooltip = d3.select("#" + el.id)
            .append("div")
            .attr("class", "tooltip")
            .style("opacity", 0)
            .style("background-color", "transparent")
            .style("padding", "5px")
            .style("position", "relative")
            .style("top", "-92%")
            .style("left", "72%")
            .style("width", "25%")

          function barMouseOver(d) {
            date = d.date;
            val = d.value;
            d3.select(d3.event.target)
              .style("stroke", "red")
            tooltip
              .transition()
              .delay(75)
              .style("opacity", 1)
          }

          function barMouseOut(d) {
            d3.select(d3.event.target)
              .transition()
              .duration(150)
              .style("stroke", "transparent")
            tooltip
              .transition()
              .delay(100)
              .style("opacity", 0)
          }

          function barMouseMove(d) {
          tooltip
            .html(`${d3.timeFormat("Date: %H:%M %b %d, %Y")(d.date)}<br>Value: ${d.value} ${x.ylab}`)
            .style("font-size", "1em")
            .style("font-family", "sans-serif")
            .append("svg")
            .style("position", "absolute")
            .style("left", "-12%")
            .style("top", "40%")
            .append("rect")
            .attr("class", "highlight-color")
            .attr("width", "1.5em")
            .attr("height", "0.5em")
            .style("fill", d.color)
            .style("rx", "0.2em");
          }

          let barCanvas = d3.select("#"+el.id)
            .select("svg")
            .append("g")
            .attr("class", "bars");

          let bars = barCanvas
            .selectAll(".bar")
            .data(barData.data)
            .enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", d => {
              return xScale(d3.timeFormat("%m-%d-%Y %H:%M:%S")(d.date))
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

        bars.on("mousemove", barMouseMove)
            .on("mouseout", barMouseOut)
            .on("mouseover", barMouseOver)

        };

        // Allow shiny updating
        if(x.inputId != null) {
          let selectedLabel;
          $("#" + x.inputId).on("change", function() {
            selectedLabel = this.value;
            selectedData = barData.filter(d => {
              return d.label == selectedLabel
            })[0]
            update(data, selectedData);
          });
        };

        function update(data, selectedData) {
          drawAxis(data);
          drawBars(selectedData);
        };

        update(data, selectedData)

      },

      resize: function (width, height) {
        canvas
          .attr("width", width)
          .attr("height", height);
      }

    };
  }

});
