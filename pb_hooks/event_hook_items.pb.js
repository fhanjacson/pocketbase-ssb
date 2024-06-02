/// <reference path="../pb_data/types.d.ts" />

onRecordBeforeCreateRequest((e) => {
    e.record.set("itemCode", e.record.getString("itemCode").toUpperCase())
    e.record.set("itemName", e.record.getString("itemName").toUpperCase())
}, "ssb_items")

onRecordBeforeDeleteRequest((e) => {
    const itemSaleList = $app.dao().findRecordsByFilter("ssb_item_sale", `itemId='${e.record.id}'`)
    if (itemSaleList && itemSaleList.length > 0) {
        throw new BadRequestError("Item is still in use by ssb_item_sale. Cannot be deleted.")  
    }
}, "ssb_items")