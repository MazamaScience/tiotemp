#' @keywords internal
#' @export
#' @importFrom dplyr `%>%`
#' @importFrom stats aggregate
#'
#' @title Create daily values
#'
#' @param data \emph{data.frame} object containing a \emph{POSIXct}
#' \code{datetime} column.
#' @param FUN The function to be applied to each vector of numeric data.
#' @param timezone Olson timezone used to align days.
#'
#' @description Aggregate a (\emph{data.frame}) object along its \code{datetime}
#' axis. Records are separated into local-time daily bins and \code{FUN} is
#' used to aggregate values for each day into a single daily value.
#'
#' @details \code{FUN} must operate on univariate numeric vectors and return a
#' scalar value. Besides the data variable, no additional arguments will be
#' provided to this function. This means that functions like \code{mean} and
#' \code{max} will need to be wrapped in a function that specifies
#' \code{na.rm = TRUE}. See the examples below.
#'
#' @return Returns a daily-aggregated \emph{data.frame} object.
#'
#' @examples
#' columnIndex <- 2
#'
#' data <- example_pwfslsmoke_object$data[,c(1,columnIndex)]
#' meta <- example_pwfslsmoke_object$meta[(columnIndex - 1),]
#' timezone <- meta$timezone
#'
#' head(data)
#'
#' dailyData <- .daily_aggregate(data, timezone = timezone)
#'
#' head(dailyData)

.daily_aggregate <- function(
  data = NULL,
  FUN =  function(x) { mean(x, na.rm = TRUE) },
  timezone = NULL
) {

  # ----- Validate parameters --------------------------------------------------

  MazamaCoreUtils::stopIfNull(data)
  MazamaCoreUtils::stopIfNull(timezone)

  if ( !"datetime" %in% names(data) )
    stop("Parameter 'data' must contain a column named 'datetime'")

  if ( nrow(data) == 0 )
    stop("Parameter 'sensor' has no data.")

  # ----- Aggregate Data -------------------------------------------------------

  # Remove any duplicate data records
  data <- dplyr::distinct(data)

  # TODO:  Trim to full local time days

  localTime <- lubridate::with_tz(data$datetime, tzone = timezone)
  jday <- strftime(data$datetime, "%j", tz = timezone)
  dailyAxis <- lubridate::floor_date(localTime, unit = "day") %>% sort() %>% unique()

  dailyData <-
    stats::aggregate(x = data[,-1], by = list(jday), FUN = FUN)

  names(dailyData) <- names(data)
  dailyData$datetime <- dailyAxis

  # ----- Return ---------------------------------------------------------------

  return(dailyData)

}

# ===== DEBUGGING ==============================================================

if ( FALSE ) {

  columnIndex <- 2

  data <- example_pwfslsmoke_object$data[,c(1,columnIndex)]
  meta <- example_pwfslsmoke_object$meta[(columnIndex - 1),]
  timezone <- meta$timezone

  dailyData <- .daily_aggregate(data, meta, timezone)

}
