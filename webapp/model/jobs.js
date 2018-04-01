// -----------------------------------------------------------------------------
// Copyright 2018 Pau Sanchez
// -----------------------------------------------------------------------------
'use strict';

const KUJOMAN_JOB_TEMPLATE = 'kujoman_job_template';
const KUJOMAN_JOB_RESULT   = 'kujoman_job_result';

module.exports = function jobs (context) {
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
    createJob : async function (name, author, template, variables) {
      const jobId   = JobTemplate.createJobId (name);
      const jobData = {
        name       : name,
        created_at : new Date(),
        created_by : author,
        updated_at : new Date(),
        updated_by : author,
        template   : template,
        variables  : variables
      };

      const jobKey = datastore.key([KUJOMAN_JOB_TEMPLATE, jobId]);

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
    updateJob : async function (id, name, author, template, variables) {
      // fetch existing data to fill the gaps, the whole object
      // needs to be provided
      const existingData = this.getJobById (id);
      const jobData = {
        name       : name,
        created_at : existingData.created_at,
        created_by : existingData.created_by,
        updated_at : new Date(),
        updated_by : author,
        template   : template,
        variables  : variables
      };

      const jobKey = datastore.key([KUJOMAN_JOB_TEMPLATE, id]);

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
    // getAllJobs
    // -------------------------------------------------------------------------
    getAllJobs : async function () {
      const query = datastore.createQuery(
        KUJOMAN_JOB_TEMPLATE
      ).order('name', { ascending : true });

      let jobQueryResult = (await datastore.runQuery(query))[0];

      let results = [];
      jobQueryResult.forEach(job => {
        job.id = job[datastore.KEY].name;
        job.stats = {
          running : 0,
          waiting : 0,
          failed : 0,
          successful : 0
        };
        results.push (job);
      });
      return results;
    },

    // -------------------------------------------------------------------------
    // getJobById
    // -------------------------------------------------------------------------
    getJobById : async function (jobId) {
      const jobKey = datastore.key ([KUJOMAN_JOB_TEMPLATE, jobId]);
      let jobResult = (await datastore.get (jobKey))[0];
      jobResult.id = jobResult[datastore.KEY].name;
      return jobResult;
    },


    // -------------------------------------------------------------------------
    // deleteJobById
    // -------------------------------------------------------------------------
    deleteJobById : async function (jobId) {
      const jobKey = datastore.key ([KUJOMAN_JOB_TEMPLATE, jobId]);
      let deleteResult = await datastore.delete (jobKey);

      // if deleteResult.indexUpdates == 0 ==> nothing deleted (not existed!)

      return true;
    }
  };
};