module.exports = (repo) => (req, res) => {
    let { message } = req.body;
    if(!message || !message.length || typeof message !== "string") {
        return res.status(400).send({ error: "No message to send" });
    }

    repo.addMessage(req.params.id, message, (error) => {
        if(error && error.type == "NotFound") {
            res.status(404).send({ error: "No such participant" });
        }
        if(error) {
            console.error("Failed to write message", { id: req.params.id, message });
            res.status(500).send({ error: "Failed to send message" });
        }
        res.send();
    });
};
