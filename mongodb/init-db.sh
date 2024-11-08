#!/bin/bash
until [ "$(docker inspect -f {{.State.Health.Status}} estuary-mongodb)" = "healthy" ]; do
  sleep 1;
done;
# Connect to the MongoDB container without authentication
docker exec -it estuary-mongodb mongosh --quiet \
  --eval 'use admin' \
  --eval 'db.auth({ user: "root", pwd: "1234" })' \
  --eval 'use estuary' \
  --eval 'db.dropAllUsers()' \
  --eval 'db.createUser({ user: "estuary-admin", pwd: "1234", roles: [{ role: "readWrite", db: "estuary" }] })' \
  --eval 'db.createUser({ user: "estuary-api", pwd: "1234", roles: [{ role: "read", db: "estuary" }] })' \
  --eval 'show users' \
  --eval 'use estuary_testing' \
  --eval 'db.dropAllUsers()' \
  --eval 'db.createUser({ user: "estuary-testing", pwd: "1234", roles: [{ role: "readWrite", db: "estuary_testing" }] })' \
  --eval 'show users'

# Command to manually login to Docker mongoDB as authorized user:
# mongosh --username root --password 1234 --authenticationDatabase admin --quiet