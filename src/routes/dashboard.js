const express = require("express");
const prisma = require("../db");

const router = express.Router();

function debutAujourdhui() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

// GET /api/dashboard — résumé du jour pour l'écran d'accueil
router.get("/", async (req, res) => {
  const depuis = debutAujourdhui();

  const ventes = await prisma.vente.findMany({
    where: { restaurantId: req.restaurantId, createdAt: { gte: depuis } },
    include: { lignes: true },
    orderBy: { createdAt: "asc" },
  });

  const depenses = await prisma.depense.findMany({
    where: { restaurantId: req.restaurantId, createdAt: { gte: depuis } },
  });

  const recettes = ventes.reduce((s, v) => s + v.montant, 0);
  const totalDepenses = depenses.reduce((s, d) => s + d.montant, 0);

  const compteParPlat = {};
  ventes.forEach((v) => {
    v.lignes.forEach((l) => {
      compteParPlat[l.nom] = (compteParPlat[l.nom] || 0) + l.quantite;
    });
  });
  const platsPopulaires = Object.entries(compteParPlat)
    .map(([nom, quantite]) => ({ nom, quantite }))
    .sort((a, b) => b.quantite - a.quantite)
    .slice(0, 5);

  const dernieresVentes = ventes
    .slice(-5)
    .reverse()
    .map((v) => ({
      id: v.id,
      montant: v.montant,
      methode: v.methode,
      heure: v.createdAt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      lignes: v.lignes.map((l) => ({ nom: l.nom, quantite: l.quantite })),
    }));

  res.json({
    recettes,
    depenses: totalDepenses,
    benefice: recettes - totalDepenses,
    ventes: ventes.length,
    platsPopulaires,
    dernieresVentes,
  });
});

module.exports = router;
