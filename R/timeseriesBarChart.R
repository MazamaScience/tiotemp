#' <Add Title>
#'
#' <Add Description>
#'
#' @import htmlwidgets
#'
#' @export
timeseriesBarChart <- function(meta, data, title = NULL, subtitle = NULL, ylab = "PM₂.₅ (μg/m³)", shared = NULL, width = NULL, height = NULL, elementId = NULL) {

  if (crosstalk::is.SharedData(shared)) {
    # Using Crosstalk
    key <- shared$key()
    group <- shared$groupName()
    shared <- shared$origData()
  } else {
    # Not using Crosstalk
    key <- NULL
    group <- NULL
  }
  # forward options using x
  x = list(
    data = data,
    meta = meta,
    title = title,
    subtitle = subtitle,
    ylab = ylab,
    shared = shared,
    settings = list(
      crosstalk_key = key,
      crosstalk_group = group
    )
  )
  # create widget
  htmlwidgets::createWidget(
    name = 'timeseriesBarChart',
    x,
    width = width,
    height = height,
    package = 'tiotemp',
    elementId = elementId,
    dependencies = crosstalk::crosstalkLibs()
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
