// -----------------------------------------------------------------------------
// Copyright 2018 Pau Sanchez
// -----------------------------------------------------------------------------
'use strict';

module.exports = function routeExports (context) {
  const app = context.express;

  app.post ('/api/jobs/create', context.controller.api.jobs.createJob);
  app.post ('/api/jobs/update', context.controller.api.jobs.updateJob);
  app.all ('/api/jobs/delete/:id', context.controller.api.jobs.deleteJobById);
  app.all ('/api/jobs/archive/:id', context.controller.api.jobs.archiveJobById);
  app.all ('/api/jobs/unarchive/:id', context.controller.api.jobs.unarchiveJobById);

  app.post ('/api/jobs/run/:id', context.controller.api.jobs.expandAndRunJobs);

  app.get ('/api/jobs/all', context.controller.api.jobs.getAllJobs);
  app.get ('/api/jobs/all-archived', context.controller.api.jobs.getArchivedJobs);
  app.get ('/api/jobs/get/:id', context.controller.api.jobs.getJobById);

  app.get ('/api/settings', context.controller.api.settings.getSettings);

  // we use HTML5 history mode on the frontend, so we should always show
  // the same route
  app.get('*', (req, resp) => {
    resp.render('index', {
      currentYear: new Date().getFullYear(),
      secure: req.secure
    });
  });
}