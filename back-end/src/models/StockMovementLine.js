import mongoose from "mongoose";
import { IN_MOVEMENTS, MOVEMENT_TYPES } from "./StockMovement.js";

const stockMovementLineSchema = new mongoose.Schema(
	{
		reference: {
			type: String,
			unique: true,
			required: true,
		},
		moveId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "StockMovement",
			required: true,
		},
		productId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Product",
			required: true,
		},
		shopId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Shop",
			required: true,
		},
		movementType: {
			type: String,
			enum: MOVEMENT_TYPES,
			required: true,
		},
		cartId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Cart",
		},
		direction: {
			type: String,
			enum: ["IN", "OUT"],
			required: true,
		},
		quantity: {
			type: Number,
			required: true,
			min: 1,
		},
		unitPrice: {
			type: Number,
			default: 0,
			min: 0,
		},
		totalAmount: {
			type: Number,
			default: 0,
			min: 0,
		},
		stockBefore: {
			type: Number,
			required: true,
		},
		stockAfter: {
			type: Number,
			required: true,
		},
		performedBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
		},
		date: Date,
	},
	{ timestamps: true },
);

stockMovementLineSchema.index({ moveId: 1, createdAt: -1 });
stockMovementLineSchema.index({ productId: 1, createdAt: -1 });
stockMovementLineSchema.index({ shopId: 1, movementType: 1, createdAt: -1 });
stockMovementLineSchema.index({ movementType: 1, createdAt: -1 });
stockMovementLineSchema.index({ cartId: 1, createdAt: -1 });

stockMovementLineSchema.pre("validate", function () {
	if (!this.direction) {
		this.direction = IN_MOVEMENTS.includes(this.movementType) ? "IN" : "OUT";
	}
});

stockMovementLineSchema.statics.calculateStock = async function (productId) {
	const result = await this.aggregate([
		{ $match: { productId: new mongoose.Types.ObjectId(productId) } },
		{
			$group: {
				_id: null,
				totalIn: {
					$sum: {
						$cond: [
							{
								$and: [
									{ $eq: ["$direction", "IN"] },
									{
										$not: [
											{
												$in: ["$movementType", ["RESERVATION", "RESERVATION_CANCEL"]],
											},
										],
									},
								],
							},
							"$quantity",
							0,
						],
					},
				},
				totalOut: {
					$sum: {
						$cond: [
							{
								$and: [
									{ $eq: ["$direction", "OUT"] },
									{
										$not: [
											{
												$in: ["$movementType", ["RESERVATION", "RESERVATION_CANCEL"]],
											},
										],
									},
								],
							},
							"$quantity",
							0,
						],
					},
				},
				reserved: {
					$sum: {
						$cond: [{ $eq: ["$movementType", "RESERVATION"] }, "$quantity", 0],
					},
				},
				reservedCancelled: {
					$sum: {
						$cond: [{ $eq: ["$movementType", "RESERVATION_CANCEL"] }, "$quantity", 0],
					},
				},
			},
		},
		{
			$project: {
				_id: 0,
				total: { $subtract: ["$totalIn", "$totalOut"] },
				reserved: { $subtract: ["$reserved", "$reservedCancelled"] },
				available: {
					$subtract: [
						{ $subtract: ["$totalIn", "$totalOut"] },
						{ $subtract: ["$reserved", "$reservedCancelled"] },
					],
				},
			},
		},
	]);

	return result[0] || { total: 0, reserved: 0, available: 0 };
};

export default mongoose.model("StockMovementLine", stockMovementLineSchema);
