onAfterBootstrap((e) => {
    console.log("onAfterBootstrap")
    const systemUser = arrayOf(new DynamicModel({ "id": "" }))
    const genericResult = arrayOf(new DynamicModel({ "id": "" }))

    try {
        $app.dao().runInTransaction(txDao => {
            txDao.db().newQuery("SELECT * FROM users WHERE username = 'system' LIMIT 1").all(systemUser)
            console.log(JSON.stringify(systemUser))
            if (systemUser.length === 0) {
                const userCollection = $app.dao().findCollectionByNameOrId("users")
                const userRecord = new Record(userCollection)
                const userForm = new RecordUpsertForm($app, userRecord)
                userForm.setDao(txDao)
                userForm.loadData({
                    username: "system"
                })
                userForm.submit()
            }

            txDao.db().newQuery("SELECT * FROM customers LIMIT 1").all(genericResult)
            if (genericResult.length === 0) {
                const customerCollection = $app.dao().findCollectionByNameOrId("customers")
                const customerRecord = new Record(customerCollection)
                const customerForm = new RecordUpsertForm($app, customerRecord)
                customerForm.setDao(txDao)
                customerForm.loadData({
                    name: "DEFAULT CUSTOMER",
                    createdBy: systemUser.id,
                    updatedBy: systemUser.id
                })
                customerForm.submit()
            }

            txDao.db().newQuery("SELECT * FROM itemGroups LIMIT 1").all(genericResult)
            if (genericResult.length === 0) {
                const itemGroupCollection = $app.dao().findCollectionByNameOrId("itemGroups")
                const itemGroupRecord = new Record(itemGroupCollection)
                const itemGroupForm = new RecordUpsertForm($app, itemGroupRecord)
                itemGroupForm.setDao(txDao)
                itemGroupForm.loadData({
                    name: "DEFAULT ITEM GROUP",
                    createdBy: systemUser.id,
                    updatedBy: systemUser.id
                })
                itemGroupForm.submit()
            }

            txDao.db().newQuery("SELECT * FROM vendors LIMIT 1").all(genericResult)
            if (genericResult.length === 0) {
                const vendorCollection = $app.dao().findCollectionByNameOrId("vendors")
                const vendorRecord = new Record(vendorCollection)
                const vendorForm = new RecordUpsertForm($app, vendorRecord)
                vendorForm.setDao(txDao)
                vendorForm.loadData({
                    name: "DEFAULT VENDOR",
                    createdBy: systemUser.id,
                    updatedBy: systemUser.id
                })
                vendorForm.submit()
            }
        })
    } catch (ex) {
        console.log(ex)
    }
})