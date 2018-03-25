# kujoman

kujoman stands for Kubernetes Job Manager.

## Introduction

kujoman provides a web interface to easily manage the whole lifecycle of a job,
including creating jobs, scheduling jobs and logging job results.

While kubernetes part is generic and should work on any kubernetes provider,
the server database and messaging are tightly coupled to Google Cloud. GCloud
Datastore is used as a NoSQL database, and Google Pub/Sub is used as a message
queue. Those two components are well isolated and it would be fairly easy
to provide other implementations, like for example mongodb/mysql/posgresql/...
as the database (both NoSQL or Relational will be fine) and ActiveMQ/RabbitMQ/Celery...
as a queue.

NOTE: GCloud Storage can also be used for logging results.

