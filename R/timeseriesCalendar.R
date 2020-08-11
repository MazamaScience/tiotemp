#' @title Timeseries Calendar Heatmap
#'
#' @description
#'
#' @param data A data.frame that contains the hourly-resolution point location
#' timeseries data. See Details.
#' @param meta A data.frame that contains the point location metadata. See Details.
#' @param index A string to index point location metadata and temporal data by.
#' @param label A string to index point location metadata label by.
#' @param ... Additional arguments. See details.
#'
#' @import htmlwidgets
#'
#' @export
#' @examples
#' library(tiotemp)
#' library(AirSensor)
#' sensor <- example_sensor
#' timeseriesCalendar(data = sensor$data, meta = sensor$meta)
timeseriesCalendar <- function(
  data,
  meta,
  index = 'monitorID',
  label = 'label',
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

  dailyData <- .daily_aggregate(data)

  # Create data list
  dataList <- list(
    data = dailyData,
    meta = meta,
    index = index,
    label = label
  )


  # forward options using x
  x <- append(dataList, config)

  # create widget
  htmlwidgets::createWidget(
    name = 'timeseriesCalendar',
    x,
    width = args$width,
    height = args$hieght,
    package = 'tiotemp',
    elementId = args$elementId
  )
}

#' Shiny bindings for timeseriesCalendar
#'
#' Output and render functions for using timeseriesCalendar within Shiny
#' applications and interactive Rmd documents.
#'
#' @param outputId output variable to read from
#' @param width,height Must be a valid CSS unit (like \code{'100\%'},
#'   \code{'400px'}, \code{'auto'}) or a number, which will be coerced to a
#'   string and have \code{'px'} appended.
#' @param expr An expression that generates a timeseriesCalendar
#' @param env The environment in which to evaluate \code{expr}.
#' @param quoted Is \code{expr} a quoted expression (with \code{quote()})? This
#'   is useful if you want to save an expression in a variable.
#'
#' @name timeseriesCalendar-shiny
#'
#' @export
timeseriesCalendarOutput <- function(outputId, width = '100%', height = '400px'){
  htmlwidgets::shinyWidgetOutput(outputId, 'timeseriesCalendar', width, height, package = 'tiotemp')
}

#' @rdname timeseriesCalendar-shiny
#' @export
renderTimeseriesCalendar <- function(expr, env = parent.frame(), quoted = FALSE) {
  if (!quoted) { expr <- substitute(expr) } # force quoted
  htmlwidgets::shinyRenderWidget(expr, timeseriesCalendarOutput, env, quoted = TRUE)
}
