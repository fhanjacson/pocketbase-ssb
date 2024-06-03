/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "1583yzvkdvhfa9l",
    "created": "2024-06-03 02:38:59.904Z",
    "updated": "2024-06-03 02:38:59.904Z",
    "name": "ssb_groups",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "lfhgwhkp",
        "name": "groupName",
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
        "id": "ejbwb08z",
        "name": "groupDescription",
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
      "CREATE UNIQUE INDEX `idx_fOlk6FP` ON `ssb_groups` (`groupName`)"
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
  const collection = dao.findCollectionByNameOrId("1583yzvkdvhfa9l");

  return dao.deleteCollection(collection);
})
