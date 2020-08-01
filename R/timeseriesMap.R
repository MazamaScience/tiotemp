#' Timeseries Leaflet Map
#'
#' A timeseries leaflet map that displays point location timeseries data and
#' allows playback.
#'
#' @param data
#' @param meta
#'
#' @import htmlwidgets
#'
#' @export
timeseriesMap <- function(
  data,
  meta,
  options = list(
    index = "monitorID",
    label = "label",
    breaks = c(12, 35, 55, 75, 100),
    colors = c("#abe3f4", "#118cba", "#286096", "#8659a5", "#6a367a")
  ),
  shinyInputId = NULL
  ) {

  width = options$width
  height = options$height
  shared = options$shared
  elementId = options$elementId
  index = options$index
  label = options$label
  breaks = options$breaks
  colors = options$colors

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
    index = index,
    label = label,
    breaks = breaks,
    colors = colors,
    shared = shared,
    inputId = shinyInputId,
    settings = list(
      crosstalk_key = key,
      crosstalk_group = group
    )
  )

  # create widget
  htmlwidgets::createWidget(
    name = 'timeseriesMap',
    x,
    width = width,
    height = height,
    package = 'tiotemp',
    elementId = elementId,
    sizingPolicy = htmlwidgets::sizingPolicy(
      defaultWidth = 800,
      defaultHeight = 500,
      viewer.padding = 0,
      browser.fill = TRUE
    ),
    dependencies = crosstalk::crosstalkLibs()
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
