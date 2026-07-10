const express = require("express");
const prisma = require("../db");

const router = express.Router();

// GET /api/restaurant
router.get("/", async (req, res) => {
  const restaurant = await prisma.restaurant.findUnique({ where: { id: req.restaurantId } });
  res.json(restaurant);
});

// PUT /api/restaurant  { nom, contact }
router.put("/", async (req, res) => {
  const { nom, contact } = req.body;
  const restaurant = await prisma.restaurant.update({
    where: { id: req.restaurantId },
    data: { nom, contact },
  });
  res.json(restaurant);
});

// PUT /api/restaurant/plan  { plan }
router.put("/plan", async (req, res) => {
  const { plan } = req.body;
  if (!["gratuit", "essentiel", "pro"].includes(plan)) {
    return res.status(400).json({ erreur: "Plan invalide." });
  }
  const restaurant = await prisma.restaurant.update({
    where: { id: req.restaurantId },
    data: { plan },
  });
  res.json(restaurant);
});

module.exports = router;
