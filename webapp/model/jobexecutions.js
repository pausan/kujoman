// -----------------------------------------------------------------------------
// Copyright 2018 Pau Sanchez
// -----------------------------------------------------------------------------
'use strict';

module.exports = function jobs (context) {
  const JobConst = require ('./jobconst.js');
  const uuid4 = require ('uuid/v4');
  const Datastore = require('@google-cloud/datastore');
  const datastore = Datastore({
    projectId: context.config.cloud.gcloud.project
  });

  return {
    // -------------------------------------------------------------------------
    // enqueueMultipleKubernetesJob
    //
    // Returns a list of job execution ids.
    //
    // NOTE: avoid using this method inside a loop, because of stats
    // -------------------------------------------------------------------------
    enqueueMultipleKubernetesJob : async function (
      jobId,
      author,
      jobYamlArray
    )
    {
      let jobExecutionIds = [];
      let dsInserts = [];

      for (let i = 0; i < jobYamlArray.length; i++) {
        const jobExecutionId = uuid4();
        const jobExecutionData = {
          job_id         : jobId,
          created_at     : new Date(),
          created_by     : author,  // person who created this job execution

          updated_at     : new Date(),

          type           : JobConst.JOB_TYPE_KUBERNETES,
          parameters     : jobYamlArray,
          archived       : false,

          // generic task-related information
          status         : JobConst.JOB_STATUS_WAITING,

          started_at     : 0,
          finished_at    : 0,

          retries        : 0,
          stdout         : '',
          stderr         : '',

          // k8s specific fields
          k8s_id         : ''
        };

        const dsKey = datastore.key([JobConst.DB_KUJOMAN_JOB_EXECUTION, jobExecutionId]);

        dsInserts.push (
          datastore.insert ({key : dsKey, data : jobExecutionData})
        );
        jobExecutionIds.push (jobExecutionId);
      }

      try {
        await Promise.all (dsInserts)
      }
      catch (e) {
        console.log ("Exception: " + e); // FIXME!
      }

      context.model.jobexecutionstats.incrementStatusCountForJobId (
        jobId,
        JobConst.JOB_STATUS_WAITING,
        jobYamlArray.length
      );

      return jobExecutionIds;
    },

    // -------------------------------------------------------------------------
    // filterJobExecutions
    //
    // Returns a list of jobs that met given criteria.
    // -------------------------------------------------------------------------
    async filterJobExecutions (desiredStatus = [], updatedAfter = null) {
      // prepare the query
      const query = datastore.createQuery (JobConst.DB_KUJOMAN_JOB_EXECUTION);

      if (desiredStatus)
        query.filter('status', '=', desiredStatus);

      if (updatedAfter)
        query.filter('updated_at', '>', updatedAfter)

      query.order('updated_at', { ascending : false });

      // do the query
      let results = [];
      try {
        let jobQueryResult = (await datastore.runQuery(query))[0];
        this.fixDurationValues (jobQueryResult)
        return jobQueryResult;
      }
      catch (e) {
        console.log (e);
      }

      return [];
    },

    // -------------------------------------------------------------------------
    // Set 'duration' value based on started_at and finished_at. In case the
    // task is not finished, then use current time.
    // -------------------------------------------------------------------------
    fixDurationValues (rows) {
      const now = (new Date());
      for (const row of rows) {
        row.duration = 0;

        if (row.started_at && row.finished_at) {
          row.duration = row.finished_at - row.started_at;
        }
        else if (row.started_at) {
          row.duration = now - row.started_at;
        }
      }
    }
  };
};