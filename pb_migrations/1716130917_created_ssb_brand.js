/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "kvtaqncyp27mj16",
    "created": "2024-05-19 15:01:57.066Z",
    "updated": "2024-05-19 15:01:57.066Z",
    "name": "ssb_brand",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "qxh9d6we",
        "name": "brandName",
        "type": "text",
        "required": false,
        "presentable": true,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "pattern": ""
        }
      }
    ],
    "indexes": [],
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
  const collection = dao.findCollectionByNameOrId("kvtaqncyp27mj16");

  return dao.deleteCollection(collection);
})
