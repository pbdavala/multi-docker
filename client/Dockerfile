# Prod Dockerfile for client
FROM node:alpine

#work dir setup in the container. Will be created if does not exist
WORKDIR '/app'

# Copy only package.json from current workdir "client" to the current workdir inside container.
COPY ./package.json ./

# Install some dependencies
RUN npm install

# Copy NOW everything from current workdir "client" to the current workdir inside container.
#Straight copy because this is production build. We don't need volumes in docker-compose.
COPY . .         

# Default RUN Command. The build folder will be in /app/build in production container.
# build is defined in package.json   "build": "react-scripts build"
RUN npm run build


# FROM is the delimiter for the previous block. Start of run phase.
#Specifying base image for nginx and expose default port 3000 for AWS Elastic Beanstalk to map.
FROM nginx
EXPOSE 3000

# Copy the local default.conf file to nginx container default.conf
COPY ./nginx/default.conf /etc/nginx/conf.d/default.conf

#Copy the build folder from build phase location /app/build into the run container /usr/...
# We removed the tag builder and referred to the first FROM as 0.
COPY --from=0 /app/build /usr/share/nginx/html

#Default command to start nginx in a nginx container is automatically taken care of. No need to start nginx here