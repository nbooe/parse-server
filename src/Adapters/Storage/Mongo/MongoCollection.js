let mongodb = require('mongodb');
let Collection = mongodb.Collection;

export default class MongoCollection {
  _mongoCollection:Collection;

  constructor(mongoCollection:Collection) {
    this._mongoCollection = mongoCollection;
  }

  // Does a find with "smart indexing".
  // Currently this just means, if it needs a geoindex and there is
  // none, then build the geoindex.
  // This could be improved a lot but it's not clear if that's a good
  // idea. Or even if this behavior is a good idea.
  find(query, { skip, limit, sort, keys } = {}) {
    return this._rawFind(query, { skip, limit, sort, keys })
      .catch(error => {
        throw error;
      });
  }

  _rawFind(query, { skip, limit, sort, keys } = {}) {
    let findOperation = this._mongoCollection
      .find(query, { skip, limit, sort })

    if (keys) {
      findOperation = findOperation.project(keys);
    }

    findOperation = findOperation.maxTimeMS(10000);

    return findOperation.toArray();
  }

  count(query, { skip, limit, sort, maxTimeMS } = {}) {
    let countOperation = this._mongoCollection.count(query, { skip, limit, sort, maxTimeMS });

    return countOperation;
  }

  insertOne(object) {
    return this._mongoCollection.insertOne(object);
  }

  // Atomically updates data in the database for a single (first) object that matched the query
  // If there is nothing that matches the query - does insert
  // Postgres Note: `INSERT ... ON CONFLICT UPDATE` that is available since 9.5.
  upsertOne(query, update) {
    return this._mongoCollection.update(query, update, { upsert: true })
  }

  updateOne(query, update) {
    return this._mongoCollection.updateOne(query, update);
  }

  updateMany(query, update) {
    return this._mongoCollection.updateMany(query, update);
  }

  deleteOne(query) {
    return this._mongoCollection.deleteOne(query);
  }

  deleteMany(query) {
    return this._mongoCollection.deleteMany(query);
  }

  _ensureSparseUniqueIndexInBackground(indexRequest) {
    return new Promise((resolve, reject) => {
      this._mongoCollection.ensureIndex(indexRequest, { unique: true, background: true, sparse: true }, (error, indexName) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  drop() {
    return this._mongoCollection.drop();
  }
}
