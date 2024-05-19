/// <reference path="../pb_data/types.d.ts" />
routerUse($apis.activityLogger($app))

routerAdd("GET", "/custom_api/healthcheck", (c) => { return c.string(200, "OK") })