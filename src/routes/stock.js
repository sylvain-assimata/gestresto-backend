const express = require("express");
const prisma = require("../db");

const router = express.Router();

// GET /api/stock
router.get("/", async (req, res) => {
  const stock = await prisma.ingredientStock.findMany({
    where: { restaurantId: req.restaurantId },
    orderBy: { id: "asc" },
  });
  res.json(stock);
});

// POST /api/stock  { nom, quantite, unite, seuil, prixUnitaire, prixVente? }
// Si "prixVente" est fourni, le produit devient aussi immédiatement vendable
// en Caisse : un plat est créé, lié à ce stock (1 unité déduite par vente).
router.post("/", async (req, res) => {
  const { nom, quantite, unite, seuil, prixUnitaire, prixVente } = req.body;
  if (!nom || quantite === undefined) {
    return res.status(400).json({ erreur: "Nom et quantité requis." });
  }

  const produit = await prisma.$transaction(async (tx) => {
    const produitCree = await tx.ingredientStock.create({
      data: {
        restaurantId: req.restaurantId,
        nom,
        quantite: parseFloat(quantite) || 0,
        unite: unite || "unité",
        seuil: parseFloat(seuil) || 0,
        prixUnitaire: parseInt(prixUnitaire) || 0,
      },
    });

    if (prixVente && parseInt(prixVente) > 0) {
      await tx.plat.create({
        data: {
          restaurantId: req.restaurantId,
          nom,
          prix: parseInt(prixVente),
          emoji: "🍽️",
          recette: { create: [{ quantite: 1, stock: { connect: { id: produitCree.id } } }] },
        },
      });
    }

    return produitCree;
  });

  res.status(201).json(produit);
});

// POST /api/stock/:id/reception  { quantite }
router.post("/:id/reception", async (req, res) => {
  const id = parseInt(req.params.id);
  const { quantite } = req.body;
  if (!quantite || quantite <= 0) {
    return res.status(400).json({ erreur: "Quantité invalide." });
  }
  const produit = await prisma.ingredientStock.findFirst({ where: { id, restaurantId: req.restaurantId } });
  if (!produit) return res.status(404).json({ erreur: "Produit introuvable." });

  const misAJour = await prisma.ingredientStock.update({
    where: { id },
    data: { quantite: produit.quantite + parseFloat(quantite) },
  });
  res.json(misAJour);
});

module.exports = router;
