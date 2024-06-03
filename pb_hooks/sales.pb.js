/// <reference path="../pb_data/types.d.ts" />
routerUse($apis.activityLogger($app))

routerAdd("POST", "/custom_api/sales", (c) => {
    try {
        const data = $apis.requestInfo(c).data
        if (!data.expand.ssb_item_sale_via_saleId) {
            return new BadRequestError("itemSaleId is not valid")
        }
        if (data.expand.ssb_item_sale_via_saleId.length <= 0) {
            return new BadRequestError("itemSaleId length must be greater than 0")
        }
        $app.dao().runInTransaction((txDao) => {
            const salesCollection = txDao.findCollectionByNameOrId("ssb_sales")
            const newSale = new Record(salesCollection)
            const newSaleForm = new RecordUpsertForm($app, newSale)
            newSaleForm.setDao(txDao)
            newSaleForm.loadData({
                "customerId": data.customerId, // user
                "saleDate": data.saleDate, // user
                "saleDeliveryContact": data.saleDeliveryContact, // user
                "saleDeliveryAddress": data.saleDeliveryAddress, // user
                "saleTotalAmount": data.saleTotalAmount, // user
                "saleDiscountAmount": data.saleDiscountAmount, // user
                "saleTotalAfterDiscount": data.saleTotalAfterDiscount, // sys
                "salePaymentAmount": data.salePaymentAmount, // user
                "salePaymentType": "CASH", // user
            })
            newSaleForm.submit()
            var insertedItemSaleId = []
            for (let itemSale of data.expand.ssb_item_sale_via_saleId) {
                if (itemSale.expand.itemId.itemVariationEnabled) {
                    if (!itemSale.expand.variationId.id) {
                        return new BadRequestError("Item Variation Enabled but no variationId")
                    }
                }
                const itemSaleCollection = txDao.findCollectionByNameOrId("ssb_item_sale")
                const newItemSale = new Record(itemSaleCollection)
                const newItemSaleForm = new RecordUpsertForm($app, newItemSale)
                newItemSaleForm.setDao(txDao)
                newItemSaleForm.loadData({
                    "itemId": itemSale.expand.itemId.id, // user
                    "saleId": newSale.id, // sys
                    "variationId": itemSale.expand.itemId.itemVariationEnabled ? itemSale.expand.variationId.id : undefined,
                    "itemSaleQuantity": itemSale.itemSaleQuantity, // user
                    "itemSalePrice": itemSale.itemSalePrice, // user(price per item)
                    "itemSaleDiscount": itemSale.itemSaleDiscount, // user(totalDiscount = discount * quantity)
                    "itemSalePriceAfterDiscount": itemSale.itemSalePriceAfterDiscount, // sys(itemSalePrice * itemSaleQuantity - itemSaleDiscount)
                    "variationJSON": itemSale.expand.itemId.itemVariationEnabled ? JSON.stringify(itemSale.expand.variationId) : undefined,
                })
                newItemSaleForm.submit()
                insertedItemSaleId.push(newItemSale.id)
                if (itemSale.expand.itemId.itemVariationEnabled && itemSale.expand.variationId.id) {
                    const variationRecord = txDao.findRecordById("ssb_variations", itemSale.expand.variationId.id)
                    const variationForm = new RecordUpsertForm($app, variationRecord)
                    variationForm.setDao(txDao)
                    variationForm.loadData({
                        "variationStock-": itemSale.itemSaleQuantity
                    })
                    variationForm.submit()
                } else if (!itemSale.expand.itemId.itemVariationEnabled) {
                    const itemRecord = txDao.findRecordById("ssb_items", itemSale.expand.itemId.id)
                    const itemForm = new RecordUpsertForm($app, itemRecord)
                    itemForm.setDao(txDao)
                    itemForm.loadData({
                        "itemStock-": itemSale.itemSaleQuantity
                    })
                    itemForm.submit()
                }
            }
            $apis.enrichRecord(c, txDao, newSale, "customerId", "ssb_item_sale_via_saleId", "ssb_item_sale_via_saleId.itemId")
            return c.json(200, newSale)
        })
    } catch (ex) {
        console.log(ex)
        return new ApiError(500, `Error: ${ex}`)
    }
})

