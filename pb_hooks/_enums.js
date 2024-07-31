/// <reference path="../pb_data/types.d.ts" />

module.exports = {
    TransactionType: {
        IN: "IN",
        OUT: "OUT"
    },

    TransactionSubtype: {
        OPNAME: "OPNAME",
        SALE: "SALE",
        PURCHASE: "PURCHASE",
        SALE_RETURN: "SALE_RETURN",
        PURCHASE_RETURN: "PURCHASE_RETURN"
    },

    DiscountDetailType: {
        NoDiscount: "NO_DISCOUNT",
        Percent: "PERCENT",
        Total: "TOTAL",
        Item: "ITEM"
    },

    DiscountGlobalType: {
        NoDiscount: "NO_DISCOUNT",
        Percent: "PERCENT",
        Amount: "Amount"
    },

    PurchasePaymentType: {
        Cash: "CASH",
        Credit: "CREDIT"
    },

    SalePaymentType: {
        Cash: "CASH",
        DebitCard: "DEBIT_CARD",
        CreditCard: "CREDIT_CARD",
        BankTransfer_BCA: "BANK_TRANSFER_BCA",
        BankTransfer_BRI: "BANK_TRANSFER_BRI",
        BankTransfer_BNI: "BANK_TRANSFER_BNI",
        BankTransfer_MANDIRI: "BANK_TRANSFER_MANDIRI"
    }
}