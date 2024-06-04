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
            if (!(data.expand.ssb_variations_via_itemId.length > 0)) {
                return new BadRequestError("itemVariationEnabled is true but ssb_variations_via_itemId.length is not more than 0")
            }
        }
        $app.dao().runInTransaction((txDao) => {
            const existingItemForm = new RecordUpsertForm($app, existingItem)
            existingItemForm.setDao(txDao)

            existingItemForm.loadData({
                itemCode: data.itemCode,
                itemName: data.itemName,
                itemBuyPrice: data.itemVariationEnabled == false ? data.itemBuyPrice : undefined,
                itemSellPrice: data.itemVariationEnabled == false ? data.itemSellPrice : undefined,
                groupId: data.groupId,
                vendorId: data.vendorId,
                itemStock: data.itemVariationEnabled == false ? data.itemStock : undefined,
                itemVariationEnabled: data.itemVariationEnabled,
            })
            existingItemForm.submit()

            if (data.itemVariationEnabled === true) {
                if (data.expand.ssb_variations_via_itemId.length > 0) {
                    const dbVariation = txDao.findRecordsByFilter("ssb_variations", `itemId = '${data.id}'`)
                    const payloadVariationIds = data.expand.ssb_variations_via_itemId.map(variation => variation.id)

                    const dbVariationToEdit = dbVariation.filter(variation => payloadVariationIds.includes(variation.id))
                    const payloadVariationToCreate = data.expand.ssb_variations_via_itemId.filter(variation => !variation.id)
                    const dbVariationToDelete = dbVariation.filter(variation => !payloadVariationIds.includes(variation.id))

                    dbVariationToEdit.forEach(dbVariation => {
                        const payloadVariation = data.expand.ssb_variations_via_itemId.find(variation => variation.id === dbVariation.id)
                        const variationForm = new RecordUpsertForm($app, dbVariation)
                        variationForm.setDao(txDao)
                        variationForm.loadData({
                            itemId: data.id,
                            variationCode: payloadVariation.variationCode,
                            variationName: payloadVariation.variationName,
                            variationBuyPrice: payloadVariation.variationBuyPrice,
                            variationSellPrice: payloadVariation.variationSellPrice
                        })
                        variationForm.submit()
                    })

                    const variationCollection = txDao.findCollectionByNameOrId("ssb_variations")
                    payloadVariationToCreate.forEach(payloadVariation => {
                        const newVariation = new Record(variationCollection)
                        const variationForm = new RecordUpsertForm($app, newVariation)
                        variationForm.setDao(txDao)
                        variationForm.loadData({
                            itemId: data.id,
                            variationCode: payloadVariation.variationCode,
                            variationName: payloadVariation.variationName,
                            variationStock: payloadVariation.variationStock,
                            variationBuyPrice: payloadVariation.variationBuyPrice,
                            variationSellPrice: payloadVariation.variationSellPrice
                        })
                        variationForm.submit()
                    })

                    dbVariationToDelete.forEach(dbVariation => {
                        txDao.deleteRecord(dbVariation)
                    })

                    $apis.enrichRecord(c, txDao, existingItem, "groupId", "vendorId", "ssb_variations_via_itemId")
                    return c.json(200, existingItem)
                } else {
                    return new BadRequestError("itemVariationEnabled is true but ssb_variations_via_itemId.length is not more than 0")
                }
            } else {
                const existingVariationByItemId = txDao.findRecordsByFilter("ssb_variations", `itemId = '${data.id}'`)
                existingVariationByItemId.forEach(existingVariationToDelete => {
                    txDao.deleteRecord(existingVariationToDelete)
                })

                $apis.enrichRecord(c, txDao, existingItem, "groupId", "vendorId")
                return c.json(200, existingItem)
            }
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
            if (!(data.expand.ssb_variations_via_itemId.length > 0)) {
                return new BadRequestError("variation is enabled, ssb_variations_via_itemId length must be greater than 0")
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
                itemBuyPrice: data.itemVariationEnabled == false ? data.itemBuyPrice : undefined,
                itemSellPrice: data.itemVariationEnabled == false ? data.itemSellPrice : undefined,
                groupId: data.groupId,
                vendorId: data.vendorId,
                itemStock: data.itemVariationEnabled == false ? data.itemStock : undefined,
                itemVariationEnabled: data.itemVariationEnabled,
            })
            newItemForm.submit()

            if (data.itemVariationEnabled == true) {
                for (let variation of data.expand.ssb_variations_via_itemId) {
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
                }
                $apis.enrichRecord(c, txDao, newItem, "groupId", "vendorId", "ssb_variations_via_itemId")
                return c.json(200, newItem)
            } else {
                $apis.enrichRecord(c, txDao, newItem, "groupId", "vendorId")
                return c.json(200, newItem)
            }
        })
    } catch (ex) {
        console.log(ex)
        return new ApiError(500, `Error: ${ex}`)
    }
})

