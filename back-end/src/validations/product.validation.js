import Joi from "joi";

/**
 * Schéma de validation pour la création d'un produit
 */
export const createProductSchema = Joi.object({
  shopId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      "any.required": "La boutique est requise",
      "string.pattern.base": "L'identifiant de boutique est invalide",
    }),

  // === IDENTIFICATION & INFORMATIONS ===
  title: Joi.string().trim().min(3).max(100).required().messages({
    "string.empty": "Le titre est requis",
    "string.min": "Le titre doit contenir au moins 3 caractères",
    "string.max": "Le titre ne doit pas dépasser 100 caractères",
  }),

  description: Joi.string().min(10).max(5000).required().messages({
    "string.empty": "La description est requise",
    "string.min": "La description doit contenir au moins 10 caractères",
    "string.max": "La description ne doit pas dépasser 5000 caractères",
  }),

  sku: Joi.string().trim().optional().allow(null, "").messages({
    "string.empty": "Le SKU ne doit pas être vide",
  }),

  category: Joi.string().required().messages({
    "string.empty": "La catégorie est requise",
  }),

  tags: Joi.array().items(Joi.string().trim()).max(10).optional().messages({
    "array.max": "Maximum 10 tags autorisés",
  }),

  characteristics: Joi.object()
    .pattern(Joi.string(), Joi.alternatives().try(Joi.string(), Joi.number()))
    .optional()
    .messages({
      "object.unknown": "Caractéristiques invalides",
    }),


  // === TARIFICATION ===
  price: Joi.number().min(0).required().messages({
    "number.min": "Le prix doit être positif ou nul",
    "any.required": "Le prix est requis",
  }),

  originalPrice: Joi.number().min(0).optional().messages({
    "number.min": "Le prix original doit être positif ou nul",
  }),

  // === GESTION DU STOCK (Configuration) ===
  stock: Joi.object({
    cache: Joi.object({
      available: Joi.number().integer().min(0).optional(),
      total: Joi.number().integer().min(0).optional(),
    }).optional(),
    alert: Joi.object({
      lowThreshold: Joi.number().integer().min(0).default(5),
      outOfStock: Joi.number().integer().min(0).default(0),
    }).optional(),
  }).optional(),
}).strict();

/**
 * Schéma de validation pour la mise à jour d'un produit
 */
export const updateProductSchema = Joi.object({
  // === IDENTIFICATION & INFORMATIONS ===
  title: Joi.string().trim().min(3).max(100).optional().messages({
    "string.min": "Le titre doit contenir au moins 3 caractères",
    "string.max": "Le titre ne doit pas dépasser 100 caractères",
  }),

  description: Joi.string().min(10).max(5000).optional().messages({
    "string.min": "La description doit contenir au moins 10 caractères",
    "string.max": "La description ne doit pas dépasser 5000 caractères",
  }),

  sku: Joi.string().trim().optional().allow(null, "").messages({
    "string.empty": "Le SKU ne doit pas être vide",
  }),

  category: Joi.string().optional().messages({
    "string.empty": "La catégorie ne doit pas être vide",
  }),

  tags: Joi.array().items(Joi.string().trim()).max(10).optional().messages({
    "array.max": "Maximum 10 tags autorisés",
  }),

  characteristics: Joi.object()
    .pattern(Joi.string(), Joi.alternatives().try(Joi.string(), Joi.number()))
    .optional(),


  // === TARIFICATION ===
  price: Joi.number().min(0).optional().messages({
    "number.min": "Le prix doit être positif ou nul",
  }),

  originalPrice: Joi.number().min(0).optional().messages({
    "number.min": "Le prix original doit être positif ou nul",
  }),

  // === GESTION DU STOCK ===
  stock: Joi.object({
    alert: Joi.object({
      lowThreshold: Joi.number().integer().min(0).optional(),
      outOfStock: Joi.number().integer().min(0).optional(),
    }).optional(),
  }).optional(),

  // === MODÉRATION ===
  status: Joi.string()
    .valid("DRAFT", "PENDING", "ARCHIVED")
    .optional()
    .messages({
      "any.only": "Le statut doit être DRAFT, PENDING ou ARCHIVED",
    }),
});

/**
 * Schéma de validation pour les paramètres de liste des produits
 */
export const listProductsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional().default(1).messages({
    "number.base": "La page doit être un nombre",
    "number.min": "La page doit être au moins 1",
  }),

  limit: Joi.number()
    .integer()
    .min(1)
    .max(1000)
    .optional()
    .default(10)
    .messages({
      "number.base": "La limite doit être un nombre",
      "number.min": "La limite doit être au moins 1",
      "number.max": "La limite ne doit pas dépasser 1000",
    }),

  search: Joi.string().trim().optional().messages({
    "string.empty": "La recherche ne doit pas être vide",
  }),

  category: Joi.string().trim().optional().messages({
    "string.empty": "La catégorie ne doit pas être vide",
  }),

  tags: Joi.alternatives()
    .try(Joi.string(), Joi.array().items(Joi.string()))
    .optional()
    .messages({
      "alternatives.match":
        "Les tags doivent être une chaîne ou un tableau de chaînes",
    }),

  minPrice: Joi.number().min(0).optional().messages({
    "number.min": "Le prix minimum doit être positif ou nul",
  }),

  maxPrice: Joi.number().min(0).optional().messages({
    "number.min": "Le prix maximum doit être positif ou nul",
  }),

  shopId: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .optional()
    .messages({
      "string.pattern.base":
        "L'ID de la boutique doit être un ObjectId MongoDB valide",
    }),

  sellerId: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .optional()
    .messages({
      "string.pattern.base":
        "L'ID du vendeur doit être un ObjectId MongoDB valide",
    }),

  status: Joi.string()
    .valid("DRAFT", "PENDING", "ACTIVE", "REJECTED", "ARCHIVED", "ALL")
    .optional()
    .messages({
      "any.only":
        "Le statut doit être DRAFT, PENDING, ACTIVE, REJECTED, ARCHIVED ou ALL",
    }),

  sort: Joi.string()
    .pattern(/^(-?[a-zA-Z0-9.]+|[a-zA-Z0-9.]+_(asc|desc))$/)
    .default("createdAt_desc")
    .optional()
    .messages({
      "string.pattern.base":
        "Le tri doit être au format champ_asc ou champ_desc",
    }),
});

/**
 * Schéma de validation pour la validation/rejet d'un produit (ADMIN)
 */
export const moderateProductSchema = Joi.object({
  status: Joi.string().valid("ACTIVE", "REJECTED").required().messages({
    "any.only": "Le statut doit être ACTIVE ou REJECTED",
    "any.required": "Le statut est requis",
  }),

  rejectionReason: Joi.string()
    .when("status", {
      is: "REJECTED",
      then: Joi.required().messages({
        "any.required": "La raison du rejet est requise",
      }),
      otherwise: Joi.optional(),
    })
    .max(500)
    .messages({
      "string.max": "La raison ne doit pas dépasser 500 caractères",
    }),
}).strict();

/**
 * Schéma de validation pour la mise à jour du stock
 */
export const updateStockSchema = Joi.object({
  quantity: Joi.number().integer().min(0).required().messages({
    "number.base": "La quantité doit être un nombre entier",
    "number.min": "La quantité doit être au moins 0",
    "any.required": "La quantité est requise",
  }),
  operation: Joi.string()
    .valid("add", "subtract", "set")
    .default("set")
    .optional()
    .messages({
      "any.only": "L'opération doit être 'add', 'subtract' ou 'set'",
    }),
}).strict();

/**
 * Schéma de validation pour la réservation de stock (INTERNE/SYSTEME)
 * Utilisé principalement lors des mouvements de panier/commande
 */
export const reserveStockSchema = Joi.object({
  quantity: Joi.number().integer().min(1).required().messages({
    "number.base": "La quantité doit être un nombre entier",
    "number.min": "La quantité doit être au moins 1",
    "any.required": "La quantité est requise",
  }),
  action: Joi.string()
    .valid("reserve", "release", "commit")
    .required()
    .messages({
      "any.only": "L'action doit être 'reserve', 'release' ou 'commit'",
      "any.required": "L' action est requise",
    }),
}).strict();

export const productImageIndexParamsSchema = Joi.object({
    id: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        "any.required": "L'identifiant du produit est requis",
        "string.pattern.base": "L'identifiant du produit est invalide",
      }),
    index: Joi.number().integer().min(0).required().messages({
      "number.base": "L'index doit être un nombre entier",
      "number.min": "L'index doit être supérieur ou égal à 0",
      "any.required": "L'index est requis",
    }),
});
