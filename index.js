const express = require("express");
const createChatRepository = require("./chat/repository/");
const createChatEndpoint = require("./chat/create/endpoint");
const deleteChatEndpoint = require("./chat/delete/endpoint");
const getChatLogEndpoint = require("./chat/getLog/endpoint");
const writeMessageEndpoint = require("./chat/writeMessage/endpoint");
const chatEndpoint = require("./chat/frontend/endpoint");
const bodyParser = require("body-parser");

module.exports = {
    app: (db) => {
        let app = express();

        app.use(bodyParser.json());

        let chatRepository = createChatRepository(db);

        app.post("/chat", createChatEndpoint(chatRepository));
        app.delete("/chat/:id", deleteChatEndpoint(chatRepository));
        app.get("/chat/:id", chatEndpoint(chatRepository));
        app.get("/chat/:id/log", getChatLogEndpoint(chatRepository));
        app.post("/chat/:id/message", writeMessageEndpoint(chatRepository));

        return app;
    },
    repository: createChatRepository
};
