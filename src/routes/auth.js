const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../db");

const router = express.Router();

function creerToken(utilisateur) {
  return jwt.sign(
    { utilisateurId: utilisateur.id, restaurantId: utilisateur.restaurantId },
    process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );
}

// POST /api/auth/register  { nomRestaurant, nom, email, motDePasse }
// Crée un nouveau restaurant + son compte propriétaire, puis connecte directement.
router.post("/register", async (req, res) => {
  const { nomRestaurant, nom, email, motDePasse } = req.body;

  if (!nomRestaurant || !nom || !email || !motDePasse) {
    return res.status(400).json({ erreur: "Tous les champs sont obligatoires." });
  }
  if (motDePasse.length < 6) {
    return res.status(400).json({ erreur: "Le mot de passe doit contenir au moins 6 caractères." });
  }

  const emailExistant = await prisma.utilisateur.findUnique({ where: { email } });
  if (emailExistant) {
    return res.status(409).json({ erreur: "Un compte existe déjà avec cet email." });
  }

  const motDePasseHash = await bcrypt.hash(motDePasse, 10);

  const restaurant = await prisma.restaurant.create({
    data: {
      nom: nomRestaurant,
      contact: "",
      plan: "gratuit",
      utilisateurs: {
        create: { nom, email, motDePasseHash, role: "proprietaire" },
      },
    },
    include: { utilisateurs: true },
  });

  const utilisateur = restaurant.utilisateurs[0];
  const token = creerToken(utilisateur);

  res.status(201).json({
    token,
    utilisateur: { id: utilisateur.id, nom: utilisateur.nom, email: utilisateur.email, role: utilisateur.role },
  });
});

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

  const token = creerToken(utilisateur);

  res.json({
    token,
    utilisateur: { id: utilisateur.id, nom: utilisateur.nom, email: utilisateur.email, role: utilisateur.role },
  });
});

module.exports = router;
