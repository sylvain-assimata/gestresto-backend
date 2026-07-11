const express = require("express");
const prisma = require("../db");

const router = express.Router();

// GET /api/menu — liste des plats actifs du restaurant, avec leur recette
// (la recette est nécessaire côté frontend pour déduire le stock quand l'app est hors-ligne)
router.get("/", async (req, res) => {
  const plats = await prisma.plat.findMany({
    where: { restaurantId: req.restaurantId, actif: true },
    include: { recette: true },
    orderBy: { id: "asc" },
  });
  res.json(plats);
});

// POST /api/menu  { nom, prix, emoji? }
// Ajoute un plat directement au menu, sans passer par le Stock (utile pour
// les boissons ou tout plat qui ne suit pas de recette précise).
router.post("/", async (req, res) => {
  const { nom, prix, emoji } = req.body;
  if (!nom || prix === undefined || prix === "") {
    return res.status(400).json({ erreur: "Nom et prix requis." });
  }
  const plat = await prisma.plat.create({
    data: {
      restaurantId: req.restaurantId,
      nom,
      prix: parseInt(prix),
      emoji: emoji || "🍽️",
    },
    include: { recette: true },
  });
  res.status(201).json(plat);
});

// PUT /api/menu/:id  { nom, prix, emoji? }
router.put("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const { nom, prix, emoji } = req.body;
  if (!nom || prix === undefined || prix === "") {
    return res.status(400).json({ erreur: "Nom et prix requis." });
  }
  const plat = await prisma.plat.findFirst({ where: { id, restaurantId: req.restaurantId } });
  if (!plat) return res.status(404).json({ erreur: "Plat introuvable." });

  const misAJour = await prisma.plat.update({
    where: { id },
    data: { nom, prix: parseInt(prix), emoji: emoji || plat.emoji },
    include: { recette: true },
  });
  res.json(misAJour);
});

// DELETE /api/menu/:id
// Suppression "douce" : le plat disparaît du menu mais reste lié à l'historique
// des ventes passées (on ne perd jamais les chiffres déjà enregistrés).
router.delete("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const plat = await prisma.plat.findFirst({ where: { id, restaurantId: req.restaurantId } });
  if (!plat) return res.status(404).json({ erreur: "Plat introuvable." });

  await prisma.plat.update({ where: { id }, data: { actif: false } });
  res.status(204).send();
});

module.exports = router;
