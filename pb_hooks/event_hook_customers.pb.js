/// <reference path="../pb_data/types.d.ts" />

onRecordBeforeCreateRequest((e) => {
    e.record.set("customerName", e.record.getString("customerName").toUpperCase())
}, "ssb_customers")

onRecordBeforeDeleteRequest((e) => {
    const saleList = $app.dao().findRecordsByFilter("ssb_sales", `customerId='${e.record.id}'`)
    if (saleList && saleList.length > 0) {
        throw new BadRequestError("Customer is still in use by ssb_sales. Cannot be deleted.")  
    }
}, "ssb_customers")