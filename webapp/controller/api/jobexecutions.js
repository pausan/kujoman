// -----------------------------------------------------------------------------
// Copyright 2018 Pau Sanchez
// -----------------------------------------------------------------------------
'use strict';

module.exports = function jobexecutions (context) {
  return {
    // -------------------------------------------------------------------------
    // getFilteredJobExecutions
    // -------------------------------------------------------------------------
    getFilteredJobExecutions : async function (req, resp) {
      let selectedStatus = (req.query.status || false);
      const selectedPeriod = {
        'lastday' : new Date().setDate(new Date().getDate() - 1),
        'lastweek' : new Date().setDate(new Date().getDate() - 1),
        'lastmonth' : new Date().setMonth(new Date().getMonth() - 1),
        'lastyear' : new Date().setFullYear(new Date().getFullYear() - 1),
        'alltimes' : null
      }[req.query.period] || null;

      if (selectedStatus == 'all')
        selectedStatus = false;

      try {
        const executions = await context.model.jobexecutions.filterJobExecutions (
          selectedStatus,
          selectedPeriod
        );

        resp.json(executions);
      }
      catch (e) {
        resp.json ({ ok: false, message : e})
      }
    }
  };
};