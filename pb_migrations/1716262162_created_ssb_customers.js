/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "685p99vdc6pd0ox",
    "created": "2024-05-21 03:29:22.624Z",
    "updated": "2024-05-21 03:29:22.624Z",
    "name": "ssb_customers",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "w11xxq2x",
        "name": "customerName",
        "type": "text",
        "required": true,
        "presentable": true,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "5a3tlltc",
        "name": "customerContact",
        "type": "text",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "z6s4cveb",
        "name": "customerAddress",
        "type": "text",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "pattern": ""
        }
      }
    ],
    "indexes": [
      "CREATE UNIQUE INDEX `idx_HnvH7eC` ON `ssb_customers` (`customerName`)"
    ],
    "listRule": "",
    "viewRule": "",
    "createRule": "",
    "updateRule": "",
    "deleteRule": "",
    "options": {}
  });

  return Dao(db).saveCollection(collection);
}, (db) => {
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("685p99vdc6pd0ox");

  return dao.deleteCollection(collection);
})
