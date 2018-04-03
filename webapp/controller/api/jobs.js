// -----------------------------------------------------------------------------
// Copyright 2018 Pau Sanchez
// -----------------------------------------------------------------------------
'use strict';

module.exports = function jobs (context) {
  return {
    createJob : async function (req, resp) {
      const author = "unknown"; // TODO: get from logged account

      try {
        if (req.body.name.length <= 6)
          throw "Name should contain at least 6 characters";

        const job_id = await context.model.jobs.createJob (
          req.body.name,
          author,
          req.body.template,
          req.body.variables
        );

        resp.json ({ ok: (job_id !== false), id : job_id });
      }
      catch (e) {
        resp.json ({ ok : false, message : e.toString() });
      }
    },

    updateJob : async function (req, resp) {
      const author = "unknown"; // TODO: get from logged account

      try {
        if (req.body.name.length <= 6)
          throw "Name should contain at least 6 characters";

        const ok = await context.model.jobs.updateJob (
          req.body.id,
          req.body.name,
          author,
          req.body.template,
          req.body.variables
        );

        resp.json ({ ok: ok });
      }
      catch (e) {
        resp.json ({ ok : false, message : e.toString() });
      }
    },

    deleteJobById : async function (req, resp) {
      const ok = await context.model.jobs.deleteJobById (req.params.id);
      resp.json ({ ok : ok });
    },

    archiveJobById : async function (req, resp) {
      const ok = await context.model.jobs.archiveJobById (req.params.id);
      resp.json ({ ok : ok });
    },

    unarchiveJobById : async function (req, resp) {
      const ok = await context.model.jobs.unarchiveJobById (req.params.id);
      resp.json ({ ok : ok });
    },

    getAllJobs : async function (req, resp) {
      const jobs = await context.model.jobs.getActiveJobs();
      resp.json (jobs);
    },

    getArchivedJobs : async function (req, resp) {
      const jobs = await context.model.jobs.getArchivedJobs();
      resp.json (jobs);
    },

    getJobById : async function (req, resp) {
      const job = await context.model.jobs.getJobById (req.params.id);
      resp.json (job);
    }
  };
}