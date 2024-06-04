/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("ryhiv1779z8oc3n")

  collection.indexes = [
    "CREATE UNIQUE INDEX `idx_hNGfaHk` ON `ssb_variations` (\n  `variationName`,\n  `itemId`\n)",
    "CREATE UNIQUE INDEX `idx_yhPNOeC` ON `ssb_variations` (\n  `variationCode`,\n  `itemId`\n)"
  ]

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("ryhiv1779z8oc3n")

  collection.indexes = [
    "CREATE UNIQUE INDEX `idx_hNGfaHk` ON `ssb_variations` (\n  `variationName`,\n  `itemId`\n)"
  ]

  return dao.saveCollection(collection)
})
