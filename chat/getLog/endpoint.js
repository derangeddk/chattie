module.exports = (repo) => (req, res) => {
    let { id } = req.params;

    repo.get(id, (error, chat) => {
        if(error && error.type == "NotFound") {
            return repo.getByParticipant(id, (error, chat) => {
                if(error && error.type == "NotFound") {
                    return res.status(404).send({ error: "No such chat" });
                }
                if(error) {
                    console.error("Failed to get messages by participant", error);
                    return res.status(500).send("Failed to get messages");
                }
                return res.send({ messages: chat.messages });
            });
        }
        if(error) {
            console.error("Failed to get messages", error);
            return res.status(500).send("Failed to get messages");
        }
        res.send({ messages: chat.messages });
    });
};
