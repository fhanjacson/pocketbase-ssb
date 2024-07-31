/// <reference path="../pb_data/types.d.ts" />
routerUse($apis.activityLogger($app))

// CREATE NEW PURCHASE
routerAdd("POST", "/custom_api/purchases", (c) => {
    try {
        const enums = require(`${__hooks}/_enums.js`)
        const data = $apis.requestInfo(c).data
        const authRecord = c.get("authRecord")
        if (!data.vendorId) {
            return new BadRequestError("vendorId is not valid")
        }
        if (data.expand.purchaseItems_via_purchaseId.length <= 0) {
            return new BadRequestError("payloadPurchaseItem length must be greater than 0")
        }
        $app.dao().runInTransaction((txDao) => {
            const purchaseCollection = txDao.findCollectionByNameOrId("purchases")
            const newPurchase = new Record(purchaseCollection)
            const newPurchaseForm = new RecordUpsertForm($app, newPurchase)
            newPurchaseForm.setDao(txDao)
            newPurchaseForm.loadData({
                date: data.date, // user
                vendorId: data.vendorId, // user
                total: data.total, // user
                discount: data.discount, // user
                discountType: data.discountType, // user
                grandTotal: data.grandTotal, // sys
                purchaseType: data.purchaseType, // user
                creditTermDay: data.purchaseType === enums.PurchasePaymentType.Credit ? data.creditTermDay : undefined, // user
                createdBy: authRecord.id,
                updatedBy: authRecord.id
            })
            newPurchaseForm.submit()
            for (let payloadPurchaseItem of data.expand.purchaseItems_via_purchaseId) {
                if (payloadPurchaseItem.expand.itemId.hasVariation) {
                    if (!payloadPurchaseItem.expand.variationId.id) {
                        return new BadRequestError("Item Variation Enabled but no variationId")
                    }
                }

                const transactionCollection = txDao.findCollectionByNameOrId("transactions")
                const newTransaction = new Record(transactionCollection)
                const newTransactionForm = new RecordUpsertForm($app, newTransaction)
                newTransactionForm.setDao(txDao)
                newTransactionForm.loadData({
                    date: data.date,
                    itemId: payloadPurchaseItem.expand.itemId.id,
                    variationId: payloadPurchaseItem.expand.itemId.hasVariation ? payloadPurchaseItem.expand.variationId.id : undefined,
                    type: enums.TransactionType.IN,
                    subtype: enums.TransactionSubtype.PURCHASE,
                    quantity: payloadPurchaseItem.quantity + payloadPurchaseItem.bonusQuantity,
                    stock: undefined, // calculate
                    unitCost: undefined, // calculate
                    stockValue: undefined, // calculate
                    unitPrice: payloadPurchaseItem.unitPrice,
                    cashFlow: payloadPurchaseItem.quantity * payloadPurchaseItem.unitPrice,
                    remark: `ITEM PURCHASE ${payloadPurchaseItem.quantity + payloadPurchaseItem.bonusQuantity} PCS`,
                })
                newTransactionForm.submit()

                const itemPurchaseCollection = txDao.findCollectionByNameOrId("purchaseItems")
                const newPurchaseItem = new Record(itemPurchaseCollection)
                const newPurchaseItemForm = new RecordUpsertForm($app, newPurchaseItem)
                newPurchaseItemForm.setDao(txDao)

                let total = undefined

                switch (payloadPurchaseItem.discountType) {
                    case enums.DiscountDetailType.NoDiscount: { total = payloadPurchaseItem.quantity * payloadPurchaseItem.unitPrice; break; }
                    case enums.DiscountDetailType.Percent: { total = (payloadPurchaseItem.quantity * payloadPurchaseItem.unitPrice) - ((payloadPurchaseItem.quantity * payloadPurchaseItem.unitPrice) * payloadPurchaseItem.discount / 100); break; }
                    case enums.DiscountDetailType.Total: { total = (payloadPurchaseItem.quantity * payloadPurchaseItem.unitPrice) - (payloadPurchaseItem.discount); break; }
                    case enums.DiscountDetailType.Item: { total = (payloadPurchaseItem.quantity * payloadPurchaseItem.unitPrice) - (payloadPurchaseItem.quantity * payloadPurchaseItem.discount); break; }
                }

                if (total === undefined) { return new BadRequestError("Failed to calculate total") }

                newPurchaseItemForm.loadData({
                    itemId: payloadPurchaseItem.expand.itemId.id,
                    purchaseId: newPurchase.id,
                    variationId: payloadPurchaseItem.expand.itemId.hasVariation ? payloadPurchaseItem.expand.variationId.id : undefined,
                    quantity: payloadPurchaseItem.quantity,
                    bonusQuantity: payloadPurchaseItem.bonusQuantity,
                    unitPrice: payloadPurchaseItem.unitPrice,
                    discount: payloadPurchaseItem.discount,
                    discountType: payloadPurchaseItem.discountType,
                    discountAmount: payloadPurchaseItem.discountAmount,
                    total: total,
                    transactionId: newTransaction.id,
                    createdBy: authRecord.id,
                    updatedBy: authRecord.id
                })
                newPurchaseItemForm.submit()
                let newQTY = payloadPurchaseItem.quantity + payloadPurchaseItem.bonusQuantity
                if (payloadPurchaseItem.expand.itemId.hasVariation && payloadPurchaseItem.expand.variationId.id) {
                    const variationRecord = txDao.findRecordById("itemVariations", payloadPurchaseItem.expand.variationId.id)
                    const variationForm = new RecordUpsertForm($app, variationRecord)
                    variationForm.setDao(txDao)
                    variationForm.loadData({
                        buyPrice: payloadPurchaseItem.unitPrice,
                        "stock+": newQTY,
                    })
                    variationForm.submit()
                } else if (!payloadPurchaseItem.expand.itemId.hasVariation) {
                    const itemRecord = txDao.findRecordById("items", payloadPurchaseItem.expand.itemId.id)
                    const itemForm = new RecordUpsertForm($app, itemRecord)
                    itemForm.setDao(txDao)
                    itemForm.loadData({
                        buyPrice: payloadPurchaseItem.unitPrice,
                        "stock+": newQTY,
                    })
                    itemForm.submit()
                }
                const itemRecord = txDao.findRecordById("items", payloadPurchaseItem.expand.itemId.id)
                const itemForm = new RecordUpsertForm($app, itemRecord)
                itemForm.setDao(txDao)
                itemForm.loadData({
                    vendorId: data.vendorId,
                })
                itemForm.submit()
            }
            $apis.enrichRecord(c, txDao, newPurchase, "updatedBy", "createdBy", "vendorId", "purchaseItems_via_purchaseId", "purchaseItems_via_purchaseId.itemId", "purchaseItems_via_purchaseId.variationId")
            return c.json(200, newPurchase)
        })
    } catch (ex) {
        console.log(ex)
        return new ApiError(500, `Error: ${ex}`)
    }
})


// EDIT PURCHASE
routerAdd("PUT", "/custom_api/purchases", (c) => {
    try {
        const data = $apis.requestInfo(c).data
        const enums = require(`${__hooks}/_enums.js`)
        const authRecord = c.get("authRecord")
        const utils = require(`${__hooks}/function_validator.js`)
        const error = utils.validateUpdatePurchase(data)
        if (error) {
            return new BadRequestError(error)
        }

        $app.dao().runInTransaction((txDao) => {
            const existingPurchase = txDao.findRecordById("purchases", data.id)
            const editPurchaseForm = new RecordUpsertForm($app, existingPurchase)
            editPurchaseForm.setDao(txDao)
            editPurchaseForm.loadData({
                date: data.date, // user
                vendorId: data.vendorId, // user
                total: data.total, // user
                discount: data.discount, // user
                grandTotal: data.grandTotal, // sys
                purchaseType: data.purchaseType, // user
                creditTermDay: data.purchaseType === enums.PurchasePaymentType.Credit ? data.creditTermDay : 0, // use
                updatedBy: authRecord.id
            })
            editPurchaseForm.submit()

            const existingPurchaseItems = txDao.findRecordsByFilter("purchaseItems", `purchaseId = '${data.id}'`)
            const payloadPurchaseItems = data.expand.purchaseItems_via_purchaseId

            existingPurchaseItems.forEach(existingPurchaseItem => {
                txDao.deleteRecord(existingPurchaseItem)
            })

            payloadPurchaseItems.forEach(payloadPurchaseItem => {
                if (payloadPurchaseItem.hasVariation) {
                    if (!payloadPurchaseItem.expand.variationId.id) {
                        return new BadRequestError("Item Variation Enabled but no variationId")
                    }
                }

                const transactionCollection = txDao.findCollectionByNameOrId("transactions")
                const newTransaction = new Record(transactionCollection)
                const newTransactionForm = new RecordUpsertForm($app, newTransaction)
                newTransactionForm.setDao(txDao)
                newTransactionForm.loadData({
                    date: data.date,
                    itemId: payloadPurchaseItem.expand.itemId.id,
                    variationId: payloadPurchaseItem.expand.itemId.hasVariation ? payloadPurchaseItem.expand.variationId.id : undefined,
                    type: enums.TransactionType.IN,
                    subtype: enums.TransactionSubtype.PURCHASE,
                    quantity: payloadPurchaseItem.quantity + payloadPurchaseItem.bonusQuantity,
                    stock: undefined, // calculate
                    unitCost: undefined, // calculate
                    stockValue: undefined, // calculate
                    unitPrice: payloadPurchaseItem.unitPrice,
                    cashFlow: payloadPurchaseItem.quantity * payloadPurchaseItem.unitPrice,
                    remark: `ITEM PURCHASE ${payloadPurchaseItem.quantity + payloadPurchaseItem.bonusQuantity} PCS`,
                })
                newTransactionForm.submit()

                const itemPurchaseCollection = txDao.findCollectionByNameOrId("purchaseItems")
                const newPurchaseItem = new Record(itemPurchaseCollection)
                const newPurchaseItemForm = new RecordUpsertForm($app, newPurchaseItem)
                newPurchaseItemForm.setDao(txDao)

                let total = undefined
                switch (payloadPurchaseItem.discountType) {
                    case enums.DiscountDetailType.NoDiscount: { total = payloadPurchaseItem.quantity * payloadPurchaseItem.unitPrice; break; }
                    case enums.DiscountDetailType.Percent: { total = (payloadPurchaseItem.quantity * payloadPurchaseItem.unitPrice) - ((payloadPurchaseItem.quantity * payloadPurchaseItem.unitPrice) * payloadPurchaseItem.discount / 100); break; }
                    case enums.DiscountDetailType.Total: { total = (payloadPurchaseItem.quantity * payloadPurchaseItem.unitPrice) - (payloadPurchaseItem.discount); break; }
                    case enums.DiscountDetailType.Item: { total = (payloadPurchaseItem.quantity * payloadPurchaseItem.unitPrice) - (payloadPurchaseItem.quantity * payloadPurchaseItem.discount); break; }
                }

                if (total === undefined) { return new BadRequestError("Failed to calculate total") }

                newPurchaseItemForm.loadData({
                    itemId: payloadPurchaseItem.expand.itemId.id,
                    purchaseId: existingPurchase.id,
                    variationId: payloadPurchaseItem.expand.itemId.hasVariation ? payloadPurchaseItem.expand.variationId.id : undefined,
                    quantity: payloadPurchaseItem.quantity,
                    bonusQuantity: payloadPurchaseItem.bonusQuantity,
                    unitPrice: payloadPurchaseItem.unitPrice,
                    discount: payloadPurchaseItem.discount,
                    discountType: payloadPurchaseItem.discountType,
                    discountAmount: payloadPurchaseItem.discountAmount,
                    total: total,
                    transactionId: newTransaction.id,
                    createdBy: authRecord.id,
                    updatedBy: authRecord.id
                })
                newPurchaseItemForm.submit()

                let newQTY = payloadPurchaseItem.quantity + payloadPurchaseItem.bonusQuantity

                const itemRecord = txDao.findRecordById("items", payloadPurchaseItem.expand.itemId.id)
                const itemForm = new RecordUpsertForm($app, itemRecord)
                itemForm.setDao(txDao)

                if (payloadPurchaseItem.expand.itemId.hasVariation && payloadPurchaseItem.expand.variationId.id) {
                    const variationRecord = txDao.findRecordById("itemVariations", payloadPurchaseItem.expand.variationId.id)
                    const variationForm = new RecordUpsertForm($app, variationRecord)
                    variationForm.setDao(txDao)
                    variationForm.loadData({
                        "buyPrice": payloadPurchaseItem.unitPrice,
                        "stock+": newQTY,
                    })
                    variationForm.submit()
                } else if (!payloadPurchaseItem.expand.itemId.hasVariation) {
                    itemForm.setDao(txDao)
                    itemForm.loadData({
                        "buyPrice": payloadPurchaseItem.unitPrice,
                        "stock+": newQTY,
                    })
                }
                itemForm.loadData({
                    "vendorId": data.vendorId,
                })
                itemForm.submit()
            })

            existingPurchaseItems.forEach(existingPurchaseItem => {
                const existingTransaction = txDao.findRecordById("transactions", existingPurchaseItem.getString("transactionId"))
                const existingQuantity = existingPurchaseItem.getInt("quantity") + existingPurchaseItem.getInt("bonusQuantity")

                const existingVariationId = existingPurchaseItem.getString("variationId")

                if (existingVariationId && existingVariationId.length > 1) {
                    const variationRecord = txDao.findRecordById("itemVariations", existingPurchaseItem.getString("variationId"))
                    const variationForm = new RecordUpsertForm($app, variationRecord)
                    variationForm.setDao(txDao)
                    variationForm.loadData({
                        "stock-": existingQuantity,
                    })
                    variationForm.submit()
                } else if (!existingVariationId) {
                    const itemRecord = txDao.findRecordById("items", existingPurchaseItem.getString("itemId"))
                    const itemForm = new RecordUpsertForm($app, itemRecord)
                    itemForm.setDao(txDao)
                    itemForm.loadData({
                        "stock-": existingQuantity,
                    })
                    itemForm.submit()
                }
                txDao.deleteRecord(existingTransaction)
            })

            $apis.enrichRecord(c, txDao, existingPurchase, "vendorId", "purchaseItems_via_purchaseId", "purchaseItems_via_purchaseId.itemId", "purchaseItems_via_purchaseId.variationId")
            return c.json(200, existingPurchase)
        })

    } catch (ex) {
        console.log(ex)
        return new ApiError(500, `Error: ${ex}`)
    }
})


routerAdd("DELETE", "/custom_api/purchases/:purchaseId", (c) => {
    try {
        let purchaseId = c.pathParam("purchaseId")
        $app.dao().runInTransaction((txDao) => {
            const existingPurchase = txDao.findRecordById("purchases", purchaseId)
            const existingPurchaseItems = txDao.findRecordsByFilter("purchaseItems", `purchaseId = '${purchaseId}'`)
            existingPurchaseItems.forEach(purchaseItem => {
                const existingQuantity = purchaseItem.getInt("quantity") + purchaseItem.getInt("bonusQuantity")
                const existingVariationId = purchaseItem.getString("variationId")

                if (existingVariationId && existingVariationId.length > 1) {
                    const variationRecord = txDao.findRecordById("itemVariations", purchaseItem.getString("variationId"))
                    const variationForm = new RecordUpsertForm($app, variationRecord)
                    variationForm.setDao(txDao)
                    variationForm.loadData({
                        "stock-": existingQuantity,
                    })
                    variationForm.submit()
                } else if (!existingVariationId) {
                    const itemRecord = txDao.findRecordById("items", purchaseItem.getString("itemId"))
                    const itemForm = new RecordUpsertForm($app, itemRecord)
                    itemForm.setDao(txDao)
                    itemForm.loadData({
                        "stock-": existingQuantity,
                    })
                    itemForm.submit()
                }

                txDao.deleteRecord(purchaseItem)

                const existingTransaction = txDao.findRecordById("transactions", purchaseItem.getString("transactionId"))
                txDao.deleteRecord(existingTransaction)
            })
            txDao.deleteRecord(existingPurchase)
            return c.string(200, "true")
        })
    } catch (ex) {
        console.log(ex)
        return new ApiError(500, `Error: ${ex}`)
    }
})