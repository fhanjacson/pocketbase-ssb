/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("p97ymk2z87g5jfq")

  collection.options = {
    "query": "SELECT\n    (ROW_NUMBER() OVER()) as id,\n    DATE(s.saleDate) AS saleDate,\n    SUM(si.itemSalePriceAfterDiscount) AS totalSalePriceAfterDiscount,\n    SUM(si.itemSaleQuantity * i.itemBuyPrice) AS totalItemBuyPrice\nFROM\n    ssb_sales s\n    JOIN ssb_item_sale si ON s.id = si.saleId\n    JOIN ssb_items i ON si.itemId = i.id\nGROUP BY\n    DATE(s.saleDate);\n"
  }

  // remove
  collection.schema.removeField("n4sjnpf8")

  // remove
  collection.schema.removeField("mejoceip")

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "ysuryejt",
    "name": "saleDate",
    "type": "json",
    "required": false,
    "presentable": false,
    "unique": false,
    "options": {
      "maxSize": 1
    }
  }))

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "z7rq8zsn",
    "name": "totalSalePriceAfterDiscount",
    "type": "json",
    "required": false,
    "presentable": false,
    "unique": false,
    "options": {
      "maxSize": 1
    }
  }))

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "tqycrpfu",
    "name": "totalItemBuyPrice",
    "type": "json",
    "required": false,
    "presentable": false,
    "unique": false,
    "options": {
      "maxSize": 1
    }
  }))

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("p97ymk2z87g5jfq")

  collection.options = {
    "query": "SELECT (ROW_NUMBER() OVER()) as id, DATE(saleDate) AS sale_date, SUM(saleTotalAfterDiscount) AS total_sale\nFROM ssb_sales\nGROUP BY sale_date\nORDER BY sale_date;\n"
  }

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "n4sjnpf8",
    "name": "sale_date",
    "type": "json",
    "required": false,
    "presentable": false,
    "unique": false,
    "options": {
      "maxSize": 1
    }
  }))

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "mejoceip",
    "name": "total_sale",
    "type": "json",
    "required": false,
    "presentable": false,
    "unique": false,
    "options": {
      "maxSize": 1
    }
  }))

  // remove
  collection.schema.removeField("ysuryejt")

  // remove
  collection.schema.removeField("z7rq8zsn")

  // remove
  collection.schema.removeField("tqycrpfu")

  return dao.saveCollection(collection)
})
