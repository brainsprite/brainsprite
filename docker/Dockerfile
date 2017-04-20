FROM ubuntu:17.04
MAINTAINER Pierre Bellec <pierre.bellec@criugm.qc.ca>

# Update repository list
RUN apt-get update
RUN apt-get dist-upgrade -y

# Install dependencies available through apt-get
RUN apt-get install -y curl
RUN curl -sL https://deb.nodesource.com/setup_7.x | bash -
RUN apt-get install -y nodejs
RUN npm install phantomjs
RUN npm install casperjs
RUN apt-get install -y python
RUN apt-get install -y libfontconfig
# Command for build
# docker build -t="simexp/brainsprite-dev:0.2" .
# Command for running
# docker run -i -t --rm --name brainsprite -v $HOME:$HOME simexp/brainsprite-dev:0.2 /bin/bash -c "export HOME=$HOME; export PATH=$PATH:/node_modules/phantomjs/bin/:/node_modules/casperjs/bin/; cd $HOME; exec bash"
