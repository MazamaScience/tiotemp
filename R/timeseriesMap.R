#' @title Timeseries Leaflet Map
#'
#' @description Creates a timeseries leaflet map that displays point location
#' time series data and allows playback with a slider and "Play" button.
#'
#' @param data Dataframe that contains point location time series data. See Details.
#' @param meta Dataframe that contains the point location metadata. See Details.
#' @param index Column name in \code{meta} containing the unique identifier for
#' each location.
#' @param label Column name in \code{meta} containing the human readable label
#' associated with each location. This is displayed when mousing over a location.
#' @param ... Additional arguments. See details.
#'
#' @details
#' Use of this function requires \code{data} and \code{meta} dataframes that
#' are linked by location-specific unique identifiers. In \code{meta}, each row
#' contains location metadata associated with a unique timeseries. The unique
#' identifiers for are found in \code{meta[[index]]}. The \code{data} dataframe
#' uses these identifiers as column names with a separate column of data for
#' each timeseries.
#'
#' \code{data} must be a dataframe of regular time series data.
#' The \code{data} dataframe _must_ contain one 'datetime' column. All other
#' columns must have the names specified in \code{meta[[index]]}.
#'
#' \code{meta} must be a dataframe that contains location information associated
#' with the timeseries found in \code{data}. The \code{meta} dataframe _must_
#' contain a column with the name specified with \code{index} and another with
#' the column name specified with \code{label}.
#'
#' \code{...} Additional (optional) configuration arguments:
#'
#' \itemize{
#' \item{\code{width} -- widget width}
#' \item{\code{height} -- widget_height}
#' \item{\code{colors} -- colors}
#' \item{\code{breaks} -- color ramp breaks}
#' \item{\code{elementId} -- HTML element ID}
#' \item{\code{inputId} -- shiny input ID}
#' }
#'
#' @note When specifying \code{colors} and \code{breaks}, you must use the
#' \pkg{d3} idiom where the vector of colors is one longer than the vector of
#' breaks. Everything below the lowest break gets the lowest color. Everything
#' above the highest break gets the highest color.
#'
#' @examples
#' library(tiotemp)
#'
#' # Example using PWFSLSmoke 'ws_monitor' object
#'
#' sensor <- example_pwfslsmoke_object
#'
#' timeseriesMap(
#'   data = sensor$data,
#'   meta = sensor$meta,
#'   index = "monitorID",
#'   label = "siteName",
#'   colors = c("#00E400","#FFFF00","#FF7E00","#FF0000","#8F3F97","#7E0023"),
#'   breaks = c(12.0, 35.5,  55.5, 150.5, 250.5)
#' )
#'
#' # Example using AirSensor 'airsensor' object
#'
#' sensor <- example_airsensor_object
#'
#' timeseriesMap(
#'   data = sensor$data,
#'   meta = sensor$meta,
#'   index = "deviceDeploymentID",
#'   label = "label"
#' )
#'
#' @import htmlwidgets
#'
#' @export
timeseriesMap <- function(
  data,
  meta,
  index = "monitorID",
  label = "label",
  ...
) {

  # ----- Validate parameters --------------------------------------------------

  MazamaCoreUtils::stopIfNull(index)
  MazamaCoreUtils::stopIfNull(label)

  # ----- Widget defaults ------------------------------------------------------

  # TODO:  To be used in d3.scaleThreshold(), there should be one fewer breaks
  # TODO:  than colors. Here is the code form timeseriesMap.js:
  # TODO:
  # TODO:  // Create color ramp profile using options
  # TODO:  let colorMap = d3.scaleThreshold()
  # TODO:  .domain(x.breaks)
  # TODO:  .range(x.colors);

  default_colors <- c("#abe3f4", "#118cba", "#286096", "#8659a5", "#6a367a")
  default_breaks <- c(12, 35, 55, 75, 100)
  default_step <- 200 #ms

  # Store extra args
  args <- list( ... )

  # Set default colors
  if ( !"colors" %in% names(args) ) {
    args$colors <- default_colors
  }
  if ( !"breaks" %in% names(args) ) {
    args$breaks <- default_breaks
  }
  if ( !"step" %in% names(args) ) {
    args$step <- default_step
  }

  # Available config arguments
  config = list(
    width = args$width, # width
    height = args$height, # height
    breaks = args$breaks, # color ramp breaks
    colors = args$colors, # colors
    elementId = args$elementId, # html element ID
    inputId = args$inputId, # Shiny input id
    step = args$step # Step interval
  )

  # Create data list
  dataList <- list(
    data = data,
    meta = meta,
    index = index,
    label = label
  )

  # Create data object for forwarding to javascript
  x <- append(dataList, config)

  # ----- Create widget --------------------------------------------------------

  # Create widget
  widget <- htmlwidgets::createWidget(
    name = 'timeseriesMap',
    x = x,
    width = config$width,
    height = config$height,
    package = 'tiotemp',
    elementId = args$elementId,
    sizingPolicy = htmlwidgets::sizingPolicy(
      defaultWidth = 800,
      defaultHeight = 500,
      viewer.padding = 0,
      browser.fill = TRUE
    )
  )

  return(widget)

}

#' @title Shiny bindings for timeseriesMap
#'
#' @description Output and render functions for using timeseriesMap within Shiny
#' applications and interactive Rmd documents.
#'
#' @param outputId output variable to read from
#' @param width,height Must be a valid CSS unit (like \code{'100\%'},
#'   \code{'400px'}, \code{'auto'}) or a number, which will be coerced to a
#'   string and have \code{'px'} appended.
#' @param expr An expression that generates a timeseriesMap
#' @param env The environment in which to evaluate \code{expr}.
#' @param quoted Is \code{expr} a quoted expression (with \code{quote()})? This
#'   is useful if you want to save an expression in a variable.
#'
#' @name timeseriesMap-shiny
#'
#' @export
timeseriesMapOutput <- function(
  outputId,
  width = '100%',
  height = '400px'
) {
  htmlwidgets::shinyWidgetOutput(
    outputId,
    'timeseriesMap',
    width,
    height,
    package = 'tiotemp'
  )
}

#' @rdname timeseriesMap-shiny
#' @export
renderTimeseriesMap <- function(
  expr,
  env = parent.frame(),
  quoted = FALSE
) {
  if (!quoted) { expr <- substitute(expr) } # force quoted
  htmlwidgets::shinyRenderWidget(
    expr,
    timeseriesMapOutput,
    env,
    quoted = TRUE
  )
}
