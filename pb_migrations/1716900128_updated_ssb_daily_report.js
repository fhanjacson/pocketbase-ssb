/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("p97ymk2z87g5jfq")

  collection.options = {
    "query": "SELECT (ROW_NUMBER() OVER()) as id, DATE(saleDate) AS sale_date, SUM(saleTotalAfterDiscount) AS total_sale\nFROM ssb_sales\nGROUP BY sale_date\nORDER BY sale_date;\n"
  }

  // remove
  collection.schema.removeField("1jvxudgp")

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

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("p97ymk2z87g5jfq")

  collection.options = {
    "query": "select (ROW_NUMBER() OVER()) as id, SUM(ssb_sales.`saleTotalAfterDiscount`) as total from ssb_sales GROUP BY ssb_sales.`saleDate`"
  }

  // add
  collection.schema.addField(new SchemaField({
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
  }))

  // remove
  collection.schema.removeField("n4sjnpf8")

  // remove
  collection.schema.removeField("mejoceip")

  return dao.saveCollection(collection)
})
