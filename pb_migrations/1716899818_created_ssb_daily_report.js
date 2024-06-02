/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "p97ymk2z87g5jfq",
    "created": "2024-05-28 12:36:58.995Z",
    "updated": "2024-05-28 12:36:58.995Z",
    "name": "ssb_daily_report",
    "type": "view",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "1jvxudgp",
        "name": "total",
        "type": "json",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "maxSize": 1
        }
      }
    ],
    "indexes": [],
    "listRule": null,
    "viewRule": null,
    "createRule": null,
    "updateRule": null,
    "deleteRule": null,
    "options": {
      "query": "select (ROW_NUMBER() OVER()) as id, SUM(ssb_sales.`saleTotalAfterDiscount`) as total from ssb_sales GROUP BY ssb_sales.`saleDate`"
    }
  });

  return Dao(db).saveCollection(collection);
}, (db) => {
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("p97ymk2z87g5jfq");

  return dao.deleteCollection(collection);
})
