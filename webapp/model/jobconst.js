

module.exports = {
  DB_KUJOMAN_JOB_TEMPLATE : 'kujoman_job_template',
  DB_KUJOMAN_JOB_EXECUTION : 'kujoman_job_execution',
  DB_KUJOMAN_JOB_EXECUTION_STATS : 'kujoman_job_execution_stats',

  JOB_STATUS_WAITING    : 'waiting',    // waiting to run
  JOB_STATUS_RUNNING    : 'running',    // running already
  JOB_STATUS_STOPPED    : 'stopped',    // should not run (yet)
  JOB_STATUS_SUCCESSFUL : 'successful', // completed successfully
  JOB_STATUS_FAILED     : 'failed',     // failed!

  JOB_TYPE_KUBERNETES   : 'k8s',
};