let ids;
let dd;
let pd;
let mm;
HTMLWidgets.widget({

  name: 'timeseriesMap1',

  type: 'output',

  factory: function(el, width, height) {

    // Create map

    let map = L.map(el.id).setView([35.5, -100.5], 6); // center position + zoom

    // Add a tile to the map = a background. Comes from OpenStreetmap
    L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>',
        maxZoom: 18,
      }).addTo(map)

    // Add a svg layer to the map
    L.svg().addTo(map);

    // Create map canvas for points
    let mapCanvas = d3.select("#" + el.id)
      .select(".leaflet-pane")
      .select("svg")
      .append("g");

    // Create slider canvas for slider & playback
    let playCanvas = d3.select("#" + el.id)
      .select(".leaflet-control-container")
      .select(".leaflet-bottom")
      .append("svg")
      .attr("class", "leaflet-control")
      .attr("width", width)
      .attr("height", height - height*0.75);

    // Create color ramp profile
    let colorMap = d3.scaleThreshold()
      .domain([12, 35, 55, 75, 100])
      // SCAQMD profile
      .range(["#abe3f4", "#118cba", "#286096", "#8659a5", "#6a367a"]);

    let formatDateIntoDay = d3.timeFormat("%b %d");
    let formatDateIntoHr = d3.timeFormat("%b %d %H:00");
    let strictIsoParse = d3.utcParse("%Y-%m-%dT%H:%M:%SZ");

    return {

      renderValue: function(x) {

        // Load the data
        let meta = HTMLWidgets.dataframeToD3(x.meta);
        let data = HTMLWidgets.dataframeToD3(x.data);

        let mx = meta;

        // Add a LatLng object from meta coords
        meta.forEach(d => {
          d.LatLng = new L.LatLng(d.latitude, d.longitude)
        });

        // Create sensorIDs
        let sensorIDs = meta.map(d => {
          return d.monitorID
        });

        // Create indexed point data
        let pointData = sensorIDs.map(id => {
          return {
            id: id,
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

        ids = sensorIDs;
        dd = data;
        mm = meta;

        /* Slider & playback */
        let dateDomain = data.map(d => { return new Date(d.datetime) });
        let sd = dateDomain.slice(1)[0],
            ed = dateDomain.slice(-1)[0]

        let xScale = d3.scaleTime()
          .domain([sd, ed])
          .rangeRound([0, width*0.75])
          .clamp(true);

        let dateScale = d3.scaleTime()
          .domain([sd, ed])
          .rangeRound([0, data.length])
          .clamp(true);

        // Add slider
        let slider = playCanvas.append("g")
          .attr("class", "slider")
          .attr("transform", `translate(100, 80)`);

        slider.on('mouseover', function () {
          map.dragging.disable();
        });

        // Re-enable dragging when user's cursor leaves the element
        slider.on('mouseout', function () {
          map.dragging.enable();
        });

        // Add slider track and drag indexing
        slider.append("line")
          .attr("class", "track")
          .attr("x1", xScale.range()[0])
          .attr("x2", xScale.range()[1])
          .style("stroke", "#000")
          .style("stroke-width", "10px")
          .style("stroke-opacity", 0.3)
          .select( function() { return this.parentNode.appendChild(this.cloneNode(true)) })
            .attr("class", "track-inset")
            .style("stroke", "#dcdcdc")
            .style("stroke-width", "8px")
          .select(function() { return this.parentNode.appendChild(this.cloneNode(true)) })
            .attr("class", "track-overlay")
            .style("stroke-width", "50px")
            .style("stroke", "transparent")
            .call(
              d3.drag()
              .on("start.interrupt",() => { slider.interrupt(); })
              // pass in inverted xscale (i.e. date)
              .on("start drag", () => { update(xScale.invert(d3.event.x)) })
            );

        // Add the slider track overlay
        slider.insert("g", ".track-overlay")
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

        // Update the slider handle position
        let updateHandle = function(x) {
          handle.style("cx", xScale(x) + "px")
          label
            .attr("x", xScale(x))
            .text(formatDateIntoHr(x))
        };

        /* Map */
        // Add points
        let points = mapCanvas.selectAll("points")
          .data(pointData)
          .enter()
            .append("circle")
            .attr("cx", d => { return map.latLngToLayerPoint(d.LatLng).x })
            .attr("cy", d => { return map.latLngToLayerPoint(d.LatLng).y })
            .attr("r", 8)
            // init fill color on startdate
            .style("fill", d => { return d.data[0].color })
            .attr("stroke", "white")
            .attr("stroke-width", 2)
            .attr("fill-opacity", 0.75)
            .attr("stoke-opacity", 0.75)
            .attr("pointer-events", "visible");

        // Update the points position on map move
        let updatePoints = function() {
          points.attr("cx", d => { return map.latLngToLayerPoint(d.LatLng).x })
            .attr("cy", d => { return map.latLngToLayerPoint(d.LatLng).y })
        };

        let updatePointColor = function(x) {
          let roundedDate = new Date(d3.utcFormat("%Y-%m-%dT%H:00:00.%LZ")(x))
          let v = dateScale(roundedDate) - 1
          points
            .transition()
            .duration(100)
            .style("fill", (d, i) => { return d.data[v].color});
        }

        // Enlarge on mouseover
        let mouseOver = function() {
          d3.select(d3.event.target)
            .raise()
            .transition()
            .duration(100)
            .attr("r", 12);
        };

        // Return radius on mouseout
        let mouseOut = function() {
          d3.select(d3.event.target)
            .transition()
            .duration(150)
            .attr("r", 8);
        };

        pd = pointData;

        // Watch points
        points
          .on("mouseover", mouseOver)
          .on("mouseout", mouseOut)

        // Watch map //
        map.on("moveend", updatePoints);
        updatePoints();

        // Time control
        function update(x) {
          updateHandle(x)
          updatePointColor(x);
        };



      },

      resize: function(width, height) {

      }

    };
  }
});
