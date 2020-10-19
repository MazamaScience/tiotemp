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
    }).addTo(map);

    return {
      renderValue: function (x) {

        d3.select(el).selectAll("#control-playback").remove();
        d3.select(el).selectAll(".point-map").remove();

        /* Create the map features */

        // Center the map to the point loc average
        const center = getCenter(x);
        map.setView([center.Lat, center.Lon], 6);

        // Prepare the point data
        const data = prepData(x);

        let tooltip = d3.select(".tooltip-map");
        if (tooltip.empty()) {
          tooltip = d3.select("body")
            .append("div")
            .style("visibility", "hidden")
            .attr("class", "tooltip-map")
            .style("background-color", "#282b30")
            .style("border", "solid")
            .style("border-color", "#282b30")
            .style("border-width", "2px")
            .style("border-radius", "5px")
            .style("width", width / 12)
            .style("color", "#F4F4F4")
            .style("position", "absolute")
            .style("z-index", 666);
        }

        // Add an svg layer to the leaflet pane
        L.svg().addTo(map);

        let svg = d3.select(el)
          .select(".leaflet-pane")
          .select(".leaflet-overlay-pane")
          .select("svg");

        // Draw the points on the leaflet svg layer
        svg
          .selectAll(".point-map")
          .data(data)
          .enter()
          .append("circle")
          .attr("class", "point-map")
          .attr("id", d => {
            return d.label;
          })
          .attr("cx", d => {
            return map.latLngToLayerPoint(d.LatLng).x;
          })
          .attr("cy", d => {
            return map.latLngToLayerPoint(d.LatLng).y;
          })
          .attr("r", 8.5)
          // init fill color as black
          .style("fill", "black")
          .attr("stroke", "white")
          .attr("stroke-width", 2)
          .attr("fill-opacity", 0.75)
          .attr("stoke-opacity", 0.75)
          .attr("pointer-events", "visible");

        // Point mouseover/out/click handling
        // NOTE: ES6 arrow functions are inconsistent - use standard syntax
        svg
          .selectAll(".point-map")
          // Point mouse over
          .on("mouseover", function (d) {

            tooltip
              .style("visibility", "visible")
              .style('left', `${event.pageX + 10}px`)
              .style('top', `${event.pageY + 10}px`)
              .text(d.label)
              .style("text-anchor", "middle")
              .style("font-family", "sans-serif")
              .style("font-size", "0.7em");

            d3.select(this)
              .transition()
              .duration(50)
              .attr("r", 10.5)
              .style("cursor", "pointer");
          })
          // Point mouse out
          .on("mouseout", function (d) {

            tooltip
              .style("visibility", "hidden")
              .text(""); // Erase the text on mouse out

            d3.select(this)
              .transition()
              .duration(150)
              .attr("r", 8.5);

          })
          // Point mouse click!
          .on("click", function (d) {

            svg
              .selectAll(".point-map")
              .style("stroke", "white")
              .attr("stroke-width", 2)
              .attr("fill-opacity", 0.75)
              .style("stoke-opacity", 0.75);

            d3.select(this)
              .raise()
              .transition()
              .duration(50)
              .attr("stroke-width", 3)
              .attr("fill-opacity", 1)
              .style("stroke-opacity", 0.75)
              .style("stroke", "#282b30");


            // If the shiny input id is provided, update the input
            if (x.inputId !== null) {
              Shiny.setInputValue(x.inputId, d.label);
              $(`select#${x.inputId}`)[0].selectize.setValue(d.label, false)
            }

          });

        // On map move/zoom, update the point location
        map
          .on("moveend", () => {
            d3.select(el)
              .selectAll(".point-map")
              .attr("cx", d => {
                return map.latLngToLayerPoint(d.LatLng).x;
              })
              .attr("cy", d => {
                return map.latLngToLayerPoint(d.LatLng).y;
              });
          });

        // Create two scales; the x scale of the canvas itself,
        // and the x date scale of the data for mapping datetimes to index
        const xScale = d3.scaleTime()
          .domain([data[0].domain.sd, data[0].domain.ed])
          .rangeRound([width * 0.25, width * 0.75])
          .clamp(true),
          dateScale = d3.scaleTime()
          .domain([data[0].domain.sd, data[0].domain.ed])
          .rangeRound([0, data[0].data.length - 1])
          .clamp(true);

        // Draw the startdate fill
        fillPoints(data[0].domain.sd);

        // Hack: create a leaflet control container class element to house the
        // slider in order to avoid weird stuff from using leaflets built-in svg overlary
        let view = document.querySelector("div#" + el.id).getBoundingClientRect();

        let canvasHeight = "100";//view.height * 0.10;

        let canvas = d3.select(el)
          .select(".leaflet-control-container")
          .select(".leaflet-bottom")
          .append("svg")
          .attr("class", "leaflet-control")
          .attr("id", "control-playback")
          .attr("width", width)
          .attr("height", canvasHeight);

        // Create the slider
        let slider = canvas
          .append("g")
          .attr("class", "slider")
          .attr("transform", `translate(${0}, ${canvasHeight/2})`)
          .on('mouseover', function () {
            map.dragging.disable();
          })
          .on('mouseout', function () {
            map.dragging.enable();
          });

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
          .select(function () {
            return this.parentNode.appendChild(this.cloneNode(true));
          })
          .attr("class", "slider-track-inset")
          .style("stroke", "#dcdcdc")
          .style("stroke-width", "8px")
          .style("stroke-linecap", "round")
          .select(function () {
            return this.parentNode.appendChild(this.cloneNode(true));
          })
          .attr("class", "slider-track-overlay")
          .style("stroke-width", "50px")
          .style("stroke-linecap", "round")
          .style("stroke", "transparent")
          .call(
            d3.drag()
            .on("start.interrupt", () => {
              slider.interrupt();
            })
            // pass in inverted xscale (i.e. date)
            .on("start drag", () => {
              // by inverting the x pos we get the current date bound to slider
              // xscale(x pos) yields the the x pos bound to the slider
              sliderDate = xScale.invert(d3.event.x);
              d3.select(el)
                .select(".slider-track-handle")
                .attr("cx", xScale(sliderDate));
              d3.select(el)
                .select(".slider-track-label")
                .attr("transform", `translate(${xScale(sliderDate)}, ${-25})`)
                .text(d3.timeFormat("%B %d %H:%M")(sliderDate));

              // Update the point fills
              fillPoints(sliderDate);

            })
          );


        let ticks,
          tickFormat,
          rotate;
        let days = data[0].data.length / 24;
        if (days > 2) {
          if (days >= 14) {
            ticks = xScale.ticks(7);
          } else {
            ticks = xScale.ticks(days);
          }
          tickFormat = d3.timeFormat("%b %d");
        } else {
          ticks = xScale.ticks();
          tickFormat = d3.timeFormat("%H:00");
        }

        // Add the slider track text date overlay ticks
        slider
          .insert("g", ".slider-track-overlay")
          .attr("class", "ticks")
          .attr("transform", "translate(0," + 18 + ")")
          .selectAll("text")
          .data(ticks)
          .enter()
          .append("text")
          .attr("x", xScale)
          .attr("y", 10)
          .attr("text-anchor", "middle")
          .text(function(d) {
            return tickFormat(d);
          });

        // Add the slider handle
        slider
          .insert("circle", ".slider-track-overlay")
          .attr("class", "slider-track-handle")
          .attr("r", 9)
          .style("fill", "#fff")
          .style("stroke", "#000")
          .style("stroke-opacity", 0.5)
          .style("stroke-width", "1.25px")
          .attr("cx", width * 0.25);

        slider
          .append("text")
          .attr("class", "slider-track-label")
          .attr("text-anchor", "middle")
          .text(d3.timeFormat("%B %d %H:%M")(data[0].domain.sd))
          .attr("transform", `translate(${width*0.25}, ${-25})`);


        // Create the play button
        let playing = false;
        canvas
          .append("g")
          .attr("class", "playback-button")
          // bootstrap icons
          .html(`<svg width=${50}px height=${50}px viewBox="0 0 16 16" class="bi bi-play-fill" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M11.596 8.697l-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393z"/></svg>`)
          .attr("transform", `translate(${width*0.25 - 50 - 10}, ${canvasHeight/2 - 25})`)
          .style("color", "#282b3")
          .on("click", () => {
            if (playing) {
              playing = false;
              pause();
            } else {
              playing = true;
              play();
            }
          })
          .on("mouseover", () => {
            d3.select(el)
              .select(".playback-button")
              .transition()
              .duration(250)
              .style("opacity", 0.7)
              .style("cursor", "pointer");
          })
          .on("mouseout", () => {
            d3.select(el)
              .select(".playback-button")
              .transition()
              .duration(250)
              .style("opacity", 1);
          });


        /* Helper Functions */

        // Calc the center coords from meta
        function getCenter(X) {

          const meta = HTMLWidgets.dataframeToD3(X.meta);

          let average = (array) => array.reduce((a, b) => a + b) / array.length;

          // Get center cords from meta and set the view to center
          centerLat = average(meta.map(d => {
            return d.latitude;
          }));
          centerLon = average(meta.map(d => {
            return d.longitude;
          }));

          return {
            Lat: centerLat,
            Lon: centerLon
          };

        }

        // Prep data function: creates point data for mapping, fill color, etc.
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

          // Convert data to d3 json
          const meta = HTMLWidgets.dataframeToD3(X.meta);
          const data = HTMLWidgets.dataframeToD3(X.data);

          // Useful date domain
          const dateDomain = data.map(d => {
            return d.datetime;
          });
          const sd = new Date(dateDomain[0]),
                ed = new Date(dateDomain.slice(-1)[0]);


          // Index ID using passed in index string
          const indexIds = meta.map(d => {
            return d[X.index];
          });

          // Add a LatLng object for leaflet to the metadata object
          meta.forEach(d => {
            d.LatLng = new L.LatLng(d.latitude, d.longitude);
          });

          // Fancy data mapping
          const pointData = indexIds.map(id => {
            return {
              id: id,
              label: meta.filter(d => {
                return d[X.index] == id;
              })[0][X.label],
              LatLng: meta.filter(d => {
                return d[X.index] == id;
              })[0].LatLng,
              data: data.map(d => {
                return {
                  date: new Date(d.datetime),
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

          return pointData;

        }

        // Pause
        function pause() {

          // Play button while paused
          d3.select(el)
            .select(".playback-button")
            .html(`<svg width=${50}px height=${50}px viewBox="0 0 16 16" class="bi bi-play-fill" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M11.596 8.697l-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393z"/></svg>`);

          clearInterval(timer);
        }

        // Play
        function play() {

          // Pause button while playing
          d3.select(el)
            .select(".playback-button")
            .html(`<svg width=${50}px height=${50}px viewBox="0 0 16 16" class="bi bi-pause-fill" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M5.5 3.5A1.5 1.5 0 0 1 7 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5zm5 0A1.5 1.5 0 0 1 12 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5z"/></svg>`);

          // Step function
          function step() {

            // Add an hour while playing
            sliderDate.setHours(sliderDate.getHours() + 1)
            // reset date if at end
            if (sliderDate > data[0].domain.ed) {
              sliderDate = data[0].domain.sd;
              pause();
              playing = false;
            }
            // Update the handle position
            slider
              .select(".slider-track-handle")
              .attr("cx", xScale(sliderDate));
            // update slider handle label
            slider
              .select(".slider-track-label")
              .attr("transform", `translate(${xScale(sliderDate)}, ${-25})`)
              .text(d3.timeFormat("%B %d %H:%M")(sliderDate));

            fillPoints(sliderDate);

          };

          // Set timer interval to step ^ every 250 ms
          timer = setInterval(step, x.step);

        };

        // Map date to fill color
        function fillPoints(date) {

          // Round the date to nearest hour
          function roundDate(date) {
            date.setMinutes(date.getMinutes() + 30);
            date.setMinutes(0);
            date.setSeconds(0);
            return date;
          };

          let pos = dateScale(roundDate(date))
          d3.select(el)
            .selectAll(".point-map")
            .transition()
            .duration(25)
            .style("fill", (d, i) => {
              if (d.data[pos] !== undefined) {
                if (d.data[pos].value !== undefined) {
                  return d.data[pos].color
                } else {
                  // move greys to back
                  d3.select(el)
                    .selectAll(`[id='${d.label}']`)
                    .lower();
                  return "#9a9a9a"; // grey if no value for time
                }
              }
            });
        };


        // Allow shiny updating
        if (x.inputId !== null) {
          $("#" + x.inputId)
            .on("change", function (d) {
              /*console.log(d)
              d3.selectAll("circle#" + this.value)
                .dispatch("click");*/
              svg
                .selectAll(".point-map")
                .style("stroke", "white")
                .attr("stroke-width", 2)
                .attr("fill-opacity", 0.75)
                .style("stoke-opacity", 0.75);

              d3.selectAll("circle#" + this.value)
                .raise()
                .transition()
                .duration(50)
                .attr("stroke-width", 3)
                .attr("fill-opacity", 1)
                .style("stroke-opacity", 0.75)
                .style("stroke", "#282b30");

                let pointLatLng =  d3.selectAll("circle#" + this.value).data()[0].LatLng;

                map.panTo(pointLatLng)

              });


        }


      },

      resize: function (width, height) {


      }

    };
  }
});
.5
