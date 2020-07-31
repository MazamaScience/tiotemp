HTMLWidgets.widget({

  name: 'timeseriesMap',

  type: 'output',

  factory: function (el, width, height) {

    /*
    Helpers
    */

    // Create color ramp profile
    let colorMap = d3.scaleThreshold()
      .domain([12, 35, 55, 75, 100])
      // SCAQMD profile
      .range(["#abe3f4", "#118cba", "#286096", "#8659a5", "#6a367a"]);

    let formatDateIntoDay = d3.timeFormat("%b %d");
    let formatDateIntoHr = d3.timeFormat("%b %d %H:00");
    let strictIsoParse = d3.utcParse("%Y-%m-%dT%H:%M:%SZ");
    let roundUtcDate = d3.utcFormat("%Y-%m-%dT%H:00:00Z");

    let average = (array) => array.reduce((a, b) => a + b) / array.length;

    /*
    Create the map as the base for for appending svgs
    */

    // Create map
    let map = L.map(el.id); // center position + zoom

    // Add a tile to the map = a background. Comes from OpenStreetmap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>',
        maxZoom: 18,
      }).addTo(map)


    return {
      renderValue: function (x) {

        // Load the data
        const meta = HTMLWidgets.dataframeToD3(x.meta);
        const data = HTMLWidgets.dataframeToD3(x.data);

        // Add a LatLng object for leaflet to the metadata
        meta.forEach(d => {
          d.LatLng = new L.LatLng(d.latitude, d.longitude)
        });

        // Get center cords from meta and set the view to center
        centerLat = average(meta.map(d => { return d.latitude }));
        centerLon = average(meta.map(d => { return d.longitude }));
        map.setView([centerLat, centerLon], 6);

        // Index sensorLabels //sensorIDs
        let sensorIds = meta.map(d => { return d.monitorID });

        let dateDomain = data.map(d => { return new Date(d.datetime) });
        let sd = dateDomain.slice(1)[0],
            ed = dateDomain.slice(-1)[0]
        let currentDate = sd;

        // Create two scales; the x scale of the canvas itself,
        // and the x date scale of the data for mapping datetimes to index
        let xScale = d3.scaleTime()
          .domain([sd, ed])
          .rangeRound([0, width/2])
          .clamp(true);
        let dateScale = d3.scaleTime()
          .domain([sd, ed])
          .rangeRound([0, data.length])
          .clamp(true);

        let playing = true;

        // Create point location data object from each sensor label
        // contains leaflet latlng obj, hourly data, and mapped point color
        let pointData = sensorIds.map(id => {
          return {
            id: id,
            label: meta.filter(d => { return d.monitorID == id })[0].label,
            community: meta.filter(d => { return d.monitorID == id })[0].community,
            LatLng: meta.filter(d => { return d.monitorID == id })[0].LatLng,
            data: data.map(d => {
              return {
                date: new Date(d.datetime),
                value: +d[id],
                color: colorMap(+d[id])
              }
            })
          }
        });

        // Update the points position on map move
        function updatePointLocation() {
          d3.selectAll(".point")
            .attr("cx", d => { return map.latLngToLayerPoint(d.LatLng).x })
            .attr("cy", d => { return map.latLngToLayerPoint(d.LatLng).y })
        };

        function updatePointColor(x) {
          let roundedDate = new Date(d3.utcFormat("%Y-%m-%dT%H:00:00.%LZ")(x))
          let i = dateScale(roundedDate);
          let dateIndex = (i < 0 ? 0 : i) | 0;
          d3.selectAll(".point")
            .transition()
            .duration(100)
            .style("fill", (d, i) => { return d.data[dateIndex].color });
        }

        // Enlarge on mouseover
        function mouseOverPoint() {
          d3.select(d3.event.target)
            .raise()
            .transition()
            .duration(100)
            .attr("r", 12);
        };

        // Return radius on mouseout
        function mouseOutPoint() {
          d3.select(d3.event.target)
            .transition()
            .duration(150)
            .attr("r", 8);
        };

        // draw the points on the map svg
        let drawPoints = function(pointData) {

          // create the canvas
          let pointCanvas = d3.select("#" + el.id)
            .select(".leaflet-pane")
            .select("svg")
            .append("g");

          // Add points
          let points = pointCanvas.selectAll(".point")
            .data(pointData)
            .enter()
              .append("circle")
              .attr("class", "point")
              .attr("cx", d => { return map.latLngToLayerPoint(d.LatLng).x })
              .attr("cy", d => { return map.latLngToLayerPoint(d.LatLng).y })
              .attr("r", 8)
              // init fill color as transparent
              .style("fill", "transparent")
              .attr("stroke", "white")
              .attr("stroke-width", 2)
              .attr("fill-opacity", 0.75)
              .attr("stoke-opacity", 0.75)
              .attr("pointer-events", "visible");

          // Watch points
          points
            .on("mouseover", mouseOverPoint)
            .on("mouseout", mouseOutPoint);

          // init colors on startdate
          updatePointColor(sd);

        };

        // Update the slider handle position
        function updateHandle(x) {
          d3.selectAll(".handle").style("cx", xScale(x) + "px")
          d3.selectAll(".label")
            .attr("x", xScale(x))
            .text(formatDateIntoHr(x))
        };

        // Update the time index of the slider handle and point color
        function timeUpdate(x) {
          updateHandle(x)
          updatePointColor(x);
        };

        function step() {
          timeUpdate(currentDate)
          // Add an hour
          currentDate.setHours(currentDate.getHours() + 1)
          // reset if reach to end
          if ( currentDate > ed ) {
            playing = false
            currentDate = sd
            clearInterval(timer)
            d3.selectAll(".button").text("Play");
          }
        };

        function mouseOverButton() {
          d3.selectAll(".svg-inline--fa")
            .transition()
            .duration(250)
            .style("opacity", 0.75)
          };

        function mouseOutButton() {
          d3.selectAll(".svg-inline--fa")
            .transition()
            .duration(250)
            .style("opacity", 1)
        };

        let drawPlayback = function() {

          // remove old slider/playbutton hack
          d3.selectAll(".slider").remove();

          let playbackWidth = width,
              playbackHeight = height*0.1;

          let xSlider = playbackWidth*0.25,
              ySlider = playbackHeight*0.5;
          let xButton = xSlider - 40,
              yButton = ySlider - 15;

          // create playback svg layer
          let playbackCanvas = d3.select("#" + el.id)
            .select(".leaflet-control-container")
            .select(".leaflet-bottom")
            .append("svg")
            .attr("class", "leaflet-control")
            .attr("width", playbackWidth)
            .attr("height", playbackHeight);

          // create slider container
          let slider = playbackCanvas
            .append("g")
            .attr("class", "slider")
            .attr("transform", `translate(${xSlider}, ${ySlider})`);

          // restrict map mouse events in the slider container
          slider.on('mouseover', function () { map.dragging.disable() })
                .on('mouseout', function () { map.dragging.enable() });

          // Add slider track and drag indexing
          slider.append("line")
            .attr("class", "track")
            .attr("x1", xScale.range()[0])
            .attr("x2", xScale.range()[1])
            .style("stroke", "#000")
            .style("stroke-width", "10px")
            .style("stroke-linecap", "round")
            .style("stroke-opacity", 0.3)
            .select( function() { return this.parentNode.appendChild(this.cloneNode(true)) })
              .attr("class", "track-inset")
              .style("stroke", "#dcdcdc")
              .style("stroke-width", "8px")
              .style("stroke-linecap", "round")
            .select(function() { return this.parentNode.appendChild(this.cloneNode(true)) })
              .attr("class", "track-overlay")
              .style("stroke-width", "50px")
              .style("stroke-linecap", "round")
              .style("stroke", "transparent")
              .call(
                d3.drag()
                .on("start.interrupt",() => { slider.interrupt(); })
                // pass in inverted xscale (i.e. date)
                .on("start drag", () => {
                  currentDate = xScale.invert(d3.event.x);
                  timeUpdate(currentDate)
                })
              );

          // Add the slider track overlay
          let track = slider.insert("g", ".track-overlay")
            .attr("class", "ticks")
            .attr("transform", "translate(0," + 18 + ")")
            .selectAll("text")
              .data(xScale.ticks())
              .enter()
                .append("text")
                .attr("x", xScale)
                .attr("y", 10)
                .attr("text-anchor", "middle")
                .text(function(d) { return formatDateIntoDay(d) });

                  // Create slider handle
        let handle = slider.insert("circle", ".track-overlay")
          .attr("class", "handle")
          .attr("r", 9)
          .style("fill", "#fff")
          .style("stroke", "#000")
          .style("stroke-opacity", 0.5)
          .style("stroke-width", "1.25px")
          .style("cx", 0);

        // Create label
        let label = slider.append("text")
          .attr("class", "label")
          .attr("text-anchor", "middle")
          .text(formatDateIntoHr(sd))
          .attr("transform", "translate(0," + (-25) + ")");

        // Create play button :(
        let playButton = playbackCanvas.append("g")
          .attr("class", "button")
          .append('svg:foreignObject')
          		.attr('height', '40px')
              .attr('width', '40px')
              .html('<i class="fas fa-play"></i>')
              .attr("x", xButton)
              .attr("y", yButton)
              .style("font-size", "1.7em")
              .style("color", "black")

        // watch for click
          playButton.on("click", () => {
            let button = d3.selectAll(".svg-inline--fa")
            if (playing) {
              playing = false;
              clearInterval(timer);
              button.html('<i class="fas fa-play"></i>')
              // timer = 0;
            } else {
              playing = true;
              timer = setInterval(step, 250);
              button.html('<i class="fas fa-pause"></i>')
            }
          });

          playButton
            .on("mouseover", mouseOverButton)
            .on("mouseout", mouseOutButton)

        };

        // Add a svg layer to the map
        L.svg().addTo(map);

        // Draw the points on the map
        drawPoints(pointData);
        drawPlayback();
        // Update point locations on map changes
        map.on("moveend", updatePointLocation);

      },

      resize: function (width, height) {


      }

    };
  }
});
