// -----------------------------------------------------------------------------
// Copyright 2018 Pau Sanchez
// -----------------------------------------------------------------------------
'use strict';

module.exports = function jobs (context) {
  return {
    getAllJobs : function (req, resp) {
      resp.json ([
        {
          id : 'job-type-1',
          name : 'First Job Type',
          stats : {
            running : 3,
            waiting : 82,
            failed : 9,
            successful: 92,
          }
        },
        {
          id : 'job-type-2',
          name : 'My Second Job',
          stats : {
            running : 32,
            waiting : 19,
            failed : 0,
            successful: 21,
          }
        },
        {
          id : 'job-type-3',
          name : 'Third Job',
          stats : {
            running : 132,
            waiting : 319,
            failed : 40,
            successful: 121,
          }
        }
      ]);
    },
    getJobById : function (req, resp) {
      resp.json (
        {
          id : req.params.id,
          name : req.params.id.toUpperCase(),
          kubernetes : {
            provider : 'gcloud',
            gcloud_project : 'my-gcloud-project',
            gcloud_cluster : 'my-gke-cluster',
            max_parallel_runners : 12,
            autoscale : false
          },
          //template : ' {MY_VAR}, {NUM_I}, {NUM_J}',
          template : `apiVersion: batch/v1
kind: Job
metadata:
  name: pi-with-timeout
spec:
  backoffLimit: 5
  activeDeadlineSeconds: 100
  template:
    spec:
      containers:
      - name: print_{NUM_I}_{NUM_J}
        image: perl
        command: ["perl", "-wle", "print {NUM_I}, {NUM_J}"]
      restartPolicy: Never
`,
          template_variables : [
            {
              name : 'MY_VAR',
              type : 'date',
              range : true,
              default : '2018-01-10'
            },
            {
              name : 'NUM_I',
              type : 'integer',
              range : true,
              default : 3
            },
            {
              name : 'NUM_J',
              type : 'integer',
              range : true,
              default : 3
            },
            {
              name : 'MY_OTHER_VAR',
              type : 'string',
              default : 'this is the default value'
            }
          ],
          stats : {
            running : 3,
            waiting : 82,
            failed : 9,
            successful: 92,
          }
        }
      );
    }
  };
}