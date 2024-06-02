/// <reference path="../pb_data/types.d.ts" />
routerUse($apis.activityLogger($app))

routerAdd("PUT", "/custom_api/items", (c) => {
    try {
        const data = $apis.requestInfo(c).data
        const existingItem = $app.dao().findRecordById("ssb_items", data.id)
        if (!existingItem) {
            return new BadRequestError("No Existing Record with specified Id found")

        }
        if (data.itemVariationEnabled) {
            if (!(data.expand.variationId.length > 0)) {
                return new BadRequestError("itemVariationEnabled is true but variationId.length is not more than 0")
            }
        }
        $app.dao().runInTransaction((txDao) => {
            const existingItemForm = new RecordUpsertForm($app, existingItem)
            existingItemForm.setDao(txDao)

            if (data.itemVariationEnabled && data.expand.variationId.length > 0) {
                var upsertedVariationId = []

                const variationCollection = txDao.findCollectionByNameOrId("ssb_variations")
                for (let variation of data.expand.variationId) {
                    if (variation.id) { //existing variation in db
                        const existingVariation = txDao.findRecordById("ssb_variations", variation.id)
                        if (!existingVariation) {
                            throw "Variation id is defined, but cant be found on db"
                        }
                        const existingVariationForm = new RecordUpsertForm($app, existingVariation)
                        existingVariationForm.setDao(txDao)
                        existingVariationForm.loadData({
                            itemId: data.id,
                            variationCode: variation.variationCode,
                            variationName: variation.variationName,
                            // variationStock: variation.variationStock // cannot be edited
                            variationBuyPrice: variation.variationBuyPrice,
                            variationSellPrice: variation.variationSellPrice
                        })
                        existingVariationForm.submit()
                        upsertedVariationId.push(existingVariation.id)
                    } else {
                        const newVariation = new Record(variationCollection)
                        const newVariationForm = new RecordUpsertForm($app, newVariation)
                        newVariationForm.setDao(txDao)
                        newVariationForm.loadData({
                            itemId: data.id,
                            variationCode: variation.variationCode,
                            variationName: variation.variationName,
                            // variationStock: variation.variationStock // cannot be edited
                            variationBuyPrice: variation.variationBuyPrice,
                            variationSellPrice: variation.variationSellPrice
                        })
                        newVariationForm.submit()
                        upsertedVariationId.push(newVariation.id)
                    }
                }

                existingItemForm.loadData({
                    itemCode: data.itemCode,
                    itemName: data.itemName,
                    itemBuyPrice: undefined,
                    itemSellPrice: undefined,
                    groupId: data.groupId,
                    vendorId: data.vendorId,
                    itemStock: undefined,
                    itemVariationEnabled: data.itemVariationEnabled, // cannot be edited for now
                    variationId: upsertedVariationId
                })
            }

            if (!data.itemVariationEnabled) {
                const findExistingVariation = txDao.findRecordsByFilter("ssb_variations", `itemId = '${data.id}'`)
                if (findExistingVariation && findExistingVariation.length > 0) {
                    for (let findExistingVariationItem of findExistingVariation) {
                        txDao.deleteRecord(findExistingVariationItem)
                    }
                }

                existingItemForm.loadData({
                    itemCode: data.itemCode,
                    itemName: data.itemName,
                    itemBuyPrice: data.itemBuyPrice,
                    itemSellPrice: data.itemSellPrice,
                    groupId: data.groupId,
                    vendorId: data.vendorId,
                    // itemStock: data.itemStock, // cannot be edited
                    itemVariationEnabled: data.itemVariationEnabled, // cannot be edited for now
                    variationId: upsertedVariationId
                })
            }

            existingItemForm.submit()


            $apis.enrichRecord(c, txDao, existingItem, "variationId", "groupId", "vendorId")
            return c.json(200, existingItem)

        })
    } catch (ex) {
        console.log(ex)
        return new ApiError(500, `Error: ${ex}`)
    }
})

routerAdd("POST", "/custom_api/items", (c) => {
    try {
        const data = $apis.requestInfo(c).data
        if (data.itemName == "" || data.itemName.length < 3) {
            return new BadRequestError("itemName is not valid")
        }
        if (data.itemStock < 0) {
            return new BadRequestError("itemStock cant be less than 0")
        }
        if (data.itemVariationEnabled) {
            if (!(data.expand.variationId.length > 0)) {
                return new BadRequestError("variation is enabled, variationId length must be greater than 0")
            }
        }

        // TODO: VALIDATION

        $app.dao().runInTransaction((txDao) => {
            const itemCollection = txDao.findCollectionByNameOrId("ssb_items")
            const newItem = new Record(itemCollection)
            const newItemForm = new RecordUpsertForm($app, newItem)
            newItemForm.setDao(txDao)
            newItemForm.loadData({
                itemCode: data.itemCode,
                itemName: data.itemName,
                itemBuyPrice: data.itemBuyPrice,
                itemSellPrice: data.itemSellPrice,
                groupId: data.groupId,
                vendorId: data.vendorId,
                itemStock: data.itemStock,
                itemVariationEnabled: data.itemVariationEnabled,
                variationId: undefined
            })
            newItemForm.submit()

            if (data.itemVariationEnabled) {
                var insertedVariationId = []
                for (let variation of data.expand.variationId) {
                    // TODO: VALIDATION
                    const variationCollection = txDao.findCollectionByNameOrId("ssb_variations")
                    const newVariation = new Record(variationCollection)
                    const newVariationForm = new RecordUpsertForm($app, newVariation)
                    newVariationForm.setDao(txDao)
                    newVariationForm.loadData({
                        itemId: newItem.id,
                        variationCode: variation.variationCode,
                        variationName: variation.variationName,
                        variationBuyPrice: variation.variationBuyPrice,
                        variationSellPrice: variation.variationSellPrice,
                        variationStock: variation.variationStock
                    })
                    newVariationForm.submit()
                    insertedVariationId.push(newVariation.id)
                }
                newItemForm.loadData({
                    itemBuyPrice: undefined,
                    itemSellPrice: undefined,
                    itemStock: undefined,
                    variationId: insertedVariationId
                })
                newItemForm.submit()
            }
            $apis.enrichRecord(c, txDao, newItem, "variationId", "groupId", "vendorId")
            return c.json(200, newItem)
        })
    } catch (ex) {
        console.log(ex)
        return new ApiError(500, `Error: ${ex}`)
    }
})

