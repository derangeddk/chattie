const chattie = require("./index");
const PostgresPool = require("pg-pool");
const config = require("config");

const db = new PostgresPool(config.postgres);

const app = chattie.app(db);
const server = app.listen(9876);
