/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "ln1p323ma0mpykd",
    "created": "2024-05-21 03:29:22.624Z",
    "updated": "2024-05-21 03:29:22.624Z",
    "name": "ssb_vendors",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "6udzibfa",
        "name": "vendorName",
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
        "id": "srf8bbzu",
        "name": "vendorContact",
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
        "id": "td7mqy4l",
        "name": "vendorAddress",
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
      "CREATE UNIQUE INDEX `idx_39qpEao` ON `ssb_vendors` (`vendorName`)"
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
  const collection = dao.findCollectionByNameOrId("ln1p323ma0mpykd");

  return dao.deleteCollection(collection);
})
