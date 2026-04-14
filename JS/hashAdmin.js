const bcrypt = require("bcrypt");
const db = require("./db");

const nuevaPassword = "admin123"; // 👉 la que quieras

async function actualizarAdmin() {
  const hash = await bcrypt.hash(nuevaPassword, 10);

  db.query(
    "UPDATE usuarios SET password = ? WHERE rol = 'admin'",
    [hash],
    (err) => {
      if (err) {
        console.log("❌ Error:", err);
      } else {
        console.log("✅ Admin actualizado con contraseña segura");
      }
      process.exit();
    }
  );
}

actualizarAdmin();