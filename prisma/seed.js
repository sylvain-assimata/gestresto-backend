const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("Suppression des anciennes données...");
  await prisma.avance.deleteMany();
  await prisma.depense.deleteMany();
  await prisma.achatFournisseur.deleteMany();
  await prisma.ligneVente.deleteMany();
  await prisma.vente.deleteMany();
  await prisma.recetteIngredient.deleteMany();
  await prisma.employe.deleteMany();
  await prisma.fournisseur.deleteMany();
  await prisma.ingredientStock.deleteMany();
  await prisma.plat.deleteMany();
  await prisma.utilisateur.deleteMany();
  await prisma.restaurant.deleteMany();

  console.log("Création du restaurant...");
  const restaurant = await prisma.restaurant.create({
    data: { nom: "Chez Mama Adjo", contact: "90 00 00 00", plan: "gratuit" },
  });

  console.log("Création du compte propriétaire...");
  const motDePasseHash = await bcrypt.hash("admin123", 10);
  await prisma.utilisateur.create({
    data: {
      restaurantId: restaurant.id,
      nom: "Propriétaire",
      email: "admin@gestresto.tg",
      motDePasseHash,
      role: "proprietaire",
    },
  });

  console.log("Création du stock...");
  const stockData = [
    { nom: "Riz", quantite: 25, unite: "kg", seuil: 5, prixUnitaire: 500 },
    { nom: "Poulet", quantite: 12, unite: "kg", seuil: 3, prixUnitaire: 2500 },
    { nom: "Huile", quantite: 8, unite: "L", seuil: 2, prixUnitaire: 1200 },
    { nom: "Tomate", quantite: 6, unite: "kg", seuil: 3, prixUnitaire: 400 },
    { nom: "Piment", quantite: 1.5, unite: "kg", seuil: 1, prixUnitaire: 800 },
  ];
  const stock = {};
  for (const s of stockData) {
    stock[s.nom] = await prisma.ingredientStock.create({
      data: { ...s, restaurantId: restaurant.id },
    });
  }

  console.log("Création du menu...");
  const menuData = [
    { nom: "Riz sauce arachide", prix: 1000, emoji: "🍚", recette: [["Riz", 0.3], ["Tomate", 0.1]] },
    { nom: "Poulet braisé", prix: 2000, emoji: "🍗", recette: [["Poulet", 0.4], ["Piment", 0.05]] },
    { nom: "Riz gras", prix: 1500, emoji: "🍛", recette: [["Riz", 0.3], ["Huile", 0.1]] },
    { nom: "Alloco", prix: 500, emoji: "🍌", recette: [["Huile", 0.05]] },
    { nom: "Jus de gingembre", prix: 300, emoji: "🥤", recette: [] },
    { nom: "Poisson braisé", prix: 2500, emoji: "🐟", recette: [["Piment", 0.05]] },
  ];
  for (const p of menuData) {
    await prisma.plat.create({
      data: {
        restaurantId: restaurant.id,
        nom: p.nom,
        prix: p.prix,
        emoji: p.emoji,
        recette: {
          create: p.recette.map(([nomIngredient, quantite]) => ({
            quantite,
            stock: { connect: { id: stock[nomIngredient].id } },
          })),
        },
      },
    });
  }

  console.log("Création des fournisseurs...");
  await prisma.fournisseur.create({
    data: {
      restaurantId: restaurant.id,
      nom: "Grossiste Riz Adjidogo",
      contact: "90 12 34 56",
      produits: "Riz, Huile",
      solde: 15000,
      achats: { create: [{ montant: 15000, description: "Achat riz + huile" }] },
    },
  });
  await prisma.fournisseur.create({
    data: {
      restaurantId: restaurant.id,
      nom: "Boucherie Centrale",
      contact: "91 22 33 44",
      produits: "Poulet, Poisson",
      solde: 0,
    },
  });

  console.log("Création du personnel...");
  await prisma.employe.createMany({
    data: [
      { restaurantId: restaurant.id, nom: "Ama Kodjo", poste: "Cuisinière", salaireMensuel: 45000, avances: 5000, present: true },
      { restaurantId: restaurant.id, nom: "Kossi Mensah", poste: "Serveur", salaireMensuel: 35000, avances: 0, present: true },
      { restaurantId: restaurant.id, nom: "Efua Dogbe", poste: "Caissière", salaireMensuel: 40000, avances: 10000, present: false },
    ],
  });

  console.log("Terminé ! Compte de connexion : admin@gestresto.tg / admin123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
