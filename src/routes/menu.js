const express = require("express");
const prisma = require("../db");

const router = express.Router();

// GET /api/menu — liste des plats du restaurant
router.get("/", async (req, res) => {
  const plats = await prisma.plat.findMany({
    where: { restaurantId: req.restaurantId },
    orderBy: { id: "asc" },
  });
  res.json(plats);
});

module.exports = router;
