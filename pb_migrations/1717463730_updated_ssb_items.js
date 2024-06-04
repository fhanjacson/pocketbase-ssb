/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("wz7iyqkntws2e0v")

  collection.indexes = [
    "CREATE UNIQUE INDEX `idx_dcruCl7` ON `ssb_items` (`itemName`)",
    "CREATE UNIQUE INDEX `idx_Tjuz3JM` ON `ssb_items` (`itemCode`)"
  ]

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("wz7iyqkntws2e0v")

  collection.indexes = [
    "CREATE UNIQUE INDEX `idx_dcruCl7` ON `ssb_items` (`itemName`)"
  ]

  return dao.saveCollection(collection)
})
