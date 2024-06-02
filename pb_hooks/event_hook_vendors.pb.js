/// <reference path="../pb_data/types.d.ts" />

onRecordBeforeCreateRequest((e) => {
    e.record.set("vendorName", e.record.getString("vendorName").toUpperCase())
}, "ssb_vendors")

onRecordBeforeDeleteRequest((e) => {
    const itemList = $app.dao().findRecordsByFilter("ssb_items", `vendorId='${e.record.id}'`)
    if (itemList && itemList.length > 0) {
        throw new BadRequestError("Vendor is still in use by ssb_items. Cannot be deleted.")  
    }
}, "ssb_vendors")