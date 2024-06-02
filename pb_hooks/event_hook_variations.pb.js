/// <reference path="../pb_data/types.d.ts" />

onRecordBeforeCreateRequest((e) => {
    e.record.set("variationCode", e.record.getString("variationCode").toUpperCase())
    e.record.set("variationName", e.record.getString("variationName").toUpperCase())
}, "ssb_variations")

onRecordBeforeDeleteRequest((e) => {
    let result = arrayOf(new DynamicModel({
        "id": "",
        "customerId": "",
        "saleDate": "",
        "saleDeliveryContact": "",
        "saleDeliveryAddress": "",
        "created": "",
        "updated": ""
    }));

    $app.dao().db()
        .select("ssb_sales.id", "ssb_sales.created")
        .from("ssb_sales")
        .innerJoin("ssb_item_sale", $dbx.exp("ssb_sales.id = ssb_item_sale.saleId"))
        .where($dbx.exp(`ssb_item_sale.variationId = '${e.record.id}'`))
        .all(result)

    if (result && result.length > 0) {
        throw new BadRequestError("Variation is still in use by an item in item_sales. Cannot be deleted.");
    }
}, "ssb_variations")
