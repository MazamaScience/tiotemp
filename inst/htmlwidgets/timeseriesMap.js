HTMLWidgets.widget({

  name: 'timeseriesMap',

  type: 'output',

  factory: function (el, width, height) {

    // TODO: define shared variables for this instance

    let map = L
      .map(el.id)
      .setView([35.5, -100.5], 6); // center position + zoom

    // Add a tile to the map = a background. Comes from OpenStreetmap
    L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>',
        maxZoom: 18,
      }).addTo(map)

    // Add a svg layer to the map
    L.svg().addTo(map);

    // We pick up the SVG from the map object
    let svgMap = d3.select("#" + el.id)
      .select(".leaflet-pane")
      .select("svg")
      .append("g");

    // Playback control layer
    let svgPlayback = d3.select("#" + el.id)
      .select(".leaflet-control-container")
      .select(".leaflet-bottom")
      .append("div")
      .attr("class", "leaflet-control");

    // Store mouseover focus data
    let focusColor;

    // color ramp map
    let col = d3.scaleThreshold()
      .domain([12, 35, 55, 75, 100])
      // SCAQMD profile
      .range(["#abe3f4", "#118cba", "#286096", "#8659a5", "#6a367a"]);


    const parseDate = d3.timeParse("%Y-%m-%dT%H:%M:%SZ");
    // Bisect date long to left side of hour
    const bisect = d3.bisector(d => {
      return d.date
    }).left;

    //const sensorIDs;


    return {
      renderValue: function (x) {


let focusData;
let sensorIDs;
let focusDate;
let focusColor;
let focusCoords;

let meta;
let data;

        meta = HTMLWidgets.dataframeToD3(x.meta);
        data = HTMLWidgets.dataframeToD3(x.data);


        // Add a LatLng object from meta coords
        meta.forEach(d => {
          d.LatLng = new L.LatLng(d.latitude, d.longitude)
        });

        let mouseIn = function (d) {
          d3.select(d3.event.target)
            .raise()
            .transition()
            .duration(100)
            .attr("r", 12);
        }

        let mouseOut = function (d) {
          d3.select(d3.event.target)
            .transition()
            .duration(150)
            .attr("r", 8);
        }

        let feature = svgMap.selectAll("mycircle")
          .data(meta)
          .enter()
          .append("circle")
          .attr("cx", d => {
            map.latLngToLayerPoint(d.LatLng).x
          })
          .attr("cy", d => {
            map.latLngToLayerPoint(d.LatLng).y
          })
          .attr("r", 8)
          .style("fill", "red")
          .attr("stroke", "white")
          .attr("stroke-width", 2)
          .attr("fill-opacity", 0.75)
          .attr("stoke-opacity", 0.75)
          .on("mouseover", mouseIn)
          .on("mouseout", mouseOut)
          .attr("pointer-events", "visible");
        //.on("click", onMarkerClick)

        // Function that update circle position if something change
        function updateMap() {
          //g.selectAll("circle")
          feature
            .attr("cx", function (d) {
              return map.latLngToLayerPoint(d.LatLng).x
            })
            .attr("cy", function (d) {
              return map.latLngToLayerPoint(d.LatLng).y
            })
        }

        map.on("moveend", updateMap);

        updateMap();

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



        const dateDomain = data.map(d=> {return d.datetime });
        let i = 0;
        focusDate = dateDomain[i]


        function mapColors(x0) {

          // Map the color to each timestep on cursor
          focusColor = focusData.map(d => {
            return {
              id: d.id,
              date: d.data[i].date,
              color: d.data[i].color
            }
          });

        };

        // create x scale
        const xScale = d3.scaleUtc().range([0, width]);
        xScale.domain(d3.extent(data, function (d) {
          return parseDate(d.datetime)
        }));


        function updateColor() {
          feature
            .transition()
            .duration(75)
            .style("fill", (d, i) => {
              return focusColor[i].color
            })
        }

        function updateDateView() {
          dateView.text(dateDomain[i])
        }


        let playButton = svgPlayback.append("button") // Append a text element
          .attr("id", "play") // Give it the font-awesome class
          .style("transform", "translate(50px,-100px)")
          .style("font-size", "2em")
          .style("color", "red")
          .text("Play")
          .attr("pointer-events", "visible");

        let dateView = svgPlayback.append("text")
          .attr("id", "date") // Give it the font-awesome class
          .style("transform", "translate(50px,-10px)")
          .style("font-size", "2em")
          .style("color", "black")
          .text(dateDomain[i])
          .attr("pointer-events", "visible");


        let playing = false;

        let play = function () {
          let x0 = i
          console.log(i)
          mapColors(i)
          updateColor()
          let button = d3.select(this)
          console.log(button.text())
          if (button.text() == "Pause") {
            playing = false;
            clearInterval(timer);
            playButton.text("Play");
          } else {
            playing = true;
            timer = setInterval(step, 250);
            button.text("Pause");
          }
        }

        function step() {
          mapColors(i)
          updateColor()
          updateDateView()
          console.log(dateDomain[i])
          i++;
          if (i >= data.length ) {
            playing = false;
            i = 0;
            clearInterval(timer);
            // timer = 0;
            playButton.text("Play");
          }
        }

        playButton.on("click", play);


      }, // End render

      resize: function (width, height) {


      }

    };
  }
});
