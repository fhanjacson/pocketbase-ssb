/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("hg7fztvdntklo47")

  // update
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "5wt2mnnz",
    "name": "customerId",
    "type": "relation",
    "required": true,
    "presentable": false,
    "unique": false,
    "options": {
      "collectionId": "685p99vdc6pd0ox",
      "cascadeDelete": false,
      "minSelect": null,
      "maxSelect": 1,
      "displayFields": null
    }
  }))

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("hg7fztvdntklo47")

  // update
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "5wt2mnnz",
    "name": "customerId",
    "type": "relation",
    "required": false,
    "presentable": false,
    "unique": false,
    "options": {
      "collectionId": "685p99vdc6pd0ox",
      "cascadeDelete": false,
      "minSelect": null,
      "maxSelect": 1,
      "displayFields": null
    }
  }))

  return dao.saveCollection(collection)
})
