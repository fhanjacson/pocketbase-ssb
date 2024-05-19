/// <reference path="../pb_data/types.d.ts" />
routerUse($apis.activityLogger($app))

routerAdd("GET", "/custom_api/items", (c) => { return c.string(200, "hai") })

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
            $apis.enrichRecord(c, txDao, newItem, "variationId", "vendorId")
            return c.json(200, newItem)
        })
    } catch (ex) {
        console.log(ex)
        return new ApiError(500, "ERROR")
    }
})

