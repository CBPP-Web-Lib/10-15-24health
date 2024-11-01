FROM node:latest

WORKDIR /opt/project

RUN apt-get update 
RUN apt-get install gdal-bin -y

RUN yarn global add webpack --verbose
RUN yarn global add webpack-cli --verbose

ENTRYPOINT webpack