# kujoman (end of life)

kujoman stands for Kubernetes Job Manager.

**IMPORTANT: this project is not actively developed anymore**
I started this project to explore the possibilities of using kubernetes as a generic job manager. It does have some interesting features in the user interface to expand jobs, etc... but probably a little bit outdated nowadays. I won't be maintaining this project anymore. Feel free to fork and expand on it (keeping the same or a compatible license) if you want to expand on it.

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

## Development notes

Launch local datastore emulator for development:

```sh
  $ gcloud beta emulators datastore start --no-store-on-disk
```
