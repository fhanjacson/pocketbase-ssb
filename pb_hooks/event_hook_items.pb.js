/// <reference path="../pb_data/types.d.ts" />

onRecordBeforeDeleteRequest((e) => {
    const saleItemList = $app.dao().findRecordsByFilter("saleItems", `itemId='${e.record.id}'`)
    if (saleItemList && saleItemList.length > 0) {
        throw new BadRequestError("Item is still in use by saleItems. Cannot be deleted.")  
    }
}, "items")