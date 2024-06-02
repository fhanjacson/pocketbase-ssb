/// <reference path="../pb_data/types.d.ts" />

onRecordBeforeCreateRequest((e) => {
    e.record.set("groupName", e.record.getString("groupName").toUpperCase())
}, "ssb_groups")

onRecordBeforeDeleteRequest((e) => {
    const itemList = $app.dao().findRecordsByFilter("ssb_items", `groupId='${e.record.id}'`)
    if (itemList && itemList.length > 0) {
        throw new BadRequestError("Group is still in use by ssb_items. Cannot be deleted.")  
    }
}, "ssb_groups")