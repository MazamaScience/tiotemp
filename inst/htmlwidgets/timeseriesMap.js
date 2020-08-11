let selectedMapSensor = null;

HTMLWidgets.widget({

  name: 'timeseriesMap',

  type: 'output',

  factory: function (el, width, height) {

    /*
    Helpers
    */

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

        // Create color ramp profile using options
        let colorMap = d3.scaleThreshold()
          .domain(x.breaks)
          .range(x.colors);

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

        // Index ID using passed in index string
        let indexIds = meta.map(d => { return d[x.index] });

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

        let playing = false;

        // Create point location data object from each sensor label
        // contains leaflet latlng obj, hourly data, and mapped point color
        let pointData = indexIds.map(id => {
          return {
            id: id,
            label: meta.filter(d => { return d[x.index] == id })[0][x.label],
            community: meta.filter(d => { return d[x.index] == id })[0].community,
            LatLng: meta.filter(d => { return d[x.index] == id })[0].LatLng,
            data: data.map(d => {
              return {
                date: new Date(d.datetime),
                value: +d[id],
                color: colorMap(+d[id])
              }
            })
          }
        });

        // hightlight selected point
        let selectPoint = function(d) {
          restorePoints();
          d3.select("#" + el.id).selectAll(`[point-label=${d}]`)
            .raise()
            .transition()
            .duration(200)
            .attr("stroke-width", 3)
            .attr("fill-opacity", 1)
            .style("stroke-opacity", 0.75)
            .style("stroke", "#282b30");
        };

        // Watch for playback
        let play = function() {
            let button = d3.select("#" + el.id).selectAll(".playback-button").selectAll(".svg-inline--fa")
            if (playing) {
              playing = false;
              clearInterval(timer);
              button.html('<i class="fas fa-play"></i>');
            } else {
              button.html('<i class="fas fa-pause"></i>');
              playing = true;
              timer = setInterval(step, 250);
            }
        };

        // Watch the input id to update map point selection from
        if ( x.inputId != null ) {
          $("#" + x.inputId).on("change", function() {
            selectPoint(this.value)
          });
        };

                      // create a tooltip
        let tooltip =   d3.select("#" + el.id)
          .select(".leaflet-pane")
          .append("svg")
          .style("opacity", 0)
          .attr("class", "tooltip")
          .style("background-color", "#282b30")
          .style("border", "solid")
          .style("border-color", "#282b30")
          .style("border-width", "2px")
          .style("border-radius", "5px")
          .style("padding", "5px")
          .style("z-index", 666)

        // Update the points position on map move
        function updatePointLocation() {
          d3.select("#" + el.id).selectAll(".point")
            .attr("cx", d => { return map.latLngToLayerPoint(d.LatLng).x })
            .attr("cy", d => { return map.latLngToLayerPoint(d.LatLng).y })
        };

        // Update the point color with timestamp x
        function updatePointFill(x) {
          let roundedDate = new Date(d3.utcFormat("%Y-%m-%dT%H:00:00.%LZ")(x))
          let i = dateScale(roundedDate);
          let dateIndex = (i < 0 ? 0 : i) | 0;
          d3.select("#" + el.id).selectAll(".point")
            .transition()
            .duration(100)
            .style("fill", (d, i) => {
              if ( typeof d.data[dateIndex] !== 'undefined' ) {
                return d.data[dateIndex].color
              }

            })
          };

        // restore all the colors after selection
        function restorePoints() {
          d3.select("#" + el.id).selectAll(".point")
            .transition()
            .duration(200)
            .style("stroke", "white")
            .attr("fill-opacity", 0.75)
            .attr("stroke-width", 2);
        };

        // Enlarge on mouseover
        function mouseOverPoint(d) {
          tooltip.selectAll("text").remove()
          d3.select(this)
            .transition()
            .duration(100)
            .attr("r", 10.5)
            .style("cursor", "pointer");
          tooltip
            .style("width", d.label.length * 8 + "px")
            .style("height", "2em")
            .transition()
            .duration(130)
            .style("opacity", 0.75)
            .style("left", `${d3.mouse(this)[0] - 35}px`)
            .style("top", `${d3.mouse(this)[1] - 48}px`)
          tooltip
            .append("text")
            .text(d.label)
            .style("fill", "white")
            .style("font-size", "1em")
            .attr("x", "0em")
            .attr("y", "1em")
        };

        // Return radius on mouseout
        function mouseOutPoint() {
          tooltip.transition().duration(150).style("opacity", 0)
          d3.select(this)
            .transition()
            .duration(150)
            .attr("r", 8.5)
            //.style("stroke", "white");
        };

        function mouseClickPoint() {
          // Better way to access this data??
          selectedMapSensor = d3.select(this)._groups[0][0].__data__[x.label];
          selectPoint(selectedMapSensor);

          // If the shiny input id is provided, update the input
          if(x.inputId != null) {
            console.log("Trying to update: ", x.inputId)
            Shiny.setInputValue(x.inputId, selectedMapSensor);
          }

        };

        // draw the points on the map svg
        let drawPoints = async function(pointData) {

          d3.select("#" + el.id).selectAll(".point").remove();

          // create the canvas
          let pointCanvas = await d3.select("#" + el.id)
            .select(".leaflet-pane")
            .select("svg")
            .append("g");

          // Add points
          let points = await pointCanvas.selectAll(".point")
            .data(pointData)
            .enter()
              .append("circle")
              .attr("class", "point")
              .attr("point-label", d => { return d.label })
              .attr("cx", d => { return map.latLngToLayerPoint(d.LatLng).x })
              .attr("cy", d => { return map.latLngToLayerPoint(d.LatLng).y })
              .attr("r", 8.5)
              // init fill color as transparent
              .style("fill", "transparent")
              .attr("stroke", "white")
              .attr("stroke-width", 2)
              .attr("fill-opacity", 0.75)
              .attr("stoke-opacity", 0.75)
              .attr("pointer-events", "visible");

          //points.call(tip)

          // Watch points
          points
            .on("mouseover", mouseOverPoint)
            .on("mouseout", mouseOutPoint)
            .on("click", mouseClickPoint);

          // init colors on startdate
          updatePointFill(sd);

        };

        // Update the slider handle position
        function updateHandle(x) {
          d3.select("#" + el.id).selectAll(".handle").style("cx", xScale(x) + "px")
          d3.select("#" + el.id).selectAll(".slider-label")
            .attr("x", xScale(x))
            .text(formatDateIntoHr(x))
        };

        // Update the time index of the slider handle and point color
        function timeUpdate(x) {
          updateHandle(x)
          updatePointFill(x);
        };

        function step() {
          timeUpdate(currentDate)
          // Add an hour
          currentDate.setHours(currentDate.getHours() + 1)
          // reset if reach to end
          if ( currentDate > ed ) {
            currentDate = sd
            clearInterval(timer)
            playing = false
            play()
          }
        };

        function mouseOverButton() {
          d3.select("#" + el.id).selectAll(".svg-inline--fa")
            .transition()
            .duration(250)
            .style("opacity", 0.75)
            .style("cursor", "pointer");
          };

        function mouseOutButton() {
          d3.select("#" + el.id).selectAll(".svg-inline--fa")
            .transition()
            .duration(250)
            .style("opacity", 1)
        };

        let drawPlayback = function() {

          // remove old slider/playbutton hack
          d3.select("#" + el.id).selectAll(".slider").remove();
          d3.select("#" + el.id).selectAll(".playback-button").remove();

          let playbackWidth = width,
              playbackHeight = height*0.18;

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
            .attr("height", playbackHeight)
            //.style("margin-bottom", "3em");

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
          // Get # of date ticks for slider based on date length
          let nTicks;
          if ( dateDomain.length/24 > 29 ) {
            nTicks = 7;
          } else if ( dateDomain.length/24 > 16 ) {
            nTicks = 4;
          } else {
            nTicks = 1;
          }
          // Add the slider track overlay
          let track = slider.insert("g", ".track-overlay")
            .attr("class", "ticks")
            .attr("transform", "translate(0," + 18 + ")")
            .selectAll("text")
              .data(xScale.ticks(nTicks))
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
        let sliderLabel = slider.append("text")
          .attr("class", "slider-label")
          .attr("text-anchor", "middle")
          .text(formatDateIntoHr(sd))
          .attr("transform", "translate(0," + (-25) + ")");

        // Create play button :(
        let playButton = playbackCanvas.append("g")
          .attr("class", "playback-button")
          .append('svg:foreignObject')
          		.attr('height', '40px')
              .attr('width', '40px')
              .html('<i class="fas fa-play"></i>')
              .attr("x", xButton)
              .attr("y", yButton)
              .style("font-size", "1.7em")
              .style("color", "#282b3")

        // watch for click
          playButton.on("click", play)
            .on("mouseover", mouseOverButton)
            .on("mouseout", mouseOutButton)

        };

        // Add a svg layer to the map
        L.svg().addTo(map);

        // Draw the points on the map
        let points = drawPoints(pointData);
        let playback = drawPlayback();
        // Update point locations on map changes
        map.on("moveend", updatePointLocation);

      },

      resize: function (width, height) {


      }

    };
  }
});
