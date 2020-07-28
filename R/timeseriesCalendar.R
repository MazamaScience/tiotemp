#' <Add Title>
#'
#' <Add Description>
#'
#' @import htmlwidgets
#'
#' @export
timeseriesCalendar <- function(data, meta, width = NULL, height = NULL, elementId = NULL) {

  # forward options using x
  x = list(
    data = data,
    meta = meta
  )

  # create widget
  htmlwidgets::createWidget(
    name = 'timeseriesCalendar',
    x,
    width = width,
    height = height,
    package = 'tiotemp',
    elementId = elementId
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
