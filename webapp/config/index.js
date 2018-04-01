'use strict';

// TODO: load configuration from the environment vars
module.exports = {
  staticDir : 'static',
  port : 9000,
  ssl: {
    enabled: false
  },
  cloud : {
    provider : 'gcloud',
    gcloud : {
      project : process.env.GCLOUD_PROJECT || 'my-project',
      gke_cluster : process.env.GCLOUD_GKE_CLUSTER || 'my-cluster'
    },
    kubernetes : {
      autoscale_nodes : false,
      min_nodes : 1,
      max_nodes : 12
    }
  }
};