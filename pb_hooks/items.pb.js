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
                    const variationCollection = txDao.findCollectionByNameOrId("ssb_variations")
                    const existingVariationByItemId = txDao.findRecordsByFilter("ssb_variations", `itemId = '${data.id}'`)

                    const variationIdFromDatabase = new Set(existingVariationByItemId.map(variation => variation.id))
                    const variationIdFromPayload = new Set(data.expand.ssb_variations_via_itemId.map(variation => variation.id))

                    // const variationToEdit = variationIdFromDatabase.intersection(variationIdFromPayload)
                    // const variationToCreate = variationIdFromPayload.difference(variationIdFromDatabase)
                    // const variationToDelete = variationIdFromDatabase.difference(variationIdFromPayload)

                    const variationToEdit = [...variationIdFromDatabase].filter(id => variationIdFromPayload.has(id))
                    const variationToCreate = [...variationIdFromPayload].filter(id => !variationIdFromDatabase.has(id))
                    const variationToDelete = [...variationIdFromDatabase].filter(id => !variationIdFromPayload.has(id))

                    variationToEdit.forEach(variationToEditId => {
                        const existingVariation = existingVariationByItemId.find(variation => variation.id === variationToEditId)
                        const variationData = data.expand.ssb_variations_via_itemId.find(variation => variation.id === variationToEditId)
                        const variationForm = new RecordUpsertForm($app, existingVariation)
                        variationForm.setDao(txDao)
                        variationForm.loadData({
                            itemId: data.id,
                            variationCode: variationData.variationCode,
                            variationName: variationData.variationName,
                            variationBuyPrice: variationData.variationBuyPrice,
                            variationSellPrice: variationData.variationSellPrice
                        })
                        variationForm.submit()
                    })

                    variationToCreate.forEach(variationToCreateId => {
                        const variationData = data.expand.ssb_variations_via_itemId.find(variation => variation.id === variationToCreateId)
                        const newVariation = new Record(variationCollection)
                        const variationForm = new RecordUpsertForm($app, newVariation)
                        variationForm.setDao(txDao)
                        variationForm.loadData({
                            itemId: data.id,
                            variationCode: variationData.variationCode,
                            variationName: variationData.variationName,
                            variationStock: variationData.variationStock,
                            variationBuyPrice: variationData.variationBuyPrice,
                            variationSellPrice: variationData.variationSellPrice
                        })
                        variationForm.submit()
                    })

                    variationToDelete.forEach(variationToDeleteId => {
                        const variationData = existingVariationByItemId.find(variation => variation.id === variationToDeleteId)
                        txDao.deleteRecord(variationData)
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

