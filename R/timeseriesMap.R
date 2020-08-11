#' @title Timeseries Leaflet Map
#'
#' @description A timeseries leaflet map that displays point location timeseries data and
#' allows playback.
#'
#' @param data A data.frame that contains the hourly-resolution point location
#' timeseries data. See Details.
#' @param meta A data.frame that contains the point location metadata. See Details.
#' @param index A string to index point location metadata and temporal data by.
#' @param label A string to index point location metadata label by.
#' @param ... Additional arguments. See details.
#'
#' @details
#' - \code{data} must be a data.frame of hourly-resolution point location data.
#' The data _must_ contain one 'datetime' column and _at least_ one column that can
#' be column indexed with parameter \code{index} via \code{data$index}.
#' - \code{meta} must be a data.frame that contains information corresponding to
#' \code{data} point location timeseries data. The \code{meta} data.frame _must_
#' contain _at least_ a \code{label} column and an \code{index} columns.
#' - \code{...} Additional configuration arguments: width, height, elementId, colors, breaks, inputId.
#' Documentation WIP.
#'
#' @examples
#' library(tiotemp)
#' library(AirSensor)
#' sensor <- example_sensor
#' timeseriesMap(sensor$data, sensor$meta)
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

  # Checks
  if ( is.null(index) ) {
    stop("parameter 'index' is required.")
  }
  if ( is.null(label) ) {
    stop("parameter 'label' is required.")
  }

  # Store extra args
  args <- list( ... )

  # Set default colors
  if ( !"colors" %in% names(args) ) {
    args$colors <- c("#abe3f4", "#118cba", "#286096", "#8659a5", "#6a367a")
  }
  if ( !"breaks" %in% names(args) ) {
    args$breaks <- c(12, 35, 55, 75, 100)
  }

  # Aval config arguments
  config = list(
    width = args$width, # width
    height = args$height, # height
    elementId = args$elementId, # html element ID
    breaks = args$breaks, # color ramp breaks
    colors = args$colors, # colors
    inputId = args$inputId # Shiny input id
  )

  # Create data list
  dataList <- list(
    data = data,
    meta = meta,
    index = index,
    label = label
  )

  # Create data object for forwarding
  x <- append(dataList, config)

  # create widget
  htmlwidgets::createWidget(
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

}

#' Shiny bindings for timeseriesMap
#'
#' Output and render functions for using timeseriesMap within Shiny
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
timeseriesMapOutput <- function(outputId, width = '100%', height = '400px'){
  htmlwidgets::shinyWidgetOutput(outputId, 'timeseriesMap', width, height, package = 'tiotemp')
}

#' @rdname timeseriesMap-shiny
#' @export
renderTimeseriesMap <- function(expr, env = parent.frame(), quoted = FALSE) {
  if (!quoted) { expr <- substitute(expr) } # force quoted
  htmlwidgets::shinyRenderWidget(expr, timeseriesMapOutput, env, quoted = TRUE)
}
