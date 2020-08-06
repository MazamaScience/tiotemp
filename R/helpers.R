#' @keywords internal
#' @importFrom rlang .data
#' @importFrom stats aggregate median na.omit quantile sd t.test time
#'
#' @title Aggregate data.frame Object
#'
#' @param df \emph{data.frame} object.
#' @param FUN The function to be applied to each vector of numeric data.
#'
#' @description Aggregate (\emph{data.frame}) object along its
#' datetime axis. Temporal aggregation involves splitting a \emph{data.frame} object into
#' separate bins along its datetime axis. \code{FUN} is mapped to the \emph{data.frame}
#' numeric variables in each bin.
#'
#' @details \code{FUN} must operate on univariate numeric vectors and return a
#' scalar value. Besides the data variable, no additional arguments will be
#' provided to this function. This means that functions like \code{mean} and
#' \code{max} will need to be wrapped in a function that specifies
#' \code{na.rm = TRUE}. See the examples below.
#'
#' @return Returns an aggregated \emph{data.frame} object.
.daily_aggregate <- function(df, FUN =  function(x) { mean(x, na.rm = TRUE) }) {

  data <- df

  if ( !"datetime" %in% names(df) ) {
    stop("Column 'datetime' is is missing from 'sensor'.")
  }

  if ( nrow(df) == 0 ) {
    stop("Parameter 'sensor' has no data.")
  }

  # Remove any duplicate data records
  df <- dplyr::distinct(df)

  unit = 'hours'
  count = 24

  # Create break units from count and unit params
  if ( stringr::str_detect(unit, 'minutes') ) {
    lubridateBreakUnit <- paste(count, unit, sep = ' ')
    seqBreakUnit <- paste(count, 'mins', sep = ' ')
  } else if (stringr::str_detect(unit, 'hour') ) {
    lubridateBreakUnit <- paste(count, unit, sep = ' ')
    seqBreakUnit <- paste(count, unit, sep = ' ')
  } else {
    stop('Only hours and minutes are currently supported units.')
  }

  # ----- Aggregate Data -------------------------------------------------------

  # Only use numeric columns for aggregation matrix
  numeric_cols <- which(unlist(lapply(df, is.numeric)))

  # Convert to eXtensible Time Series (xts) data.frame
  # Separate only useful data for calculation (i.e. only numeric)
  df <- xts::xts(
    x = df[numeric_cols],
    order.by = df$datetime,
    unique = TRUE,
    tzone = 'UTC'
  )

  # Split the xts into a list of binned xts matrices
  df_bins <- xts::split.xts(
    df,
    f = 'hours',
    drop = FALSE,
    k = '24'
  )

  # ----- Datetime Axis --------------------------------------------------------

  # Get the first index of aligned time for future use.
  datetime <- as.numeric(
    lapply(
      X = df_bins,
      # Select first datetime index in bin to use as aggregated datetime axis
      FUN = function(x) lubridate::floor_date(zoo::index(x)[1], unit = lubridateBreakUnit) ## First # [nrow(x)] ## Last
    )
  )
  # Convert saved datetime vector back to POSIX* from int
  class(datetime) <- c("POSIXct", "POSIXt")
  attr(datetime, 'tzone') <- 'UTC'

  dateRange <- range(datetime)
  starttime <- MazamaCoreUtils::parseDatetime(dateRange[1], timezone = "UTC")
  endtime <- MazamaCoreUtils::parseDatetime(dateRange[2], timezone = "UTC")

  # Create dataframe with continuous axis
  datetimeAxis <- dplyr::tibble('datetime' = seq(starttime, endtime, by = seqBreakUnit))

  # ----- Assemble 'data' ------------------------------------------------------

  # Map each binned hourly data.frame to the user defined lambda-like
  # function f applied via apply to each vector in the mapped data.frame
  mapped <- base::Map(
    df_bins,
    f = function(d, f = FUN) { apply(d, 2, f) }
  )

  dfMatrix <-
    do.call(rbind, mapped)

  # Add mapped data to pa_timeseries object with aggregate datetime axis
  df <-
    data.frame(
      'datetime' = datetime,
      dfMatrix,check.names = F
    ) %>%
    # Cleanup any NaN or Inf that might have snuck in
    dplyr::mutate_all( function(x) replace(x, which(is.nan(x)), NA) ) %>%
    dplyr::mutate_all( function(x) replace(x, which(is.infinite(x)), NA) )

  df <- dplyr::left_join(datetimeAxis, df, by = 'datetime', copy = TRUE)

  # ----- Return ---------------------------------------------------------------

  return(df)
}
