const express = require("express");
const prisma = require("../db");

const router = express.Router();

// GET /api/personnel
router.get("/", async (req, res) => {
  const personnel = await prisma.employe.findMany({
    where: { restaurantId: req.restaurantId },
    orderBy: { id: "asc" },
  });
  res.json(personnel);
});

// POST /api/personnel  { nom, poste, salaireMensuel }
router.post("/", async (req, res) => {
  const { nom, poste, salaireMensuel } = req.body;
  if (!nom || !poste || !salaireMensuel) {
    return res.status(400).json({ erreur: "Nom, poste et salaire requis." });
  }
  const employe = await prisma.employe.create({
    data: {
      restaurantId: req.restaurantId,
      nom,
      poste,
      salaireMensuel: parseInt(salaireMensuel),
      avances: 0,
      present: true,
    },
  });
  res.status(201).json(employe);
});

// PUT /api/personnel/:id  { nom, poste, salaireMensuel }
router.put("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const { nom, poste, salaireMensuel } = req.body;
  const employe = await prisma.employe.findFirst({ where: { id, restaurantId: req.restaurantId } });
  if (!employe) return res.status(404).json({ erreur: "Employé introuvable." });

  const misAJour = await prisma.employe.update({
    where: { id },
    data: { nom, poste, salaireMensuel: parseInt(salaireMensuel) },
  });
  res.json(misAJour);
});

// DELETE /api/personnel/:id
router.delete("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const employe = await prisma.employe.findFirst({ where: { id, restaurantId: req.restaurantId } });
  if (!employe) return res.status(404).json({ erreur: "Employé introuvable." });

  await prisma.avance.deleteMany({ where: { employeId: id } });
  await prisma.employe.delete({ where: { id } });
  res.status(204).send();
});

// POST /api/personnel/:id/presence — bascule présent/absent
router.post("/:id/presence", async (req, res) => {
  const id = parseInt(req.params.id);
  const employe = await prisma.employe.findFirst({ where: { id, restaurantId: req.restaurantId } });
  if (!employe) return res.status(404).json({ erreur: "Employé introuvable." });

  const misAJour = await prisma.employe.update({
    where: { id },
    data: { present: !employe.present },
  });
  res.json(misAJour);
});

// POST /api/personnel/:id/avance  { montant }
router.post("/:id/avance", async (req, res) => {
  const id = parseInt(req.params.id);
  const { montant } = req.body;
  if (!montant || montant <= 0) return res.status(400).json({ erreur: "Montant invalide." });

  const employe = await prisma.employe.findFirst({ where: { id, restaurantId: req.restaurantId } });
  if (!employe) return res.status(404).json({ erreur: "Employé introuvable." });

  await prisma.avance.create({ data: { employeId: id, montant: parseInt(montant) } });
  await prisma.depense.create({
    data: { restaurantId: req.restaurantId, montant: parseInt(montant), description: "Avance sur salaire" },
  });
  const misAJour = await prisma.employe.update({
    where: { id },
    data: { avances: employe.avances + parseInt(montant) },
  });
  res.json(misAJour);
});

module.exports = router;
