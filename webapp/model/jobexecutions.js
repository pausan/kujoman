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
          status         : JobConst.JOB_STATUS_WAITING,
          archived       : false,

          // k8s specific fields
          k8s_id          : '',

          k8s_started_at  : 0,
          k8s_finished_at : 0,

          k8s_retries     : 0,
          k8s_stdout      : '',
          k8s_stderr      : ''
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
  };
};