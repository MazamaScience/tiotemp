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

          let dateDomain = data.map(d => { return d.datetime });
          let sd = dateDomain.slice(1)[0],
              ed = dateDomain.slice(-1)[0];

          xScale = d3.scaleBand()
            .domain(dateDomain)
            .range([margin.left, width - margin.right - margin.left])
            .padding(0.5);
          yScale = d3.scaleLinear()
            .domain([0, 50]) // Set 50 to be constant y lim
            .range([height - margin.bottom, margin.top]);

          // Create x axis
          let xAxis = d3.axisBottom(xScale)
            .tickSizeOuter(0)
            // tick every 24 hours
            .tickValues(xScale.domain().filter((d, i) => { return !(i % 24) }));

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

          function barMouseOver(d) {
            date = d.date;
            val = d.value;
            d3.select(d3.event.target)
              .style("stroke", "red")
          }

          function barMouseOut(d) {
            d3.select(d3.event.target)
              .transition()
              .duration(150)
              .style("stroke", "transparent");
          }

          function barMouseMove(d) {
            //console.log(d)
  /*          tooltip
              .transition()
              .duration(10)
              .style("top", (yScale(d.value) - 10 + "px"))
              .style("left", (xScale(d.date) + 8 + "px"));*/
          }

          let barCanvas = d3.select("#"+el.id)
            .select("svg")
            .append("g")
            .attr("class", "bars");

          barCanvas
            .selectAll(".bar")
            .data(barData.data)
            .enter()
            .append("rect")
            .attr("class", "bar")
            //.transition()
            //.duration(150)
            .attr("x", d => {
              return xScale(roundUtcDate(d.date))
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
            .on("mousemove", barMouseMove)
            .on("mouseout", barMouseOut)
            .on("mouseover", barMouseOver);

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
