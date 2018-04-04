// -----------------------------------------------------------------------------
// Copyright 2018 Pau Sanchez
// -----------------------------------------------------------------------------
'use strict';

module.exports = function controllerApi (context) {
  const jobs = require ('./jobs')(context);
  const jobexecutions = require ('./jobexecutions')(context);
  const jobstats = require ('./jobstats')(context);

  return {
    jobs          : jobs,
    jobexecutions : jobexecutions,
    jobstats      : jobstats
  };
}