#' @title Example AirSensor Timeseries dataset
#' @format An S3 object composed of "meta" and "data" data.
#' @description The \code{example_airsensor_object} dataset provides a quickly
#' loadable version of an \pkg{AirSensor} package \emph{airsensor} object for
#' code examples.
#' This dataset was generated with AirSensor version 0.9.9 on 2020-08-14 by
#' running:
#'
#' \preformatted{
#' library(AirSensor)
#'
#' example_airsensor_object <-
#'   AirSensor::sensor_loadMonth(collection = "scaqmd", datestamp = 202007)
#'
#' save(example_airsensor_object, file = "data/example_airsensor_object.rda")
#' }
"example_airsensor_object"


#' @title Example PWFSLSmoke Timeseries dataset
#' @format An S3 object composed of "meta" and "data" data.
#' @description The \code{example_pwfslsmoke_object} dataset provides a quickly
#' loadable version of an \pkg{PWFSLSmoke} package \emph{ws_monitor} object for
#' code examples.
#' This dataset was generated with PWFSLSmoke version 1.2.112 on 2020-08-14 by
#' running:
#'
#' \preformatted{
#' library(PWFSLSmoke)
#'
# example_pwfslsmoke_object <-
#   PWFSLSmoke::monitor_load(startdate = 20191020, enddate = 20191110) %>%
#   PWFSLSmoke::monitor_subset(stateCodes = "CA")
#
# save(example_pwfslsmoke_object, file = "data/example_pwfslsmoke_object.rda")
#' }
"example_pwfslsmoke_object"
