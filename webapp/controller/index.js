// -----------------------------------------------------------------------------
// Copyright 2018 Pau Sanchez
// -----------------------------------------------------------------------------
'use strict';

module.exports = function allControllers (context) {
  const api = require ('./api')(context);
  return {
    api: api
  };
}