const Session = require("../models/Session");

exports.getSessions = async (req, res) => {
    const sessions = await Session.find({ userId: req.user.id });
    res.json(sessions);
};

exports.deleteSession = async (req, res) => {
    await Session.findByIdAndDelete(req.params.id);
    res.json({ message: "Sesión eliminada" });
};