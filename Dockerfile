FROM node:9

RUN apt-get update && apt-get upgrade -y

# install google cloud command line tools
RUN curl https://sdk.cloud.google.com | bash > /dev/null 2>&1
RUN ln -s /root/google-cloud-sdk/bin/gcloud /usr/bin/gcloud
RUN ln -s /root/google-cloud-sdk/bin/gsutil /usr/bin/gsutil
RUN gcloud config set disable_usage_reporting true
RUN gcloud components install kubectl
RUN ln -s /root/google-cloud-sdk/bin/kubectl /usr/bin/kubectl

COPY webapp /home/node/app

WORKDIR /home/node/app
# RUN rm -rf node_modules

# RUN curl https://repo1.maven.org/maven2/org/flywaydb/flyway-commandline/5.0.7/flyway-commandline-5.0.7.tar.gz

RUN npm install

#WORKDIR /usr/src/app

