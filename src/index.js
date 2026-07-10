require("dotenv").config();
const express = require("express");
const cors = require("cors");

const verifierAuth = require("./middleware/auth");
const authRoutes = require("./routes/auth");
const dashboardRoutes = require("./routes/dashboard");
const menuRoutes = require("./routes/menu");
const ventesRoutes = require("./routes/ventes");
const stockRoutes = require("./routes/stock");
const fournisseursRoutes = require("./routes/fournisseurs");
const personnelRoutes = require("./routes/personnel");
const restaurantRoutes = require("./routes/restaurant");

const app = express();
app.use(cors());
app.use(express.json());

// Vérifie que le serveur tourne (utile pour Railway/monitoring)
app.get("/health", (req, res) => res.json({ ok: true }));

// La connexion ne nécessite pas d'être déjà authentifié
app.use("/api/auth", authRoutes);

// Toutes les routes suivantes exigent un token JWT valide
app.use("/api/dashboard", verifierAuth, dashboardRoutes);
app.use("/api/menu", verifierAuth, menuRoutes);
app.use("/api/ventes", verifierAuth, ventesRoutes);
app.use("/api/stock", verifierAuth, stockRoutes);
app.use("/api/fournisseurs", verifierAuth, fournisseursRoutes);
app.use("/api/personnel", verifierAuth, personnelRoutes);
app.use("/api/restaurant", verifierAuth, restaurantRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`API GestResto démarrée sur le port ${PORT}`);
});
