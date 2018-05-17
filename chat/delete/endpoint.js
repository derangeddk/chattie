module.exports = (repo) => (req, res) => {
    let { id } = req.params;

    repo.delete(id, (error) => {
        if(error && error.type == "NotFound") {
            return res.status(404).send({ error: "No such chat to delete" });
        }
        if(error) {
            return res.status(500).send({ error: "Failed to delete chat." });
        }
        res.send({ message: "Chat deleted" });
    });
};
