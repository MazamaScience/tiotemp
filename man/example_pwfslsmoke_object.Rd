% Generated by roxygen2: do not edit by hand
% Please edit documentation in R/data.R
\docType{data}
\name{example_pwfslsmoke_object}
\alias{example_pwfslsmoke_object}
\title{Example PWFSLSmoke Timeseries dataset}
\format{
An S3 object composed of "meta" and "data" data.
}
\usage{
example_pwfslsmoke_object
}
\description{
The \code{example_pwfslsmoke_object} dataset provides a quickly
loadable version of an \pkg{PWFSLSmoke} package \emph{ws_monitor} object for
code examples.
This dataset was generated with PWFSLSmoke version 1.2.112 on 2020-09-16 by
running:

\preformatted{
library(PWFSLSmoke)

example_pwfslsmoke_object <-
  PWFSLSmoke::monitor_load(startdate = 20200901, enddate = 20200915) %>%
  PWFSLSmoke::monitor_subset(stateCodes = "CA")

save(example_pwfslsmoke_object, file = "data/example_pwfslsmoke_object.rda")
}
}
\keyword{datasets}
