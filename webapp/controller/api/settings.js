// -----------------------------------------------------------------------------
// Copyright 2018 Pau Sanchez
// -----------------------------------------------------------------------------
'use strict';

module.exports = function jobs (context) {
  return {
    getSettings : function (req, resp) {
      // TODO: provider, gcloud_project, ... should be passed as ENV variables
      //       at the beginning
      resp.json ({
        kubernetes : {
          provider           : context.config.cloud.provider,
          gcloud_project     : context.config.cloud.gcloud.project,
          gcloud_gke_cluster : context.config.cloud.gcloud.gke_cluster,
          autoscale_nodes    : context.config.cloud.kubernetes.autoscale_nodes,
          min_nodes          : context.config.cloud.kubernetes.min_nodes,
          max_nodes          : context.config.cloud.kubernetes.max_nodes
        }
      });
    }
  };
}

