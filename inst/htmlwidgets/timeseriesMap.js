let selectedMapSensor = null;

HTMLWidgets.widget({

  name: 'timeseriesMap',

  type: 'output',

  factory: function (el, width, height) {

    // Create map
    let map = L.map(el); // center position + zoom

    // Add a tile to the map = a background. Comes from OpenStreetmap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>',
        maxZoom: 18,
      }).addTo(map)


    // Calc the center coords from meta
    function getCenter(X) {

      const meta = HTMLWidgets.dataframeToD3(X.meta);

      let average = (array) => array.reduce((a, b) => a + b) / array.length;

      // Get center cords from meta and set the view to center
      centerLat = average(meta.map(d => { return d.latitude }));
      centerLon = average(meta.map(d => { return d.longitude }));

      return {Lat: centerLat, Lon: centerLon}

    };

    // Prep data function: creates point data for mapping, fill color, etc.
    function prepData(X) {

      // Remap the colors
      const colorMap = function (value) {
        if (value === null) {
          return "#F4F4F4"
        } else {
          return d3.scaleThreshold()
            .domain(X.breaks)
            .range(X.colors)(value);
        }
      };

      // Remap the values
      const valueMap = function (value) {
        if (value === 0) {
          return undefined
        } else {
          return value
        }
      };

      // Convert data to d3 json
      const meta = HTMLWidgets.dataframeToD3(X.meta);
      const data = HTMLWidgets.dataframeToD3(X.data);

      // Useful date domain
      const dateDomain = data.map(d => { return d.datetime });
      const sd = new Date(dateDomain.slice(1)[0]),
            ed = new Date(dateDomain.slice(-1)[0]);


      // Index ID using passed in index string
      const indexIds = meta.map(d => { return d[X.index] });

      // Add a LatLng object for leaflet to the metadata object
      meta.forEach(d => {
        d.LatLng = new L.LatLng(d.latitude, d.longitude)
      });

      const pointData = indexIds.map(id => {
        return {
          id: id,
          label: meta.filter(d => { return d[X.index] == id })[0][X.label],
          LatLng: meta.filter(d => { return d[X.index] == id })[0].LatLng,
          data: data.map(d => {
            return {
              date: new Date(d.datetime),
              value: valueMap(+d[id]),
              color: colorMap(+d[id])
            }
          }),
          domain: {
            sd,
            ed
          }
        }
      });

      return pointData;

    };


    return {
      renderValue: function (x) {

        // Center the map to the point loc average
        const center = getCenter(x);
        map.setView([center.Lat, center.Lon], 6);

        // Prepare the point data
        const data = prepData(x);

        // Add an svg layer to the leaflet pane
        L.svg().addTo(map)

        let svg = d3.select(el)
                    .select(".leaflet-pane")
                    .select(".leaflet-overlay-pane")
                    .select("svg");

        // Draw the points on the leaflet svg layer
        svg
          .selectAll(".point")
          .data(data)
          .enter()
          .append("g")
          .append("circle")
            .attr("class", "point")
            .attr("id", d => { return d.label })
            .attr("cx", d => { return map.latLngToLayerPoint(d.LatLng).x })
            .attr("cy", d => { return map.latLngToLayerPoint(d.LatLng).y })
            .attr("r", 8.5)
            // init fill color as black
            .style("fill", "black")
            .attr("stroke", "white")
            .attr("stroke-width", 2)
            .attr("fill-opacity", 0.75)
            .attr("stoke-opacity", 0.75)
            .attr("pointer-events", "visible");

          // On map move/zoom, update the point location
          map.on("moveend", () => {
            d3.select(el)
              .selectAll(".point")
              .attr("cx", d => { return map.latLngToLayerPoint(d.LatLng).x })
              .attr("cy", d => { return map.latLngToLayerPoint(d.LatLng).y })
          })

          // the x scale of the canvas
          const xScale = d3.scaleTime()
          .domain([data[0].domain.sd, data[0].domain.ed])
          .rangeRound([ width*0.25, width*0.75 ])
          .clamp(true);

          // Draw the startdate fill
          fillPoints(data[0].domain.sd);

          // Hack: create a leaflet control container class element to house the
          // slider in order to avoid weird stuff from using leaflets built-in svg overlary
          let canvas = d3.select(el)
            .select(".leaflet-control-container")
            .select(".leaflet-bottom")
            .append("svg")
            .attr("class", "leaflet-control")
            .attr("width", width)
            .attr("height", height*0.20);

          // Create the slider
          let slider = canvas
            .append("g")
              .attr("class", "slider")
              .attr("transform", `translate(${0}, ${height*0.20/2})`)
              .on('mouseover', function () { map.dragging.disable() })
              .on('mouseout', function () { map.dragging.enable() });

          // Add the base slider track and lock the drag pos to it
          let sliderDate = data[0].domain.sd;
          slider
            .append("line")
            .attr("class", "slider-track")
            .attr("x1", xScale.range()[0])
            .attr("x2", xScale.range()[1])
            .style("stroke", "#000")
            .style("stroke-width", "10px")
            .style("stroke-linecap", "round")
            .style("stroke-opacity", 0.3)
          .select( function() { return this.parentNode.appendChild(this.cloneNode(true)) })
            .attr("class", "slider-track-inset")
            .style("stroke", "#dcdcdc")
            .style("stroke-width", "8px")
            .style("stroke-linecap", "round")
          .select(function() { return this.parentNode.appendChild(this.cloneNode(true)) })
            .attr("class", "slider-track-overlay")
            .style("stroke-width", "50px")
            .style("stroke-linecap", "round")
            .style("stroke", "transparent")
            .call(
              d3.drag()
              .on("start.interrupt",() => { slider.interrupt(); })
              // pass in inverted xscale (i.e. date)
              .on("start drag", () => {
                // by inverting the x pos we get the current date bound to slider
                // xscale(x pos) yields the the x pos bound to the slider
                sliderDate = xScale.invert(d3.event.x);
                slider
                  .select(".slider-track-handle")
                  .style("cx", xScale(sliderDate))
                slider
                  .select(".slider-track-label")
                  .attr("transform", `translate(${xScale(sliderDate)}, ${-25})`)
                  .text(sliderDate)

                // Update the point fills
                fillPoints(sliderDate)

              })
            );

          // Add the slider track text date overlay ticks
          slider
            .insert("g", ".slider-track-overlay")
            .attr("class", "ticks")
            .attr("transform", "translate(0," + 18 + ")")
            .selectAll("text")
              .data(xScale.ticks())
              .enter()
                .append("text")
                .attr("x", xScale)
                .attr("y", 10)
                .attr("text-anchor", "middle")
                .text(function(d) { return d });

          // Add the slider handle
          slider
            .insert("circle", ".slider-track-overlay")
            .attr("class", "slider-track-handle")
            .attr("r", 9)
            .style("fill", "#fff")
            .style("stroke", "#000")
            .style("stroke-opacity", 0.5)
            .style("stroke-width", "1.25px")
            .style("cx", width*0.25);

          slider
            .append("text")
            .attr("class", "slider-track-label")
            .attr("text-anchor", "middle")
            .text(data[0].domain.sd)
            .attr("transform", `translate(${width*0.25}, ${-25})`)


          // Create the play button
          let playing = false;
          canvas
            .append("g")
            .attr("class", "playback-button")
            // bootstrap icons
            .html(`<svg width=${50}px height=${50}px viewBox="0 0 16 16" class="bi bi-play-fill" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M11.596 8.697l-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393z"/></svg>`)
            .attr("transform", `translate(${width*0.25 - 50 - 5}, ${height*0.20/2 - 25})`)
            .style("color", "#282b3")
            .on("click", () => {
              if ( playing ) {
                playing = false;
                pause()
                // Play button while paused
                d3.select(".playback-button")
                .html(`<svg width=${50}px height=${50}px viewBox="0 0 16 16" class="bi bi-play-fill" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M11.596 8.697l-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393z"/></svg>`)

              } else {
                playing = true;
                play()
                // Pause button while playing
                d3.select(".playback-button")
                  .html(`<svg width=${50}px height=${50}px viewBox="0 0 16 16" class="bi bi-pause-fill" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M5.5 3.5A1.5 1.5 0 0 1 7 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5zm5 0A1.5 1.5 0 0 1 12 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5z"/></svg>`)
              }
            })
            .on("mouseover", () => {
              d3.select(".playback-button")
                .transition()
                .duration(250)
                .style("opacity", 0.7)
                .style("cursor", "pointer");
            })
            .on("mouseout", () => {
              d3.select(".playback-button")
                .transition()
              .duration(250)
              .style("opacity", 1)
            });

            // Pause
            function pause() {

              clearInterval(timer)

            };

            // Play
            function play() {
              function step() {
                // Add an hour while playing
                sliderDate.setHours(sliderDate.getHours() + 1)
                // Update the handle position
                slider
                  .select(".slider-track-handle")
                  .style("cx", xScale(sliderDate));
                slider
                  .select(".slider-track-label")
                  .attr("transform", `translate(${xScale(sliderDate)}, ${-25})`)
                  .text(sliderDate)
                fillPoints(sliderDate);
              };

              timer = setInterval(step, 250);

            };

          // Map date to fill color
          function fillPoints(date) {

            function roundDate(date) {
              date.setMinutes(date.getMinutes() + 30);
              date.setMinutes(0);
              return date;
            };

            let pos = xScale(roundDate(date))
            let dateIndex = (pos < 0 ? 0 : pos) | 0;
            d3.selectAll(".point").style("fill", (d, i) => {
              if ( typeof d.data[dateIndex] !== 'undefined' ) {
                return d.data[dateIndex].color
              }
            })

          };

        },

      resize: function (width, height) {


      }

    };
  }
});
