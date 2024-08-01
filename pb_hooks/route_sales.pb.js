/// <reference path="../pb_data/types.d.ts" />
routerUse($apis.activityLogger($app))

routerAdd("POST", "/custom_api/sales", (c) => {
    try {
        const enums = require(`${__hooks}/_enums.js`)
        const authRecord = c.get("authRecord")
        if (!authRecord) { return new BadRequestError("Auth is required.")}
        const data = $apis.requestInfo(c).data
        if (!data.customerId) { return new BadRequestError("customerId is not valid") }
        if (!data.expand.saleItems_via_saleId) { return new BadRequestError("saleItemId is not valid") }
        if (data.expand.saleItems_via_saleId.length <= 0) { return new BadRequestError("saleItemId length must be greater than 0") }

        $app.dao().runInTransaction((txDao) => {
            const salesCollection = txDao.findCollectionByNameOrId("sales")
            const newSale = new Record(salesCollection)
            const newSaleForm = new RecordUpsertForm($app, newSale)
            newSaleForm.setDao(txDao)
            newSaleForm.loadData({
                date: data.date, // user
                customerId: data.customerId, // user
                hasDelivery: data.hasDelivery, // user
                deliveryContact: data.hasDelivery ? data.deliveryContact : undefined, // user
                deliveryAddress: data.hasDelivery ? data.deliveryAddress : undefined, // user
                total: data.total, // user
                discount: data.discount, // user
                discountType: data.discountType, // user
                grandTotal: data.grandTotal, // sys
                paymentAmount: data.paymentAmount, // user
                paymentType: data.paymentType, // user
                createdBy: authRecord.id,
                updatedBy: authRecord.id
            })
            newSaleForm.submit()

            for (let saleItem of data.expand.saleItems_via_saleId) {
                if (saleItem.expand.itemId.hasVariation) {
                    if (!saleItem.expand.variationId.id) {
                        return new BadRequestError("Item Variation Enabled but no variationId")
                    }
                }

                const transactionCollection = txDao.findCollectionByNameOrId("transactions")
                const newTransaction = new Record(transactionCollection)
                const newTransactionForm = new RecordUpsertForm($app, newTransaction)
                newTransactionForm.setDao(txDao)
                newTransactionForm.loadData({
                    date: data.date,
                    itemId: saleItem.expand.itemId.id,
                    variationId: saleItem.expand.itemId.hasVariation ? saleItem.expand.variationId.id : undefined,
                    type: enums.TransactionType.OUT,
                    subtype: enums.TransactionSubtype.SALE,
                    quantity: saleItem.quantity,
                    stock: undefined, // calculate
                    unitCost: undefined, // calculate
                    stockValue: undefined, // calculate
                    unitPrice: saleItem.unitPrice,
                    cashFlow: saleItem.quantity * saleItem.unitPrice,
                    remark: `ITEM SALE ${saleItem.quantity} PCS`,
                })
                newTransactionForm.submit()

                const saleItemCollection = txDao.findCollectionByNameOrId("saleItems")
                const newsaleItem = new Record(saleItemCollection)
                const newsaleItemForm = new RecordUpsertForm($app, newsaleItem)
                newsaleItemForm.setDao(txDao)

                let total = undefined
                switch (saleItem.discountType) {
                    case enums.DiscountDetailType.NoDiscount: { total = saleItem.quantity * saleItem.unitPrice; break; }
                    case enums.DiscountDetailType.Percent: { total = (saleItem.quantity * saleItem.unitPrice) - ((saleItem.quantity * saleItem.unitPrice) * saleItem.discount / 100); break; }
                    case enums.DiscountDetailType.Total: { total = (saleItem.quantity * saleItem.unitPrice) - (saleItem.discount); break; }
                    case enums.DiscountDetailType.Item: { total = (saleItem.quantity * saleItem.unitPrice) - (saleItem.quantity * saleItem.discount); break; }
                }
                if (total === undefined) { return new BadRequestError("Failed to calculate total") }

                newsaleItemForm.loadData({
                    itemId: saleItem.expand.itemId.id, // user
                    saleId: newSale.id, // sys
                    variationId: saleItem.expand.itemId.hasVariation ? saleItem.expand.variationId.id : undefined,
                    quantity: saleItem.quantity, // user
                    unitPrice: saleItem.unitPrice, // user(price per item)
                    discount: saleItem.discount, // user(totalDiscount = discount * quantity)
                    discountType: saleItem.discountType, // user(totalDiscount = discount * quantity)
                    total: saleItem.total, // sys(unitPrice * quantity - discount)
                    transactionId: newTransaction.id,
                    createdBy: authRecord.id,
                    updatedBy: authRecord.id
                })
                newsaleItemForm.submit()

                // REDUCE STOCK
                if (saleItem.expand.itemId.hasVariation && saleItem.expand.variationId.id) {
                    const variationRecord = txDao.findRecordById("itemVariations", saleItem.expand.variationId.id)
                    const variationForm = new RecordUpsertForm($app, variationRecord)
                    variationForm.setDao(txDao)
                    variationForm.loadData({
                        "stock-": saleItem.quantity
                    })
                    variationForm.submit()
                } else if (!saleItem.expand.itemId.hasVariation) {
                    const itemRecord = txDao.findRecordById("items", saleItem.expand.itemId.id)
                    const itemForm = new RecordUpsertForm($app, itemRecord)
                    itemForm.setDao(txDao)
                    itemForm.loadData({
                        "stock-": saleItem.quantity
                    })
                    itemForm.submit()
                }
            }
            $apis.enrichRecord(c, txDao, newSale, "updatedBy", "createdBy",  "customerId", "saleItems_via_saleId", "saleItems_via_saleId.itemId", "saleItems_via_saleId.variationId")
            return c.json(200, newSale)
        })
    } catch (ex) {
        console.log(ex)
        return new ApiError(500, `Error: ${ex}`)
    }
})


routerAdd("PUT", "/custom_api/sales", (c) => {
    try {
        const enums = require(`${__hooks}/_enums.js`)
        const authRecord = c.get("authRecord")
        if (!authRecord) { return new BadRequestError("Auth is required.")}
        const data = $apis.requestInfo(c).data
        if (!data.customerId) { return new BadRequestError("customerId is not valid") }
        if (!data.expand.saleItems_via_saleId) { return new BadRequestError("saleItemId is not valid") }
        if (data.expand.saleItems_via_saleId.length <= 0) { return new BadRequestError("saleItemId length must be greater than 0") }

        $app.dao().runInTransaction((txDao) => {
            const existingSale = txDao.findRecordById("sales", data.id)
            const editSaleForm = new RecordUpsertForm($app, existingSale)
            editSaleForm.setDao(txDao)
            editSaleForm.loadData({
                date: data.date, // user
                customerId: data.customerId, // user
                hasDelivery: data.hasDelivery, // user
                deliveryContact: data.hasDelivery ? data.deliveryContact : undefined, // user
                deliveryAddress: data.hasDelivery ? data.deliveryAddress : undefined, // user
                total: data.total, // user
                discount: data.discount, // user
                discountType: data.discountType, // user
                grandTotal: data.grandTotal, // sys
                paymentAmount: data.paymentAmount, // user
                paymentType: data.paymentType, // user,
                updatedBy: authRecord.id
            })
            editSaleForm.submit()

            const existingSaleItems = txDao.findRecordsByFilter("saleItems", `saleId = '${data.id}'`)
            const payloadSaleItems = data.expand.saleItems_via_saleId

            existingSaleItems.forEach(exisintgSaleItem => {
                txDao.deleteRecord(exisintgSaleItem)
            })

            payloadSaleItems.forEach(payloadSaleItem => {
                if (payloadSaleItem.expand.itemId.hasVariation) {
                    if (!payloadSaleItem.expand.variationId.id) {
                        return new BadRequestError("Item Variation Enabled but no variationId")
                    }
                }

                const transactionCollection = txDao.findCollectionByNameOrId("transactions")
                const newTransaction = new Record(transactionCollection)
                const newTransactionForm = new RecordUpsertForm($app, newTransaction)
                newTransactionForm.setDao(txDao)
                newTransactionForm.loadData({
                    date: data.date,
                    itemId: payloadSaleItem.expand.itemId.id,
                    variationId: payloadSaleItem.expand.itemId.hasVariation ? payloadSaleItem.expand.variationId.id : undefined,
                    type: enums.TransactionType.OUT,
                    subtype: enums.TransactionSubtype.SALE,
                    quantity: payloadSaleItem.quantity,
                    stock: undefined, // calculate
                    unitCost: undefined, // calculate
                    stockValue: undefined, // calculate
                    unitPrice: payloadSaleItem.unitPrice,
                    cashFlow: payloadSaleItem.quantity * payloadSaleItem.unitPrice,
                    remark: `ITEM SALE ${payloadSaleItem.quantity} PCS`,
                })
                newTransactionForm.submit()

                const saleItemCollection = txDao.findCollectionByNameOrId("saleItems")
                const newsaleItem = new Record(saleItemCollection)
                const newsaleItemForm = new RecordUpsertForm($app, newsaleItem)
                newsaleItemForm.setDao(txDao)

                let total = undefined
                switch (payloadSaleItem.discountType) {
                    case enums.DiscountDetailType.NoDiscount: { total = payloadSaleItem.quantity * payloadSaleItem.unitPrice; break; }
                    case enums.DiscountDetailType.Percent: { total = (payloadSaleItem.quantity * payloadSaleItem.unitPrice) - ((payloadSaleItem.quantity * payloadSaleItem.unitPrice) * payloadSaleItem.discount / 100); break; }
                    case enums.DiscountDetailType.Total: { total = (payloadSaleItem.quantity * payloadSaleItem.unitPrice) - (payloadSaleItem.discount); break; }
                    case enums.DiscountDetailType.Item: { total = (payloadSaleItem.quantity * payloadSaleItem.unitPrice) - (payloadSaleItem.quantity * payloadSaleItem.discount); break; }
                }
                if (total === undefined) { return new BadRequestError("Failed to calculate total") }

                newsaleItemForm.loadData({
                    itemId: payloadSaleItem.expand.itemId.id, // user
                    saleId: existingSale.id, // sys
                    variationId: payloadSaleItem.expand.itemId.hasVariation ? payloadSaleItem.expand.variationId.id : undefined,
                    quantity: payloadSaleItem.quantity, // user
                    unitPrice: payloadSaleItem.unitPrice, // user(price per item)
                    discount: payloadSaleItem.discount, // user(totalDiscount = discount * quantity)
                    discountType: payloadSaleItem.discountType, // user(totalDiscount = discount * quantity)
                    total: payloadSaleItem.total, // sys(unitPrice * quantity - discount)
                    transactionId: newTransaction.id,
                    createdBy: authRecord.id,
                    updatedBy: authRecord.id
                })
                newsaleItemForm.submit()

                // REDUCE STOCK
                if (payloadSaleItem.expand.itemId.hasVariation && payloadSaleItem.expand.variationId.id) {
                    const variationRecord = txDao.findRecordById("itemVariations", payloadSaleItem.expand.variationId.id)
                    const variationForm = new RecordUpsertForm($app, variationRecord)
                    variationForm.setDao(txDao)
                    variationForm.loadData({
                        "stock-": payloadSaleItem.quantity
                    })
                    variationForm.submit()
                } else if (!payloadSaleItem.expand.itemId.hasVariation) {
                    const itemRecord = txDao.findRecordById("items", payloadSaleItem.expand.itemId.id)
                    const itemForm = new RecordUpsertForm($app, itemRecord)
                    itemForm.setDao(txDao)
                    itemForm.loadData({
                        "stock-": payloadSaleItem.quantity
                    })
                    itemForm.submit()
                }

            })

            existingSaleItems.forEach(existingSaleItem => {
                const existingTransaction = txDao.findRecordById("transactions", existingSaleItem.getString("transactionId"))
                const existingQuantity = existingSaleItem.getInt("quantity")

                const existingVariationId = existingSaleItem.getString("variationId")

                if (existingVariationId && existingVariationId.length > 1) {
                    const variationRecord = txDao.findRecordById("itemVariations", existingVariationId)
                    const variationForm = new RecordUpsertForm($app, variationRecord)
                    variationForm.setDao(txDao)
                    variationForm.loadData({
                        "stock+": existingQuantity,
                    })
                    variationForm.submit()
                } else if (!existingVariationId) {
                    const itemRecord = txDao.findRecordById("items", existingSaleItem.getString("itemId"))
                    const itemForm = new RecordUpsertForm($app, itemRecord)
                    itemForm.setDao(txDao)
                    itemForm.loadData({
                        "stock+": existingQuantity,
                    })
                    itemForm.submit()
                }
                txDao.deleteRecord(existingTransaction)
            })

            $apis.enrichRecord(c, txDao, existingSale, "customerId", "saleItems_via_saleId", "saleItems_via_saleId.itemId", "saleItems_via_saleId.variationId")
            return c.json(200, existingSale)
        })

    } catch (ex) {
        console.log(ex)
        return new ApiError(500, `Error: ${ex}`)
    }
})


routerAdd("DELETE", "/custom_api/sales/:saleId", (c) => {
    try {
        let saleId = c.pathParam("saleId")
        $app.dao().runInTransaction((txDao) => {
            const existingSale = txDao.findRecordById("sales", saleId)
            const existingSaleItems = txDao.findRecordsByFilter("saleItems", `saleId = '${saleId}'`)
            existingSaleItems.forEach(saleItem => {
                const existingQuantity = saleItem.getInt("quantity")
                const existingVariationId = saleItem.getString("variationId")

                if (existingVariationId && existingVariationId.length > 1) {
                    const variationRecord = txDao.findRecordById("itemVariations", existingVariationId)
                    const variationForm = new RecordUpsertForm($app, variationRecord)
                    variationForm.setDao(txDao)
                    variationForm.loadData({
                        "stock+": existingQuantity,
                    })
                    variationForm.submit()
                } else if (!existingVariationId) {
                    const itemRecord = txDao.findRecordById("items", purchaseItem.getString("itemId"))
                    const itemForm = new RecordUpsertForm($app, itemRecord)
                    itemForm.setDao(txDao)
                    itemForm.loadData({
                        "stock+": existingQuantity,
                    })
                    itemForm.submit()
                }

                txDao.deleteRecord(saleItem)

                const existingTransaction = txDao.findRecordById("transactions", saleItem.getString("transactionId"))
                txDao.deleteRecord(existingTransaction)
            })
            txDao.deleteRecord(existingSale)
            return c.string(200, "true")
        })
    } catch (ex) {
        console.log(ex)
        return new ApiError(500, `Error: ${ex}`)
    }
})