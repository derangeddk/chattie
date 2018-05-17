const { Given, When, Then } = require("cucumber");

When(/^I create a chat "([^"]+)" with the following users:$/, function(chatName, table, callback) {
    let users = table.hashes();
    users.forEach((user) => user.isOwner = user.isOwner == "true");
    createChat.call(this, chatName, users, callback);
});

function createChat(chatName, users, callback) {
    this.client.create({
        name: chatName,
        participants: users
    }, (error, result) => {
        if(error) {
            return callback(error);
        }
        this.chats[chatName] = result.chat;
        this.lastReceivedChat = result.chat;
        result.chat.participants.forEach((participant) => {
            this.participants[participant.name] = participant;
        });
        callback();
    });
}

Given(/^I created a chat "([^"]+)" with the following users:$/, function(chatName, table, callback) {
    let users = table.hashes();
    users.forEach((user) => user.isOwner = user.isOwner == "true");
    createChat.call(this, chatName, users, callback);
});

Then(/^I should receive a chat id and ([0-9]+) participant ids$/, function(expectedNumberOfParticipantIds, callback) {
    expectedNumberOfParticipantIds = parseInt(expectedNumberOfParticipantIds);
    if(!this.lastReceivedChat) {
        return callback(new Error(`Expected to have received a chat, but got none.`));
    }
    if(!this.lastReceivedChat.participants) {
        return callback(new Error(`No participants found on chat: ${JSON.stringify(this.lastReceivedChat, null, 2)}`));
    }
    let numberOfParticipantIds = this.lastReceivedChat.participants.length;
    if(expectedNumberOfParticipantIds !== numberOfParticipantIds) {
        return callback(new Error(`Expected ${expectedNumberOfParticipantIds} participants, but found ${numberOfParticipantIds}.`));
    }
    callback();
});

When(/^I delete the chat "([^"]+)"$/, function(chatName, callback) {
    this.client.delete(this.chats[chatName].id, callback);
});

Then(/^the chat "([^"]+)" no longer exists$/, function(chatName, callback) {
    let chat = this.chats[chatName];
    this.client.getLog(chat.id, (error) => {
        if(error && error.statusCode == 404) {
            return callback();
        }
        callback(new Error(`Did not get the expected error 404 when trying to get chat ${chatName}: ${JSON.stringify({ chat, error })}`));
    });
});

When(/^participant "([^"]+)" sends a message "([^"]+)"$/, function(participantName, message, callback) {
    let participant = this.participants[participantName];
    if(!participant) {
        return callback(new Error(`Found on participant ${participantName} in list ${JSON.stringify(this.participants, null, 2)}`));
    }
    this.client.sendMessage(participant.id, message, callback);
});

Then(/^a message "([^"]+)" from "([^"]+)" appears in the chat log for "([^"]+)"$/, function(expectedMessage, fromParticipant, chatName, callback) {
    let fParticipant = this.participants[fromParticipant];
    if(!fromParticipant) {
        return callback(new Error(`Found no participant ${fromParticipant} in list ${JSON.stringify(this.participants, null, 2)}`));
    }
    let chat = this.chats[chatName];
    this.client.getLog(chat.id, (error, result) => {
        if(error) {
            return callback(error);
        }
        if(!result.messages.some((message) => message.message == expectedMessage)) {
            return callback(new Error(`Did not find expected message ${expectedMessage} in list of messages: ${JSON.stringify(result.chat.messages,null,2)}`));
        }
        callback();
    });
});

Then(/^a message "([^"]+)" from "([^"]+)" appears in the chat log as viewed by "([^"]+)"$/, function(expectedMessage, fromParticipant, viewingParticipant, callback) {
    let fParticipant = this.participants[fromParticipant];
    if(!fromParticipant) {
        return callback(new Error(`Found no participant ${fromParticipant} in list ${JSON.stringify(this.participants, null, 2)}`));
    }
    let vParticipant = this.participants[viewingParticipant];
    if(!viewingParticipant) {
        return callback(new Error(`Found no participant ${viewingParticipant} in list ${JSON.stringify(this.participants, null, 2)}`));
    }
    this.client.getLog(vParticipant.id, (error, result) => {
        if(error) {
            return callback(error);
        }
        if(!result.messages.some((message) => message.message == expectedMessage)) {
            return callback(new Error(`Did not find expected message ${expectedMessage} in list of messages: ${JSON.stringify(result.chat.messages,null,2)}`));
        }
        callback();
    });
});
