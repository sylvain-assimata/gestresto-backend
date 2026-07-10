const jwt = require("jsonwebtoken");

// Vérifie le token JWT envoyé dans l'en-tête Authorization: Bearer <token>
// et attache l'utilisateur + son restaurant à la requête.
function verifierAuth(req, res, next) {
  const enTete = req.headers.authorization || "";
  const token = enTete.startsWith("Bearer ") ? enTete.slice(7) : null;

  if (!token) {
    return res.status(401).json({ erreur: "Connexion requise." });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.utilisateurId = payload.utilisateurId;
    req.restaurantId = payload.restaurantId;
    next();
  } catch (err) {
    return res.status(401).json({ erreur: "Session expirée, reconnecte-toi." });
  }
}

module.exports = verifierAuth;
