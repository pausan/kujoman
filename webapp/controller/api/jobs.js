// -----------------------------------------------------------------------------
// Copyright 2018 Pau Sanchez
// -----------------------------------------------------------------------------
'use strict';

module.exports = function jobs (context) {
  const JobTemplate = require ('../../static/js/shared/jobtemplate.js');

  return {
    createJob : async function (req, resp) {
      const author = "unknown"; // TODO: get from logged account

      try {
        if (req.body.name.length <= 6)
          throw "Name should contain at least 6 characters";

        const jobId = await context.model.jobs.createJob (
          req.body.name,
          req.body.description,
          author,
          req.body.template,
          req.body.variables
        );

        resp.json ({ ok: (jobId !== false), id : jobId });
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
          req.body.description,
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
    },

    expandAndRunJobs : async function (req, resp) {
      const jobId = req.params.id;
      const jobTemplate = req.body.template;
      const jobVariable = req.body.variables;
      const author = "unknown"; // TODO: get from logged account

      try {
        const expandedJobs = JobTemplate.jobTemplateExpandVariables (
          jobTemplate,
          jobVariable
        );

        let jobExecutionIds = [];
        for (let i = 0; i < expandedJobs.length; i++) {
          const id = await context.model.jobexecutions.enqueueKubernetesJob (
            jobId,
            author,
            expandedJobs[i]
          );

          if (id !== false) {
            jobExecutionIds.push (id);
          }
          else {
            // FIXME! error
          }
        }

        // TODO: enqueue in pub/sub
        // for (let i = 0; i < jobExecutionIds.length; i++) {
        //   FIXME!
        // }

        resp.json({ ok : true, njobs : expandedJobs.length })
      }
      catch (e) {
        resp.json({ ok : false, message : e.toString() })
      }
    }
  };
}