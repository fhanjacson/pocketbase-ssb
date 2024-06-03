/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "p97ymk2z87g5jfq",
    "created": "2024-06-03 02:38:59.904Z",
    "updated": "2024-06-03 02:38:59.909Z",
    "name": "ssb_daily_report",
    "type": "view",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "dy9iuv8o",
        "name": "saleDate",
        "type": "json",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "maxSize": 1
        }
      },
      {
        "system": false,
        "id": "rip0aa69",
        "name": "totalSalePriceAfterDiscount",
        "type": "json",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "maxSize": 1
        }
      },
      {
        "system": false,
        "id": "ohhmdmoq",
        "name": "totalItemBuyPrice",
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
      "query": "SELECT\n    (ROW_NUMBER() OVER()) as id,\n    DATE(s.saleDate) AS saleDate,\n    SUM(si.itemSalePriceAfterDiscount) AS totalSalePriceAfterDiscount,\n    SUM(si.itemSaleQuantity * i.itemBuyPrice) AS totalItemBuyPrice\nFROM\n    ssb_sales s\n    JOIN ssb_item_sale si ON s.id = si.saleId\n    JOIN ssb_items i ON si.itemId = i.id\nGROUP BY\n    DATE(s.saleDate);\n"
    }
  });

  return Dao(db).saveCollection(collection);
}, (db) => {
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("p97ymk2z87g5jfq");

  return dao.deleteCollection(collection);
})
