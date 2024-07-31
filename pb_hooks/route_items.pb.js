/// <reference path="../pb_data/types.d.ts" />
routerUse($apis.activityLogger($app))

routerAdd("POST", "/custom_api/items", (c) => {
    try {
        const utils = require(`${__hooks}/function_validator.js`)
        const enums = require(`${__hooks}/_enums.js`)
        const data = $apis.requestInfo(c).data
        const authRecord = c.get("authRecord")

        const returnValue = utils.validateCreateItem(data)
        if (returnValue) {
            return new BadRequestError(returnValue)
        }

        $app.dao().runInTransaction((txDao) => {
            const itemCollection = txDao.findCollectionByNameOrId("items")
            const newItem = new Record(itemCollection)
            const newItemForm = new RecordUpsertForm($app, newItem)
            newItemForm.setDao(txDao)
            newItemForm.loadData({
                code: data.code.toUpperCase(),
                name: data.name.toUpperCase(),
                buyPrice: data.hasVariation === false ? data.buyPrice : undefined,
                sellPrice: data.hasVariation === false ? data.sellPrice : undefined,
                groupId: data.groupId,
                vendorId: data.vendorId,
                stock: data.hasVariation === false ? data.stock : undefined,
                hasVariation: data.hasVariation,
                createdBy: authRecord.id,
                updatedBy: authRecord.id
            })
            newItemForm.submit()

            if (data.hasVariation == true) {
                for (let variation of data.expand.itemVariations_via_itemId) {
                    // TODO: VALIDATION
                    const variationCollection = txDao.findCollectionByNameOrId("itemVariations")
                    const newVariation = new Record(variationCollection)
                    const newVariationForm = new RecordUpsertForm($app, newVariation)
                    newVariationForm.setDao(txDao)
                    newVariationForm.loadData({
                        itemId: newItem.id,
                        code: variation.code.toUpperCase(),
                        name: variation.name.toUpperCase(),
                        buyPrice: variation.buyPrice,
                        sellPrice: variation.sellPrice,
                        stock: variation.stock,
                        createdBy: authRecord.id,
                        updatedBy: authRecord.id
                    })
                    newVariationForm.submit()

                    if (variation.stock > 0) {
                        const transactionCollection = txDao.findCollectionByNameOrId("transactions")
                        const newTransaction = new Record(transactionCollection)
                        const newTransactionForm = new RecordUpsertForm($app, newTransaction)
                        newTransactionForm.setDao(txDao)
                        newTransactionForm.loadData({
                            date: new Date(),
                            itemId: newItem.id,
                            variationId: newVariation.id,
                            type: enums.TransactionType.IN,
                            subtype: enums.TransactionSubtype.OPNAME,
                            quantity: variation.stock,
                            stock: variation.stock,
                            unitCost: variation.buyPrice,
                            stockValue: variation.stock * variation.buyPrice,
                            unitPrice: variation.buyPrice,
                            cashFlow: 0,
                            remark: "INITIAL STOCK",
                        })
                        newTransactionForm.submit()

                        const opnameCollection = txDao.findCollectionByNameOrId("opnames")
                        const newOpname = new Record(opnameCollection)
                        const newOpnameForm = new RecordUpsertForm($app, newOpname)
                        newOpnameForm.setDao(txDao)
                        newOpnameForm.loadData({
                            itemId: newItem.id,
                            variationId: newVariation.id,
                            type: enums.TransactionType.IN,
                            quantity: variation.stock,
                            transactionId: newTransaction.id,
                            createdBy: authRecord.id,
                            updatedBy: authRecord.id
                        })
                        newOpnameForm.submit()
                    }
                }
            } else if (data.hasVariation == false) {

                if (data.stock > 0) {
                    const transactionCollection = txDao.findCollectionByNameOrId("transactions")
                    const newTransaction = new Record(transactionCollection)
                    const newTransactionForm = new RecordUpsertForm($app, newTransaction)
                    newTransactionForm.setDao(txDao)
                    newTransactionForm.loadData({
                        date: new Date(),
                        itemId: newItem.id,
                        variationId: undefined,
                        type: enums.TransactionType.IN,
                        subtype: enums.TransactionSubtype.OPNAME,
                        quantity: data.stock,
                        stock: data.stock,
                        unitCost: data.buyPrice,
                        stockValue: data.stock * data.buyPrice,
                        unitPrice: data.buyPrice,
                        cashFlow: 0,
                        remark: "INITIAL STOCK",
                    })
                    newTransactionForm.submit()

                    const opnameCollection = txDao.findCollectionByNameOrId("opnames")
                    const newOpname = new Record(opnameCollection)
                    const newOpnameForm = new RecordUpsertForm($app, newOpname)
                    newOpnameForm.setDao(txDao)
                    newOpnameForm.loadData({
                        itemId: newItem.id,
                        variationId: undefined,
                        type: enums.TransactionType.IN,
                        quantity: data.stock,
                        transactionId: newTransaction.id,
                        createdBy: authRecord.id,
                        updatedBy: authRecord.id
                    })
                    newOpnameForm.submit()
                }
            }
            $apis.enrichRecord(c, txDao, newItem, "groupId", "vendorId", "itemVariations_via_itemId")
            return c.json(200, newItem)
        })
    } catch (ex) {
        console.log(ex)
        return new ApiError(500, `Error: ${ex}`)
    }
})

routerAdd("PUT", "/custom_api/items", (c) => {
    try {
        const data = $apis.requestInfo(c).data
        const existingItem = $app.dao().findRecordById("items", data.id)
        if (!existingItem) {
            return new BadRequestError("No Existing Record with specified Id found")
        }
        if (data.hasVariation) {
            if (!(data.expand.itemVariations_via_itemId.length > 0)) {
                return new BadRequestError("hasVariation is true but itemVariations_via_itemId.length is not more than 0")
            }
        }
        $app.dao().runInTransaction((txDao) => {
            const existingItemForm = new RecordUpsertForm($app, existingItem)
            existingItemForm.setDao(txDao)

            existingItemForm.loadData({
                code: data.code,
                name: data.name,
                // buyPrice: data.hasVariation == false ? data.buyPrice : undefined, user should not edit buy price
                sellPrice: data.hasVariation == false ? data.sellPrice : undefined,
                groupId: data.groupId,
                vendorId: data.vendorId,
                stock: data.hasVariation == false ? data.stock : undefined,
                hasVariation: data.hasVariation,
                updatedBy: authRecord.id
            })
            existingItemForm.submit()

            if (data.hasVariation === true) {
                if (data.expand.itemVariations_via_itemId.length > 0) {
                    const dbVariation = txDao.findRecordsByFilter("itemVariations", `itemId = '${data.id}'`)
                    const payloadVariationIds = data.expand.itemVariations_via_itemId.map(variation => variation.id)

                    const dbVariationToEdit = dbVariation.filter(variation => payloadVariationIds.includes(variation.id))
                    const payloadVariationToCreate = data.expand.itemVariations_via_itemId.filter(variation => !variation.id)
                    const dbVariationToDelete = dbVariation.filter(variation => !payloadVariationIds.includes(variation.id))

                    dbVariationToEdit.forEach(dbVariation => {
                        const payloadVariation = data.expand.itemVariations_via_itemId.find(variation => variation.id === dbVariation.id)
                        const variationForm = new RecordUpsertForm($app, dbVariation)
                        variationForm.setDao(txDao)
                        variationForm.loadData({
                            itemId: data.id,
                            code: payloadVariation.code.toUpperCase(),
                            name: payloadVariation.name.toUpperCase(),
                            // buyPrice: payloadVariation.buyPrice, user should not edit buy price
                            sellPrice: payloadVariation.sellPrice,
                            updatedBy: authRecord.id
                        })
                        variationForm.submit()
                    })

                    const variationCollection = txDao.findCollectionByNameOrId("itemVariations")
                    payloadVariationToCreate.forEach(payloadVariation => {
                        const newVariation = new Record(variationCollection)
                        const variationForm = new RecordUpsertForm($app, newVariation)
                        variationForm.setDao(txDao)
                        variationForm.loadData({
                            itemId: data.id,
                            code: payloadVariation.code,
                            name: payloadVariation.name,
                            stock: payloadVariation.stock,
                            buyPrice: payloadVariation.buyPrice,
                            sellPrice: payloadVariation.sellPrice,
                            createdBy: authRecord.id,
                            updatedBy: authRecord.id
                        })
                        variationForm.submit()
                    })

                    dbVariationToDelete.forEach(dbVariation => {
                        txDao.deleteRecord(dbVariation)
                    })

                    $apis.enrichRecord(c, txDao, existingItem, "groupId", "vendorId", "itemVariations_via_itemId")
                    return c.json(200, existingItem)
                } else {
                    return new BadRequestError("hasVariation is true but itemVariations_via_itemId.length is not more than 0")
                }
            } else {
                const existingVariationByItemId = txDao.findRecordsByFilter("itemVariations", `itemId = '${data.id}'`)
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
