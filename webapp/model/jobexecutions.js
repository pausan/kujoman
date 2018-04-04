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
    // enqueueKubernetesJob
    // -------------------------------------------------------------------------
    enqueueKubernetesJob : async function (
      job_id,
      author,
      job_yaml
    )
    {
      const jobExecutionKey  = uuid4();
      const jobExecutionData = {
        job_id         : job_id,
        created_at     : new Date(),
        created_by     : author,  // person who created this job execution

        updated_at     : new Date(),

        type           : JobConst.JOB_TYPE_KUBERNETES,
        parameters     : job_yaml,
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

      const dsKey = datastore.key([JobConst.DB_KUJOMAN_JOB_EXECUTION, jobExecutionKey]);

      try {
        await datastore.insert ({key : dsKey, data : jobExecutionData});
        return jobExecutionData;
      }
      catch (e) {
        console.log ("Exception: " + e); // FIXME!
      }

      return false;
    },
  };
};