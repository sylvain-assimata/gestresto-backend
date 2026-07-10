const express = require("express");
const prisma = require("../db");

const router = express.Router();

// GET /api/fournisseurs — avec historique des achats
router.get("/", async (req, res) => {
  const fournisseurs = await prisma.fournisseur.findMany({
    where: { restaurantId: req.restaurantId },
    include: { achats: { orderBy: { createdAt: "asc" } } },
    orderBy: { id: "asc" },
  });
  res.json(fournisseurs);
});

// POST /api/fournisseurs/:id/achats  { montant, description }
router.post("/:id/achats", async (req, res) => {
  const id = parseInt(req.params.id);
  const { montant, description } = req.body;
  if (!montant || !description) {
    return res.status(400).json({ erreur: "Montant et description requis." });
  }

  const fournisseur = await prisma.fournisseur.findFirst({ where: { id, restaurantId: req.restaurantId } });
  if (!fournisseur) return res.status(404).json({ erreur: "Fournisseur introuvable." });

  await prisma.achatFournisseur.create({
    data: { fournisseurId: id, montant: parseInt(montant), description },
  });
  const misAJour = await prisma.fournisseur.update({
    where: { id },
    data: { solde: fournisseur.solde + parseInt(montant) },
    include: { achats: true },
  });
  res.status(201).json(misAJour);
});

// POST /api/fournisseurs/:id/payer — solde à zéro + création d'une dépense
router.post("/:id/payer", async (req, res) => {
  const id = parseInt(req.params.id);
  const fournisseur = await prisma.fournisseur.findFirst({ where: { id, restaurantId: req.restaurantId } });
  if (!fournisseur) return res.status(404).json({ erreur: "Fournisseur introuvable." });
  if (fournisseur.solde === 0) return res.json(fournisseur);

  await prisma.depense.create({
    data: {
      restaurantId: req.restaurantId,
      montant: fournisseur.solde,
      description: `Paiement fournisseur : ${fournisseur.nom}`,
    },
  });
  const misAJour = await prisma.fournisseur.update({
    where: { id },
    data: { solde: 0 },
    include: { achats: true },
  });
  res.json(misAJour);
});

module.exports = router;
