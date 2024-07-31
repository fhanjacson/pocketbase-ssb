/// <reference path="../pb_data/types.d.ts" />

onRecordBeforeCreateRequest((e) => {
    e.record.set("name", e.record.getString("name").toUpperCase())
    const authRecord = e.httpContext.get("authRecord")
    if (authRecord) {
        e.record.set("createdBy", authRecord.id)
        e.record.set("updatedBy", authRecord.id)
    }
}, "itemGroups")

onRecordBeforeUpdateRequest((e) => {
    e.record.set("name", e.record.getString("name").toUpperCase())
    const authRecord = e.httpContext.get("authRecord")
    if (authRecord) {
        e.record.set("updatedBy", authRecord.id)
    }
}, "itemGroups")

onRecordBeforeDeleteRequest((e) => {
    const itemList = $app.dao().findRecordsByFilter("items", `groupId='${e.record.id}'`)
    if (itemList && itemList.length > 0) {
        throw new BadRequestError("Group is still in use by items. Cannot be deleted.")  
    }
}, "itemGroups")