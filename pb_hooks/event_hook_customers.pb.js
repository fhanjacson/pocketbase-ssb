/// <reference path="../pb_data/types.d.ts" />

onRecordBeforeCreateRequest((e) => {
    e.record.set("name", e.record.getString("name").toUpperCase())
    const authRecord = e.httpContext.get("authRecord")
    if (authRecord) {
        e.record.set("createdBy", authRecord.id)
        e.record.set("updatedBy", authRecord.id)
    }
}, "customers")

onRecordBeforeUpdateRequest((e) => {
    e.record.set("name", e.record.getString("name").toUpperCase())
    const authRecord = e.httpContext.get("authRecord")
    if (authRecord) {
        e.record.set("updatedBy", authRecord.id)
    }
}, "customers")

onRecordBeforeDeleteRequest((e) => {
    const saleList = $app.dao().findRecordsByFilter("sales", `customerId='${e.record.id}'`, undefined, 1)
    if (saleList && saleList.length > 0) {
        throw new BadRequestError("Customer is still in use by sales. Cannot be deleted.")  
    }
}, "customers")