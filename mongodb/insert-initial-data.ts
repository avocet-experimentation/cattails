import { EnvironmentDraft } from "@estuary/types";
import RepositoryManager from "../src/repository/RepositoryManager.js";
import cfg from "../src/envalid.js";

const defaultEnvironments: EnvironmentDraft[] = [
  {
    name: 'testing',
    defaultEnabled: false,
  },
  {
    name: 'production',
    defaultEnabled: false,
  },
  {
    name: 'staging',
    defaultEnabled: false,
  },
  {
    name: 'dev',
    defaultEnabled: true,
  }
];

const colls = new RepositoryManager(cfg.MONGO_ADMIN_URI);

for (let i = 0; i < defaultEnvironments.length; i += 1) {
  await colls.environment.create(defaultEnvironments[i]);
}

console.log('initial data inserted');
process.exit(0);