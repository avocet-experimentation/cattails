import { EstuaryMongoTypes, DraftRecord } from '@estuary/types';
import MongoRepository from '../src/repository/MongoRepository.js';
import RepositoryManager from '../src/repository/RepositoryManager.js';
import cfg from '../src/envalid.js';

export const repos = new RepositoryManager(cfg.MONGO_ADMIN_URI);

export const insertArray = async <T extends EstuaryMongoTypes>(
  arr: DraftRecord<T>[],
  collection: MongoRepository<T>,
) => {
  const promises: Promise<string>[] = [];
  for (let i = 0; i < arr.length; i += 1) {
    promises.push(collection.create(arr[i]));
  }
  await Promise.all(promises);
};
