/// <reference path="../pb_data/types.d.ts" />

module.exports = {
    validateCreateItem: (data) => {
        if (data.name.length < 2 || data.name.length > 64) {
            return "name is not valid"
        }
        
        if (data.hasVariation === true) {
            if (!(data.expand.itemVariations_via_itemId.length > 0)) {
                return "variation is enabled, itemVariations_via_itemId length must be greater than 0"
            }
        }
        
        if (data.hasVariation === false) {
            if (data.stock < 0) {
                return "stock cant be less than 0"
            }
            if (!(data.buyPrice > 1)) {
                return "buyPrice is not more than 1"
            }
            if (data.sellPrice < data.buyPrice) {
                return "sellPrice is less than buyPrice"
            }
        }
        return undefined
    },
    validateUpdatePurchase: (data) => {
        if (!data.id) return "ID is not valid"
        if (!data.date) return "Date is not valid"
        if (!data.vendorId) return "Vendor is not valid"
        if (!data.purchaseType) return "Purchase Type is not valid"

        if (!data.expand?.purchaseItems_via_purchaseId) return "Purchase Items not valid"
        if (!(data.expand?.purchaseItems_via_purchaseId.length > 0)) return "Purchase Items not more than 0"
        return undefined
    }
}