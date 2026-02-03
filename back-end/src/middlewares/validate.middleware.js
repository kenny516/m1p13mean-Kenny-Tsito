/**
 * Middleware de validation avec Joi
 * Valide les données de la requête selon le schéma fourni
 *
 * @param {Object} schema - Schéma Joi de validation
 * @param {string} property - Propriété de la requête à valider (body, query, params)
 */
export const validate = (schema, property = "body") => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false, // Retourner toutes les erreurs
      stripUnknown: true, // Supprimer les champs inconnus
    });

    if (error) {
      const details = error.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message,
      }));

      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Données invalides",
          details,
        },
      });
    }

    // Remplacer les données par les données validées (nettoyées)
    req[property] = value;
    next();
  };
};
