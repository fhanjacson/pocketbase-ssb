/// <reference path="../pb_data/types.d.ts" />

module.exports = {
    createNewTransaction: (dao, transaction) => {
        if (!dao) {
            dao = $app.dao()
        }

        console.log("createNewTransaction")

        const transactionCollection = dao.findCollectionByNameOrId("transactions")
        const newTransaction = new Record(transactionCollection)
        const newTransactionForm = new RecordUpsertForm($app, newTransaction)
        newTransactionForm.setDao(dao)
        newTransactionForm.loadData({
            date: transaction.date,
            itemId: transaction.itemId,
            variationId: transaction.variationId,
            type: transaction.type,
            subtype: transaction.subtype,
            quantity: transaction.quantity,
            stock: transaction.stock,
            unitCost: transaction.unitCost,
            stockValue: transaction.stock * transaction.unitCost,
            unitPrice: transaction.unitPrice,
            cashFlow: transaction.cashFlow,
            remark: transaction.remark,
        })
        newTransactionForm.submit()
    }
}