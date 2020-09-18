#' @title Timeseries Calendar Heatmap
#'
#' @description
#'
#' @param data A data.frame that contains the hourly-resolution point location
#' timeseries data. See Details.
#' @param meta A data.frame that contains the point location metadata. See Details.
#' @param index A string to index point location metadata and temporal data by.
#' @param label A string to index point location metadata label by.
#' @param full Fill and display full calendar year.
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
#' with the timeseries found in \code{data}.
#'
#' The following \code{meta} columns _must_ be included:
#'
#' \itemize{
#' \item{code{"timezone"} -- A column named \code{"timezone"} must contain the
#' Olson timezone associated with each location.}
#' \item{code{index} -- Name of the the column containing the unique
#' identifier associated with each location. These map onto columns in the
#' \code{data} dataframe.}
#' \item{code{label} -- Name of the column containing the human readable label
#' associated with each location.}
#' }
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
#' \item{\code{unitString} -- units appended to hover text}
#' }
#'
#' @note When specifying \code{colors} and \code{breaks}, you must use the
#' \pkg{d3} idiom where the vector of colors is one longer than the vector of
#' breaks. Everything below the lowest break gets the lowest color. Everything
#' above the highest break gets the highest color.
#'
#' @import htmlwidgets
#'
#' @export
#' @examples
#' library(tiotemp)
#'
#' sensor <- example_airsensor_object
#'
#' timeseriesCalendar(
#'   data = sensor$data[,c(1,2)],
#'   meta = sensor$meta[1,],
#'   unitString = "  (\u00B5g/m\u00B3)")
#'
timeseriesCalendar <- function(
  data = NULL,
  meta = NULL,
  index = 'monitorID',
  label = 'label',
  full = TRUE,
  ...
) {

  # ----- Validate parameters --------------------------------------------------

  MazamaCoreUtils::stopIfNull(data)
  MazamaCoreUtils::stopIfNull(meta)

  if ( !"datetime" %in% names(data) )
    stop("Parameter 'data' must contain a column named 'datetime'")

  if ( !is.character(index) )
    index <- 'monitorID'

  if ( !is.character(label) )
    index <- 'label'

  if ( !is.logical(full) )
    full <- TRUE

  if ( !"timezone" %in% names(meta) )
    stop(sprintf("Parameter 'meta' must contain a column named 'timezone'"))

  if ( !index %in% names(meta) )
    stop(sprintf("Parameter 'meta' must contain a column named '%s'", index))

  if ( !label %in% names(meta) )
    stop(sprintf("Parameter 'meta' must contain a column named '%s'", label))

  # ----- Parameter defaults ---------------------------------------------------

  # Store extra args
  args <- list( ... )

  # Set default colors
  if ( !"colors" %in% names(args) ) {
    args$colors <- c("#ededed", "#abe3f4", "#118cba", "#286096", "#8659a5", "#6a367a")
  }
  if ( !"breaks" %in% names(args) ) {
    args$breaks <- c(0.1, 12, 35, 55, 75, 100)
  }
  if ( !"unitString" %in% names(args) ) {
    args$unitString <- ""
  }

  # Available config arguments
  config = list(
    width = args$width,           # width
    height = args$height,         # height
    elementId = args$elementId,   # html element ID
    breaks = args$breaks,         # color ramp breaks
    colors = args$colors,         # colors
    inputId = args$inputId,       # Shiny input id
    unitString = args$unitString  # appended to value in hover text
  )

  # ----- Create daily average dataframe ---------------------------------------

  # Create daily averages
  dailyData <- .daily_aggregate(
    data = data,
    FUN =  function(x) { mean(x, na.rm = TRUE) },
    timezone = 'UTC'#meta$timezone
  )

  if ( full ) {

    # Put daily alverages on a full year time axis
    emptyYear <- dplyr::tibble(
      "datetime" = MazamaCoreUtils::dateSequence(
        strftime(dailyData$datetime[1], "%Y010101"),
        strftime(dailyData$datetime[nrow(dailyData)], "%Y123101"),
        timezone = 'UTC'#meta$timezone
      )
    )

    dailyData <- dplyr::left_join(emptyYear, dailyData, by = "datetime")

  }

  # ----- Create widget --------------------------------------------------------

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

# ===== DEBUGGING ==============================================================

if ( FALSE ) {


  library(AirSensor)

  setArchiveBaseUrl("http://data.mazamascience.com/PurpleAir/v1")

  sctv_08 <-
    sensor_loadYear(datestamp = 2019) %>%
    sensor_filterMeta(label == "SCTV_08") %>%
    sensor_filterDate(20190101, 20200101, timezone = "America/Los_Angeles")

  timeseriesCalendar(sctv_08$data, sctv_08$meta)

}
