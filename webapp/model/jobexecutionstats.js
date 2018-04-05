// -----------------------------------------------------------------------------
// Copyright 2018 Pau Sanchez
//
// Job Execution Stats
//
// For datastore we need to use sharding counters to increment/decrement
// job execution stats. For a relational DB this won't be needed.
//
// See: https://cloud.google.com/appengine/articles/sharding_counters
// -----------------------------------------------------------------------------
'use strict';

module.exports = function jobstats (context) {
  const JobConst = require ('./jobconst.js');
  const uuid4 = require ('uuid/v4');
  const Datastore = require('@google-cloud/datastore');
  const datastore = Datastore({
    projectId: context.config.cloud.gcloud.project
  });

  const NUM_SHARDS = 10;

  return {
    // -------------------------------------------------------------------------
    // incrementStatusCountForJobId
    //
    // Increments the status count for given job id using fixed number of shards.
    //
    // Basically selects an entity identified by (jobId + '-' + shardId) randomly
    // and increments it, and if it does not exist, it creates it.
    // -------------------------------------------------------------------------
    incrementStatusCountForJobId : async function incrementStatusCountForJobId (jobId, status, amount) {
      // select a random shard
      const shard = parseInt (NUM_SHARDS * Math.random());
      const dsKey = datastore.key([
        JobConst.DB_KUJOMAN_JOB_EXECUTION_STATS,
        jobId + '-' + shard
      ]);

      let counters = {};
      try {
        const shard = (await datastore.get (dsKey))[0];
        if (
          (typeof(shard) === 'undefined') ||
          typeof(shard.counters) == 'undefined'
        ) {
          counters = {};
          counters[status] = 0;
        }
        else {
          counters = shard.counters;
        }

        counters[status] += amount;
      }
      catch (e) {
        console.log ("Exception:" + e);
      }

      try {
        await datastore.save ({
          key  : dsKey,
          data : { job_id : jobId, 'counters' : counters }
        })
      }
      catch (e) {
        console.log (e);
      }
    },

    // -------------------------------------------------------------------------
    // decrementStatusCountForJobId
    //
    // Decrements the status count for given job id using shards
    // -------------------------------------------------------------------------
    decrementStatusCountForJobId : async function decrementStatusCountForJobId (jobId, status, amount) {
      this.incrementStatusForJobId (jobId, status, -amount);
    },

    // -------------------------------------------------------------------------
    // getStatsByJobId
    //
    // Internally counts all shards.
    //
    // Returns the status count for a single job id.
    // -------------------------------------------------------------------------
    getStatsByJobId : async function getStatsByJobId (jobId) {
      const query = datastore.createQuery (
          JobConst.DB_KUJOMAN_JOB_EXECUTION_STATS
        ).filter ('job_id', '=', jobId);

      let jobQueryResult = (await datastore.runQuery(query))[0];

      let counters = {};
      counters[JobConst.JOB_STATUS_WAITING]    = 0;
      counters[JobConst.JOB_STATUS_RUNNING]    = 0;
      counters[JobConst.JOB_STATUS_RETRYING]   = 0;
      counters[JobConst.JOB_STATUS_STOPPED]    = 0;
      counters[JobConst.JOB_STATUS_SUCCESSFUL] = 0;
      counters[JobConst.JOB_STATUS_FAILED]     = 0;

      for (const partial of jobQueryResult) {
        for (const [key, amount] of Object.entries(partial.counters))
          counters[key] += amount;
      }

      return counters;
    }
  };
}
