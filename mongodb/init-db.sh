#!/bin/bash

# Connect to the MongoDB container without authentication
docker exec -it mongodb-fflags mongosh --quiet \
  --eval 'use admin' \
  --eval 'db.auth({ user: "root", pwd: "1234" })' \
  --eval 'use fflags' \
  --eval 'db.createUser({ user: "fflags-user", pwd: "1234", roles: [{ role: "readWrite", db: "fflags" }] })' \
  --eval 'show users'

# Command to manually login to Docker mongoDB as authorized user:
# mongosh --username root --password 1234 --authenticationDatabase admin --quiet