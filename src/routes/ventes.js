const express = require("express");
const prisma = require("../db");

const router = express.Router();

function debutAujourdhui() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

// GET /api/ventes — historique du jour (utilisé par l'écran Caisse)
router.get("/", async (req, res) => {
  const ventes = await prisma.vente.findMany({
    where: { restaurantId: req.restaurantId, createdAt: { gte: debutAujourdhui() } },
    include: { lignes: true },
    orderBy: { createdAt: "asc" },
  });
  res.json(ventes);
});

// POST /api/ventes  { lignes: [{ platId, quantite }], methode }
// Enregistre la vente ET déduit automatiquement le stock selon la recette de chaque plat.
router.post("/", async (req, res) => {
  const { lignes, methode } = req.body;

  if (!Array.isArray(lignes) || lignes.length === 0 || !methode) {
    return res.status(400).json({ erreur: "Panier vide ou moyen de paiement manquant." });
  }

  const platsIds = lignes.map((l) => l.platId);
  const plats = await prisma.plat.findMany({
    where: { id: { in: platsIds }, restaurantId: req.restaurantId },
    include: { recette: true },
  });

  if (plats.length !== new Set(platsIds).size) {
    return res.status(400).json({ erreur: "Un des plats du panier est introuvable." });
  }

  const montant = lignes.reduce((s, l) => {
    const plat = plats.find((p) => p.id === l.platId);
    return s + plat.prix * l.quantite;
  }, 0);

  const vente = await prisma.$transaction(async (tx) => {
    const venteCreee = await tx.vente.create({
      data: {
        restaurantId: req.restaurantId,
        montant,
        methode,
        lignes: {
          create: lignes.map((l) => {
            const plat = plats.find((p) => p.id === l.platId);
            return { platId: plat.id, nom: plat.nom, prix: plat.prix, quantite: l.quantite };
          }),
        },
      },
      include: { lignes: true },
    });

    // Déduction automatique du stock selon la recette de chaque plat vendu
    for (const ligne of lignes) {
      const plat = plats.find((p) => p.id === ligne.platId);
      for (const ingredient of plat.recette) {
        const stockActuel = await tx.ingredientStock.findUnique({ where: { id: ingredient.stockId } });
        const nouvelleQuantite = Math.max(0, stockActuel.quantite - ingredient.quantite * ligne.quantite);
        await tx.ingredientStock.update({
          where: { id: ingredient.stockId },
          data: { quantite: nouvelleQuantite },
        });
      }
    }

    return venteCreee;
  });

  res.status(201).json(vente);
});

// GET /api/ventes/export — export CSV des ventes du jour
router.get("/export", async (req, res) => {
  const ventes = await prisma.vente.findMany({
    where: { restaurantId: req.restaurantId, createdAt: { gte: debutAujourdhui() } },
    include: { lignes: true },
    orderBy: { createdAt: "asc" },
  });

  const entetes = "Heure,Plats,Montant,Methode\n";
  const lignesCSV = ventes
    .map((v) => {
      const heure = v.createdAt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
      const plats = v.lignes.map((l) => `${l.quantite}x ${l.nom}`).join(" + ");
      return `${heure},"${plats}",${v.montant},${v.methode}`;
    })
    .join("\n");

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="gestresto-ventes-${new Date().toISOString().slice(0, 10)}.csv"`);
  res.send(entetes + lignesCSV);
});

module.exports = router;
