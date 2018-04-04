// -----------------------------------------------------------------------------
// Copyright 2018 Pau Sanchez
// -----------------------------------------------------------------------------
'use strict';

// TODO: use sharding counters in order to increment and decrement application
//       stats.
//
//       In case a relational db is used, that would not be needed.
//
//       See: https://cloud.google.com/appengine/articles/sharding_counters

module.exports = function jobstats (context) {
  const JobConst = require ('./jobconst.js');
  const uuid4 = require ('uuid/v4');
  const Datastore = require('@google-cloud/datastore');
  const datastore = Datastore({
    projectId: context.config.cloud.gcloud.project
  });

  return {
    getStatsByJobId (jobId) {
      return {
        waiting    : this.stateCountForJobId (jobId, JobConst.JOB_STATUS_WAITING),
        running    : this.stateCountForJobId (jobId, JobConst.JOB_STATUS_RUNNING),
        retrying   : this.stateCountForJobId (jobId, JobConst.JOB_STATUS_RETRYING),
        stopped    : this.stateCountForJobId (jobId, JobConst.JOB_STATUS_STOPPED),
        successful : this.stateCountForJobId (jobId, JobConst.JOB_STATUS_SUCCESSFUL),
        failed     : this.stateCountForJobId (jobId, JobConst.JOB_STATUS_FAILED)
      };
    },

    stateCountForJobId (jobId, state) {
      return parseInt (Math.random() * 5);
    },
  }
}
