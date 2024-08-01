/// <reference path="../pb_data/types.d.ts" />

onRecordBeforeCreateRequest((e) => {
    e.record.set("name", e.record.getString("name").toUpperCase())
    const authRecord = e.httpContext.get("authRecord")
    if (authRecord) {
        e.record.set("createdBy", authRecord.id)
        e.record.set("updatedBy", authRecord.id)
    }
}, "vendors")

onRecordBeforeUpdateRequest((e) => {
    e.record.set("name", e.record.getString("name").toUpperCase())
    const authRecord = e.httpContext.get("authRecord")
    if (authRecord) {
        e.record.set("updatedBy", authRecord.id)
    }
}, "vendors")

onRecordBeforeDeleteRequest((e) => {
    const itemList = $app.dao().findRecordsByFilter("items", `vendorId='${e.record.id}'`)
    if (itemList && itemList.length > 0) {
        throw new BadRequestError("Vendor is still in use by items. Cannot be deleted.")  
    }
}, "vendors")