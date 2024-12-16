#!/bin/bash

if [ $# -lt 1 ]; then
  echo "Error: pass a relative or absolute path to the cattails root directory"
  exit 1
fi

until [ "$(docker inspect -f {{.State.Health.Status}} avocet-mongodb)" = "healthy" ]; do
  sleep 1;
done;
# Connect to the MongoDB container without authentication
docker exec avocet-mongodb mongosh --quiet \
  --eval 'use admin' \
  --eval 'db.auth({ user: "root", pwd: "1234" })' \
  --eval 'use avocet' \
  --eval 'db.dropDatabase()' \
  --eval 'db.dropAllUsers()' \
  --eval 'db.createUser({ user: "avocet-admin", pwd: "1234", roles: [{ role: "readWrite", db: "avocet" }] })' \
  --eval 'db.createUser({ user: "avocet-api", pwd: "1234", roles: [{ role: "read", db: "avocet" }] })' \
  --eval 'show users' \
  --eval 'use avocet_testing' \
  --eval 'db.dropAllUsers()' \
  --eval 'db.createUser({ user: "avocet-testing", pwd: "1234", roles: [{ role: "readWrite", db: "avocet_testing" }] })' \
  --eval 'show users'

# Command to manually login to Docker mongoDB as authorized user:
# mongosh --username root --password 1234 --authenticationDatabase admin --quiet


# Create indexes and insert initial documents
ROOT=$(dirname $(realpath "$1"))
(cd $ROOT && \
npx tsx ./mongodb/initialize-mongo-indexes.ts && \
npx tsx ./mongodb/insert-initial-data.ts)

echo "Mongo setup complete"