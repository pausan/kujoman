// -----------------------------------------------------------------------------
// Copyright 2018 Pau Sanchez
// -----------------------------------------------------------------------------
'use strict';

module.exports = function controllerApi (context) {
  const jobs = require ('./jobs')(context);
  return {
    jobs: jobs
  };
}