/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("1583yzvkdvhfa9l")

  // add
  collection.schema.addField(new SchemaField({
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
  }))

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("1583yzvkdvhfa9l")

  // remove
  collection.schema.removeField("ejbwb08z")

  return dao.saveCollection(collection)
})
