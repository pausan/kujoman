// -----------------------------------------------------------------------------
// Copyright 2018 Pau Sanchez
// -----------------------------------------------------------------------------
'use strict';


module.exports = function jobs (context) {
  const _ = require ('lodash');
  const JobConst = require ('./jobconst.js');
  const JobTemplate = require ('../static/js/shared/jobtemplate.js');
  const Datastore = require('@google-cloud/datastore');
  const datastore = Datastore({
    projectId: context.config.cloud.gcloud.project
  });

  return {
    // -------------------------------------------------------------------------
    // createJob
    //
    // Creates a new job in the database and returns the newly created job id
    // or false if anything goes wrong.
    // -------------------------------------------------------------------------
    createJob : async function (name, description, author, template, variables) {
      const jobId   = JobTemplate.createJobId (name);
      const jobData = {
        name        : name,
        description : description,
        created_at  : new Date(),
        created_by  : author,
        updated_at  : new Date(),
        updated_by  : author,
        template    : template,
        variables   : variables,
        archived    : false
      };

      const jobKey = datastore.key([JobConst.DB_KUJOMAN_JOB_TEMPLATE, jobId]);

      try {
        await datastore.insert ({key : jobKey, data : jobData});
        return jobId;
      }
      catch (e) {
        console.log ("EXCEPTION!" + e); // FIXME!
      }
      return false;
    },

    // -------------------------------------------------------------------------
    // updateJob
    //
    // Creates a new job in the database and returns the newly created job id
    // or false if anything goes wrong.
    // -------------------------------------------------------------------------
    updateJob : async function (id, name, description, author, template, variables) {
      // fetch existing data to fill the gaps, the whole object
      // needs to be provided
      const existingData = await this.getJobById (id);
      const overrideData = {
        name        : name,
        description : description,
        updated_at  : new Date(),
        updated_by  : author,
        template    : template,
        variables   : variables
      };
      const jobData = _.extend (existingData, overrideData);

      const jobKey = datastore.key([JobConst.DB_KUJOMAN_JOB_TEMPLATE, id]);

      try {
        await datastore.update ({key : jobKey, data : jobData});
        return true;
      }
      catch (e) {
        console.log ("EXCEPTION!" + e); // FIXME!
      }
      return false;
    },

    // -------------------------------------------------------------------------
    // archiveJobById
    //
    // Flag a job as archived.
    // -------------------------------------------------------------------------
    archiveJobById : async function (id) {
      const jobKey = datastore.key([JobConst.DB_KUJOMAN_JOB_TEMPLATE, id]);

      const jobData = await this.getJobById (id);
      jobData.archived = true;

      try {
        await datastore.update ({key : jobKey, data : jobData});
        return true;
      }
      catch (e) {
        console.log ("EXCEPTION!" + e); // FIXME!
      }

      return false;
    },

    // -------------------------------------------------------------------------
    // unarchiveJobById
    //
    // Unflag a job as archived.
    // -------------------------------------------------------------------------
    unarchiveJobById : async function (id) {
      const jobKey = datastore.key([JobConst.DB_KUJOMAN_JOB_TEMPLATE, id]);

      const jobData = await this.getJobById (id);
      jobData.archived = false;

      try {
        await datastore.update ({key : jobKey, data : jobData});
        return true;
      }
      catch (e) {
        console.log ("EXCEPTION!" + e); // FIXME!
      }

      return false;
    },

    // -------------------------------------------------------------------------
    // getActiveJobs
    // -------------------------------------------------------------------------
    getActiveJobs : async function () {
      const query = datastore.createQuery(
        JobConst.DB_KUJOMAN_JOB_TEMPLATE
      ).filter ('archived', '=', false)
       .order('name', { ascending : true });

      let jobQueryResult = (await datastore.runQuery(query))[0];

      let results = [];
      for (const job of jobQueryResult) {
        job.id = job[datastore.KEY].name;
        job.stats = await context.model.jobexecutionstats.getStatsByJobId (job.id);
        results.push (job);
      }
      return results;
    },

    // -------------------------------------------------------------------------
    // getArchivedJobs
    // -------------------------------------------------------------------------
    getArchivedJobs : async function () {
      const query = datastore.createQuery(
        JobConst.DB_KUJOMAN_JOB_TEMPLATE
      ).filter ('archived', '=', true)
       .order('name', { ascending : true });

      let jobQueryResult = (await datastore.runQuery(query))[0];

      let results = [];
      for (const job of jobQueryResult) {
        job.id = job[datastore.KEY].name;
        job.stats = await context.model.jobexecutionstats.getStatsByJobId (job.id);
        results.push (job);
      }
      return results;
    },

    // -------------------------------------------------------------------------
    // getJobById
    // -------------------------------------------------------------------------
    getJobById : async function (jobId) {
      const jobKey = datastore.key ([JobConst.DB_KUJOMAN_JOB_TEMPLATE, jobId]);
      let jobResult = {};

      try {
        jobResult = (await datastore.get (jobKey))[0];
        jobResult.id = jobResult[datastore.KEY].name;
      }
      catch (e) {
        // ignore
      }
      return jobResult;
    },

    // -------------------------------------------------------------------------
    // deleteJobById
    // -------------------------------------------------------------------------
    deleteJobById : async function (jobId) {
      const jobKey = datastore.key ([JobConst.DB_KUJOMAN_JOB_TEMPLATE, jobId]);

      try {
        await datastore.delete (jobKey);
      }
      catch (e) {
        // do nothing
      }

      // TODO: ensure job has been archived first?

      // if deleteResult.indexUpdates == 0 ==> nothing deleted (not existed!)

      return true;
    }
  };
};