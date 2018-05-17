const { setWorldConstructor, Before, After } = require("cucumber");
const chattie = require("./../../");
const request = require("request");
const client = require("../../chat/apiClient/");
const PostgresPool = require("pg-pool");
const config = require("config");

const port = 9423;

setWorldConstructor(function() {

});

Before(function(testCase, callback) {
    this.chats = {};
    this.participants = {};

    let serverUri = `http://localhost:${port}`;
    this.client = makeClient(serverUri);
    let db = new PostgresPool(config.postgres);

    db.query("DROP SCHEMA public CASCADE; CREATE SCHEMA public;", (error) => {
        if(error) {
            return callback(error);
        }

        //start server
        let app = chattie.app(db);
        this.server = app.listen(port);

        //TODO: fix this timeout
        //      it exists to wait for databases to be ensured.
        //      a better model would have a listener on the app for "setup complete" or similar
        setTimeout(callback, 1000);
    });
});

function makeClient(serverUri) {
    return client((method, endpoint, data, auth, callback) => {
        let requestOpts = {
            method,
            url: `${serverUri}${endpoint}`,
            json: true
        };

        if(auth) {
            requestOpts.headers = { 'X-Auth-Token': auth };
        }

        if(data) {
            requestOpts.json = data;
        }

        request(requestOpts, (error, httpResponse, body) => {
            if(error) {
                return callback({
                    trace: error,
                    message: "Error in request",
                    body
                });
            }
            if(httpResponse.statusCode >= 400) {
                return callback({
                    trace: new Error("Status code invalid"),
                    message: `Status code ${httpResponse.statusCode}`,
                    statusCode: httpResponse.statusCode,
                    body
                });
            }
            callback(null, body);
        });
    });
}

After(function(testCase, callback) {
    this.server.close(callback);
});
