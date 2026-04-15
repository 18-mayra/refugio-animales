const router = require("express").Router();
const db = require("../db");
const auth = require("../middlewares/authMiddleware");

router.put("/password", auth, (req, res) => {
  const { nueva } = req.body;

  db.query(
    "UPDATE usuarios SET password = ? WHERE id = ?",
    [nueva, req.user.id],
    () => res.json({ message: "Contraseña actualizada" })
  );
});

module.exports = router;