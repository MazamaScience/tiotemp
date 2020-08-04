#' <Add Title>
#'
#' <Add Description>
#'
#' @import htmlwidgets
#'
#' @export
#' @examples
#' library(AirSensor)
#' sensor <- example_sensor
#' timeseriesBarChart(meta = sensor$meta, data = sensor$data)
timeseriesBarChart <- function(
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
    inputId = args$inputId, # Shiny input id
    ylab = args$ylab, # y axis label
    xlab = args$xlab # x axis label
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
    name = 'timeseriesBarChart',
    x,
    width = args$width,
    height = args$hieght,
    package = 'tiotemp',
    elementId = args$elementId
  )
}

#' Shiny bindings for timeseriesBarChart
#'
#' Output and render functions for using timeseriesBarChart within Shiny
#' applications and interactive Rmd documents.
#'
#' @param outputId output variable to read from
#' @param width,height Must be a valid CSS unit (like \code{'100\%'},
#'   \code{'400px'}, \code{'auto'}) or a number, which will be coerced to a
#'   string and have \code{'px'} appended.
#' @param expr An expression that generates a timeseriesBarChart
#' @param env The environment in which to evaluate \code{expr}.
#' @param quoted Is \code{expr} a quoted expression (with \code{quote()})? This
#'   is useful if you want to save an expression in a variable.
#'
#' @name timeseriesBarChart-shiny
#'
#' @export
timeseriesBarChartOutput <- function(outputId, width = '100%', height = '400px'){
  htmlwidgets::shinyWidgetOutput(outputId, 'timeseriesBarChart', width, height, package = 'tiotemp')
}

#' @rdname timeseriesBarChart-shiny
#' @export
renderTimeseriesBarChart <- function(expr, env = parent.frame(), quoted = FALSE) {
  if (!quoted) { expr <- substitute(expr) } # force quoted
  htmlwidgets::shinyRenderWidget(expr, timeseriesBarChartOutput, env, quoted = TRUE)
}
