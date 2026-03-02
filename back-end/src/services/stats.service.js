import Product from "../models/Product.js";
import Shop from "../models/Shop.js";
import StockMovementLine from "../models/StockMovementLine.js";

const withSession = (query, session) => {
  if (session) query.session(session);
  return query;
};

export const incrementProductViews = async (productId, session = null) => {
  await Product.findByIdAndUpdate(
    productId,
    { $inc: { "stats.views": 1 } },
    session ? { session } : undefined,
  );
};

export const applySaleOrReturnLineStats = async (
  {
    movementType,
    productId,
    shopId,
    quantity,
    totalAmount,
  },
  session = null,
) => {
  let sign = 0;
  if (movementType === "SALE") sign = 1;
  if (movementType === "RETURN_CUSTOMER") sign = -1;
  if (sign === 0) return;

  await Promise.all([
    Product.findByIdAndUpdate(
      productId,
      { $inc: { "stats.sales": sign * Number(quantity || 0) } },
      session ? { session } : undefined,
    ),
    Shop.findByIdAndUpdate(
      shopId,
      { $inc: { "stats.totalSales": sign * Number(totalAmount || 0) } },
      session ? { session } : undefined,
    ),
  ]);
};

export const applyDeliveredStatsForSaleMovement = async (
  saleMovementId,
  { reverse = false, session = null } = {},
) => {
  const sign = reverse ? -1 : 1;

  const aggregateQuery = StockMovementLine.aggregate([
    { $match: { moveId: saleMovementId } },
    {
      $group: {
        _id: {
          productId: "$productId",
          shopId: "$shopId",
        },
        quantity: { $sum: "$quantity" },
        totalAmount: { $sum: "$totalAmount" },
      },
    },
  ]);

  if (session) aggregateQuery.session(session);
  const grouped = await aggregateQuery;
  if (!grouped.length) return;

  const productOps = [];
  const shopAmountById = new Map();

  for (const item of grouped) {
    productOps.push({
      updateOne: {
        filter: { _id: item._id.productId },
        update: {
          $inc: { "stats.deliveredSales": sign * Number(item.quantity || 0) },
        },
      },
    });

    const key = item._id.shopId.toString();
    const previous = shopAmountById.get(key) || 0;
    shopAmountById.set(key, previous + Number(item.totalAmount || 0));
  }

  const shopOps = [];
  for (const [shopId, amount] of shopAmountById.entries()) {
    shopOps.push({
      updateOne: {
        filter: { _id: shopId },
        update: {
          $inc: { "stats.deliveredSalesAmount": sign * amount },
        },
      },
    });
  }

  await Promise.all([
    productOps.length
      ? Product.bulkWrite(productOps, session ? { session } : undefined)
      : Promise.resolve(),
    shopOps.length
      ? Shop.bulkWrite(shopOps, session ? { session } : undefined)
      : Promise.resolve(),
  ]);
};

export const recomputeShopProductStatusCounters = async (
  shopId,
  session = null,
) => {
  const [pending, active, archived] = await Promise.all([
    withSession(Product.countDocuments({ shopId, status: "PENDING" }), session),
    withSession(Product.countDocuments({ shopId, status: "ACTIVE" }), session),
    withSession(Product.countDocuments({ shopId, status: "ARCHIVED" }), session),
  ]);

  await Shop.findByIdAndUpdate(
    shopId,
    {
      $set: {
        "stats.products.pending": pending,
        "stats.products.active": active,
        "stats.products.archived": archived,
      },
    },
    session ? { session } : undefined,
  );
};
