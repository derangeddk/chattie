module.exports = (request) => {
    let auth = null;

    let r = (method, endpoint, data, callback) => {
        if(!callback) {
            callback = data;
            data = null;
        }
        request(method, endpoint, data, auth, callback);
    }

    return {
        create: (config, callback) => r("POST", "/chat", config, callback),
        delete: (id, callback) => r("DELETE", `/chat/${id}`, callback),
        getLog: (id, callback) => r("GET", `/chat/${id}/log`, callback),
        sendMessage: (id, message, callback) => r("POST", `/chat/${id}/message`, { message }, callback)
    };
};
