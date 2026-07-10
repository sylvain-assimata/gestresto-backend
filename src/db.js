const { PrismaClient } = require("@prisma/client");

// Une seule instance du client Prisma pour toute l'application
const prisma = new PrismaClient();

module.exports = prisma;
