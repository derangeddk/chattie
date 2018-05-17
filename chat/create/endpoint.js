module.exports = (repo) => (req, res) => {
    let { name, participants } = req.body;
    if(typeof name === "undefined") {
        return res.status(400).send({ error: "Cannot create a chat room without a name." });
    }
    if(!participants || !participants.length) {
        return res.status(400).send({ error: "Cannot create a chat room without users." });
    }
    if(participants.some((participant) => !participant.name)) {
        return res.status(400).send({ error: "All users must have names." });
    }
    participants = participants.map((participant) => {
        return {
            name: participant.name,
            isOwner: !!participant.isOwner
        };
    });

    repo.create({ name, participants }, (error, chat) => {
        if(error) {
            console.error("Failed to create chat room", { name, participants, error });
            return res.status(500).send({ error: "Failed to create chat room." });
        }
        res.send({ chat });
    });
};
