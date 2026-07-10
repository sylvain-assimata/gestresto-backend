const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../db");

const router = express.Router();

// POST /api/auth/login  { email, motDePasse }
router.post("/login", async (req, res) => {
  const { email, motDePasse } = req.body;

  if (!email || !motDePasse) {
    return res.status(400).json({ erreur: "Email et mot de passe requis." });
  }

  const utilisateur = await prisma.utilisateur.findUnique({ where: { email } });
  if (!utilisateur) {
    return res.status(401).json({ erreur: "Identifiants incorrects." });
  }

  const motDePasseValide = await bcrypt.compare(motDePasse, utilisateur.motDePasseHash);
  if (!motDePasseValide) {
    return res.status(401).json({ erreur: "Identifiants incorrects." });
  }

  const token = jwt.sign(
    { utilisateurId: utilisateur.id, restaurantId: utilisateur.restaurantId },
    process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );

  res.json({
    token,
    utilisateur: { id: utilisateur.id, nom: utilisateur.nom, email: utilisateur.email, role: utilisateur.role },
  });
});

module.exports = router;
