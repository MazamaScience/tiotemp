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
#' timeseriesMap1(meta = sensor$meta, data = sensor$data)
timeseriesMap1 <- function(meta, data, width = NULL, height = NULL, elementId = NULL) {

  # forward options using x
  x = list(
    meta = meta,
    data = data
  )

  # create widget
  htmlwidgets::createWidget(
    name = 'timeseriesMap1',
    x,
    width = width,
    height = height,
    package = 'tiotemp',
    elementId = elementId
  )
}

#' Shiny bindings for timeseriesMap1
#'
#' Output and render functions for using timeseriesMap1 within Shiny
#' applications and interactive Rmd documents.
#'
#' @param outputId output variable to read from
#' @param width,height Must be a valid CSS unit (like \code{'100\%'},
#'   \code{'400px'}, \code{'auto'}) or a number, which will be coerced to a
#'   string and have \code{'px'} appended.
#' @param expr An expression that generates a timeseriesMap1
#' @param env The environment in which to evaluate \code{expr}.
#' @param quoted Is \code{expr} a quoted expression (with \code{quote()})? This
#'   is useful if you want to save an expression in a variable.
#'
#' @name timeseriesMap1-shiny
#'
#' @export
timeseriesMap1Output <- function(outputId, width = '100%', height = '400px'){
  htmlwidgets::shinyWidgetOutput(outputId, 'timeseriesMap1', width, height, package = 'tiotemp')
}

#' @rdname timeseriesMap1-shiny
#' @export
renderTimeseriesMap1 <- function(expr, env = parent.frame(), quoted = FALSE) {
  if (!quoted) { expr <- substitute(expr) } # force quoted
  htmlwidgets::shinyRenderWidget(expr, timeseriesMap1Output, env, quoted = TRUE)
}
