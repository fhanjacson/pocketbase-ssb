/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "x6od0330181pfs8",
    "created": "2024-05-19 15:01:57.067Z",
    "updated": "2024-05-19 15:01:57.067Z",
    "name": "ssb_settings",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "kmhubj6y",
        "name": "settingKey",
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
        "id": "e9xgxesn",
        "name": "settingValue",
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
    "indexes": [],
    "listRule": null,
    "viewRule": null,
    "createRule": null,
    "updateRule": null,
    "deleteRule": null,
    "options": {}
  });

  return Dao(db).saveCollection(collection);
}, (db) => {
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("x6od0330181pfs8");

  return dao.deleteCollection(collection);
})
