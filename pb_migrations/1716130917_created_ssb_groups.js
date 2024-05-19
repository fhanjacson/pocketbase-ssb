/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "1583yzvkdvhfa9l",
    "created": "2024-05-19 15:01:57.066Z",
    "updated": "2024-05-19 15:01:57.066Z",
    "name": "ssb_groups",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "lfhgwhkp",
        "name": "groupName",
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
  const collection = dao.findCollectionByNameOrId("1583yzvkdvhfa9l");

  return dao.deleteCollection(collection);
})
