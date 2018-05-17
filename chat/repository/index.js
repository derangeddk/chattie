const uuid = require("uuid");
const ensureDb = require("../../utils/ensureDb");
const async = require("async");

module.exports = (db) => {
    /* idea:
    let dboye = DataBoye(db);
    dboye.ensure("chats", {
        id: "uuid NOT NULL",
        data: "json NOT NULL"
    }, callback);
    dboye.insert("chats", { id: chatId, data: { name } });
    // ... or alternatively:
    dboye.chats.insert({ id: ... });
    // ... should still have dboye.query for custom queries
    */
    async.series([
        (callback) => ensureDb(db, "chats (id uuid PRIMARY KEY, data json NOT NULL)", callback),
        (callback) => ensureDb(db, "chat_participants (id uuid PRIMARY KEY, chat_id uuid NOT NULL REFERENCES chats (id) ON DELETE CASCADE, data json NOT NULL)", callback),
        (callback) => ensureDb(db, "chat_messages (id serial PRIMARY KEY, chat_id uuid NOT NULL REFERENCES chats (id) ON DELETE CASCADE, participant_id uuid NOT NULL REFERENCES chat_participants (id) ON DELETE RESTRICT, data json NOT NULL)", callback)
    ], (error) => {
        if(error) {
            console.error("Failed to create chats tables", error);
            process.exit(1);
        }
    });

    return {
        create: (config, callback) => {
            let { name, participants } = config;
            let chatId = uuid.v4();
            db.query("INSERT INTO chats (id, data) VALUES ($1::uuid, $2::json)", [ chatId, { name } ], (error) => {
                if(error) {
                    return callback(error);
                }
                async.map(participants, (participant, callback) => {
                    let participantId = uuid.v4();
                    db.query("INSERT INTO chat_participants (id, chat_id, data) VALUES ($1::uuid, $2::uuid, $3::json)", [ participantId, chatId, participant ], (error) => callback(error, participantId));
                }, (error, participantIds) => {
                    if(error) {
                        return callback(error);
                    }
                    callback(null, {
                        id: chatId,
                        name,
                        participants: participants.map((participant, i) => {
                            participant.id = participantIds[i];
                            return participant;
                        }),
                        messages: []
                    });
                });
            });
        },
        delete: (id, callback) => {
            db.query("DELETE FROM chats WHERE id=$1::uuid", [ id ], callback)
        },
        get: (id, callback) => {
            db.query("SELECT * FROM chats WHERE id=$1::uuid", [ id ], (error, result) => {
                if(error) {
                    return callback(error);
                }
                if(!result.rows.length) {
                    return callback({
                        type: "NotFound",
                        trace: new Error("No such chat found"),
                        id
                    });
                }
                let chatData = result.rows[0].data;
                async.parallel({
                    participants: (callback) => db.query("SELECT * FROM chat_participants WHERE chat_id=$1::uuid", [ id ], callback),
                    messages: (callback) => db.query("SELECT * FROM chat_messages WHERE chat_id=$1::uuid ORDER BY id ASC", [ id ], callback)
                }, (error, results) => {
                    if(error) {
                        return callback(error);
                    }
                    callback(null, {
                        id,
                        name: chatData.name,
                        participants: results.participants.rows.map((participantRow) => {
                            let data = participantRow.data;
                            data.id = participantRow.id;
                            return data;
                        }),
                        messages: results.messages.rows.map((messageRow) => {
                            let data = messageRow.data;
                            data.id = messageRow.id;
                            data.participantId = messageRow.participant_id;
                            return data;
                        })
                    });
                });
            });
        },
        getByParticipant: (participantId, callback) => {
            //TODO: Only SQL differs from `get`. Rest is duplicate.
            db.query("SELECT chats.id AS id, chats.data AS data FROM chats, chat_participants WHERE chat_participants.chat_id = chats.id AND chat_participants.id = $1::uuid", [ participantId ], (error, result) => {
                if(error) {
                    return callback(error);
                }
                if(!result.rows.length) {
                    return callback({
                        type: "NotFound",
                        trace: new Error("No chat found for participant"),
                        participantId
                    });
                }
                let chat = result.rows[0];
                let id = chat.id;
                async.parallel({
                    participants: (callback) => db.query("SELECT * FROM chat_participants WHERE chat_id=$1::uuid", [ id ], callback),
                    messages: (callback) => db.query("SELECT * FROM chat_messages WHERE chat_id=$1::uuid ORDER BY id ASC", [ id ], callback)
                }, (error, results) => {
                    if(error) {
                        return callback(error);
                    }
                    callback(null, {
                        id,
                        name: chat.data.name,
                        participants: results.participants.rows.map((participantRow) => {
                            let data = participantRow.data;
                            data.id = participantRow.id;
                            return data;
                        }),
                        messages: results.messages.rows.map((messageRow) => {
                            let data = messageRow.data;
                            data.id = messageRow.id;
                            data.participantId = messageRow.participant_id;
                            return data;
                        })
                    });
                });
            });
        },
        addMessage: (participantId, message, callback) => {
            db.query("SELECT * FROM chat_participants WHERE id=$1::uuid", [ participantId ], (error, result) => {
                if(error) {
                    return callback(error);
                }
                if(!result.rows.length) {
                    return callback({
                        type: "NotFound",
                        trace: new Error("No chat participant found"),
                        participantId
                    });
                }
                let participant = result.rows[0];
                db.query("INSERT INTO chat_messages (chat_id, participant_id, data) VALUES ($1::uuid, $2::uuid, $3::json)", [ participant.chat_id, participantId, { message } ], callback);
            });
        }
    }
};

//TODO: DataBoye could give better error messages with traces and stuff pls
/*
function DataBoye(db) {
    let schema = {};
    return {
        ensure: (name, descriptor, callback) => {
            let cols = Object.keys(descriptor);
            schema[name] = {};
            cols.forEach((col) => {
                let firstSpace = descriptor[col].indexOf(" ");
                if(firstSpace === 0) {
                    schema[name][col] = { type: descriptor[col], extra: "" };
                    return;
                }
                schema[name][col] = { type: descriptor[col].substring(0, firstSpace), extra: descriptor[col].substring(firstSpace + 1) };
            });
            ensureDb(db, `${name} (${cols.map((col) => `${col} ${descriptor[col]}`).join(", ")})`, callback);
        },
        insert: (name, data, callback) => {
            let cols = Object.keys(data);
            let inserts = cols.map((col, i) => `$${i + 1}::${schema[name][col].type}`);
            db.query(`INSERT INTO ${name} (${cols.join(", ")}) VALUES (${inserts.join(", ")})`, Object.values(data), callback);
        }
    }
}*/
