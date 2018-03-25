// -----------------------------------------------------------------------------
// Copyright 2018 Pau Sanchez
// -----------------------------------------------------------------------------
'use strict';

module.exports = function routeExports (context) {
  const app = context.express;

  // app.get(
  //   '/api/...',
  //   context.controller.api....
  // );

  app.get ('/api/jobs/all', context.controller.api.jobs.getAllJobs)
  app.get ('/api/jobs/get/:id', context.controller.api.jobs.getJobById)

  // we use HTML5 history mode on the frontend, so we should always show
  // the same route
  app.get('*', (req, resp) => {
    resp.render('index', {
      currentYear: new Date().getFullYear(),
      secure: req.secure
    });
  });
}