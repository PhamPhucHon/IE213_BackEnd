const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

const Category = require('../models/Category');
const User = require('../models/User');
const Product = require('../models/Product');
const Inventory = require('../models/Inventory');
const Cart = require('../models/Cart');
const Order = require('../models/Order');
const Review = require('../models/Review');
const LoginLog = require('../models/LoginLog');

const dataDir = path.join(__dirname, 'data');

const readSeed = (fileName) => {
	const filePath = path.join(dataDir, fileName);
	if (!fs.existsSync(filePath)) return [];

	const raw = fs.readFileSync(filePath, 'utf8');
	return raw ? JSON.parse(raw) : [];
};

const readCollections = () => {
	const filePath = path.join(dataDir, 'colections.text');
	if (!fs.existsSync(filePath)) return [];

	const raw = fs.readFileSync(filePath, 'utf8');
	if (!raw) return [];

	// File collections không phải JSON hợp lệ tuyệt đối, nên parse theo từng block object.
	const blocks = raw.match(/\{[\s\S]*?\}/g) || [];

	return blocks
		.map((block) => {
			const categorySlugMatch = block.match(/"slug"\s*:\s*"([^"]+)"/);
			if (!categorySlugMatch) return null;

			const categorySlug = categorySlugMatch[1];
			const listMatch =
				block.match(/"?product_slug"?\s*:\s*\[([\s\S]*?)\]/) ||
				block.match(/"?product_sku"?\s*:\s*\[([\s\S]*?)\]/);

			const values = [];
			if (listMatch?.[1]) {
				const inner = listMatch[1];
				const strMatches = inner.match(/"([^"]+)"/g) || [];
				for (const item of strMatches) {
					values.push(item.replace(/"/g, '').trim());
				}
			}

			return {
				categorySlug,
				productSlugs: values.filter(Boolean),
			};
		})
		.filter(Boolean);
};

const connectMongo = async () => {
	const uri = process.env.MONGODB_URI;
	if (!uri) {
		throw new Error('Thiếu MONGODB_URI trong file .env');
	}

	await mongoose.connect(uri, {
		serverSelectionTimeoutMS: 5000,
		socketTimeoutMS: 45000,
	});
};

const buildProductCategoryIdMap = (categorySlugMap) => {
	const collectionRows = readCollections();
	const productCategoryIdMap = new Map();

	for (const row of collectionRows) {
		const categoryId = categorySlugMap.get(row.categorySlug);
		if (!categoryId) continue;

		for (const productSlug of row.productSlugs) {
			if (!productCategoryIdMap.has(productSlug)) {
				productCategoryIdMap.set(productSlug, categoryId);
			}
		}
	}

	return productCategoryIdMap;
};

const clearCollections = async () => {
	await Promise.all([
		LoginLog.deleteMany({}),
		Review.deleteMany({}),
		Order.deleteMany({}),
		Cart.deleteMany({}),
		Inventory.deleteMany({}),
		Product.deleteMany({}),
		User.deleteMany({}),
		Category.deleteMany({}),
	]);
};

const seedCategories = async () => {
	const categories = readSeed('category.json');
	if (!categories.length) return { categoryDocs: [], categorySlugMap: new Map(), fallbackCategoryId: null };

	const categoryDocs = await Category.insertMany(categories);
	const categorySlugMap = new Map(categoryDocs.map((c) => [c.slug, c._id]));
	const fallbackCategoryId = categoryDocs[0]?._id || null;
	return { categoryDocs, categorySlugMap, fallbackCategoryId };
};

const seedUsers = async () => {
	const users = readSeed('users.json');
	if (!users.length) return { userDocs: [], userEmailMap: new Map() };

	// Dùng create để kích hoạt pre-save hash password
	const userDocs = [];
	for (const user of users) {
		const doc = await User.create(user);
		userDocs.push(doc);
	}

	const userEmailMap = new Map(userDocs.map((u) => [u.email, u]));
	return { userDocs, userEmailMap };
};

const seedProducts = async (categorySlugMap, fallbackCategoryId) => {
	const products = readSeed('products.json');
	if (!products.length) return { productDocs: [], productSlugMap: new Map(), skuProductIdMap: new Map() };

	const productCategoryIdMap = buildProductCategoryIdMap(categorySlugMap);

	const productDocs = await Product.insertMany(
		products.map((p) => ({
			...p,
			categoryId: productCategoryIdMap.get(p.slug) || fallbackCategoryId,
		}))
	);

	const productSlugMap = new Map(productDocs.map((p) => [p.slug, p]));
	const skuProductIdMap = new Map();
	for (const p of productDocs) {
		for (const v of p.variants || []) {
			if (v.sku) {
				skuProductIdMap.set(v.sku, p._id);
			}
		}
	}

	return { productDocs, productSlugMap, skuProductIdMap };
};

const syncCategoryTotals = async () => {
	const counts = await Product.aggregate([
		{ $group: { _id: '$categoryId', total: { $sum: 1 } } },
	]);

	await Category.updateMany({}, { $set: { total_products: 0 } });

	if (!counts.length) return { updatedCategories: 0 };

	const ops = counts.map((row) => ({
		updateOne: {
			filter: { _id: row._id },
			update: { $set: { total_products: row.total } },
		},
	}));

	const result = await Category.bulkWrite(ops);
	return { updatedCategories: result.modifiedCount ?? 0 };
};

const seedInventory = async (productSlugMap) => {
	const inventories = readSeed('inventory.json');
	if (!inventories.length) return [];

	const docs = inventories
		.map((row) => {
			const product = productSlugMap.get(row.productSlug);
			if (!product) return null;

			return {
				sku: row.sku,
				productId: product._id,
				stock: row.stock ?? 0,
				reserved: row.reserved ?? 0,
				warehouse: row.warehouse || 'main',
				...(row.lastRestocked ? { lastRestocked: row.lastRestocked } : {}),
			};
		})
		.filter(Boolean);

	if (!docs.length) return [];
	return Inventory.insertMany(docs);
};

const seedCarts = async (userEmailMap, productSlugMap) => {
	const carts = readSeed('cart.json');
	if (!carts.length) return [];

	const docs = carts
		.map((cart) => {
			const user = userEmailMap.get(cart.userEmail);
			if (!user) return null;

			const items = (cart.items || [])
				.map((item) => {
					const product = productSlugMap.get(item.productSlug);
					if (!product) return null;
					return {
						productId: product._id,
						sku: item.sku,
						name: item.name,
						image: item.image,
						price: item.price,
						quantity: item.quantity,
					};
				})
				.filter(Boolean);

			if (!items.length) return null;

			return {
				userId: user._id,
				items,
				totalPrice: cart.totalPrice ?? items.reduce((sum, it) => sum + it.price * it.quantity, 0),
			};
		})
		.filter(Boolean);

	if (!docs.length) return [];
	return Cart.insertMany(docs);
};

const seedOrders = async (userEmailMap, productSlugMap) => {
	const orders = readSeed('order.json');
	if (!orders.length) return [];

	const docs = orders
		.map((order) => {
			const user = userEmailMap.get(order.userEmail);
			if (!user) return null;

			const items = (order.items || [])
				.map((item) => {
					const product = productSlugMap.get(item.productSlug);
					if (!product) return null;
					return {
						productId: product._id,
						sku: item.sku,
						name: item.name,
						image: item.image,
						price: item.price,
						quantity: item.quantity,
					};
				})
				.filter(Boolean);

			if (!items.length) return null;

			return {
				orderNumber: order.orderNumber,
				userId: user._id,
				items,
				shippingAddress: order.shippingAddress,
				paymentMethod: order.paymentMethod,
				...(order.paymentResult ? { paymentResult: order.paymentResult } : {}),
				itemsPrice: order.itemsPrice,
				shippingPrice: order.shippingPrice,
				totalPrice: order.totalPrice,
				status: order.status,
				isPaid: order.isPaid,
				...(order.paidAt ? { paidAt: order.paidAt } : {}),
				...(order.deliveredAt ? { deliveredAt: order.deliveredAt } : {}),
				...(order.note ? { note: order.note } : {}),
				...(order.createdAt ? { createdAt: order.createdAt } : {}),
			};
		})
		.filter(Boolean);

	if (!docs.length) return [];
	return Order.insertMany(docs);
};

const seedReviews = async (userEmailMap, productSlugMap) => {
	const reviews = readSeed('review.json');
	if (!reviews.length) return [];

	const docs = reviews
		.map((review) => {
			const user = userEmailMap.get(review.userEmail);
			const product = productSlugMap.get(review.productSlug);
			if (!user || !product) return null;

			return {
				productId: product._id,
				userId: user._id,
				userName: user.name,
				userAvatar: user.avatar || '',
				rating: review.rating,
				title: review.title,
				comment: review.comment,
				isApproved: review.isApproved ?? true,
				...(review.images ? { images: review.images } : {}),
			};
		})
		.filter(Boolean);

	if (!docs.length) return [];

	// Dùng create để chạy middleware tính rating và verified purchase
	return Review.create(docs);
};

const seedLoginLogs = async (userEmailMap) => {
	const logs = readSeed('loginlog.json');
	if (!logs.length) return [];

	const docs = logs.map((log) => {
		const user = userEmailMap.get(log.email);

		return {
			...(user ? { userId: user._id } : {}),
			email: log.email,
			status: log.status,
			ipAddress: log.ipAddress,
			userAgent: log.userAgent,
			...(log.failureReason ? { failureReason: log.failureReason } : {}),
			...(log.createdAt ? { createdAt: log.createdAt } : {}),
		};
	});

	return LoginLog.insertMany(docs);
};

const run = async () => {
	try {
		await connectMongo();
		console.log('✅ Connected to MongoDB');

		await clearCollections();
		console.log('🧹 Cleared existing seed data');

		const { categoryDocs, categorySlugMap, fallbackCategoryId } = await seedCategories();
		console.log(`✅ Seeded categories: ${categoryDocs.length}`);

		const { userDocs, userEmailMap } = await seedUsers();
		console.log(`✅ Seeded users: ${userDocs.length}`);

		const { productDocs, productSlugMap } = await seedProducts(categorySlugMap, fallbackCategoryId);
		console.log(`✅ Seeded products: ${productDocs.length}`);

		const { updatedCategories } = await syncCategoryTotals();
		console.log(`🔄 Synced category total_products: ${updatedCategories}`);

		const inventoryDocs = await seedInventory(productSlugMap);
		console.log(`✅ Seeded inventory: ${inventoryDocs.length}`);

		const cartDocs = await seedCarts(userEmailMap, productSlugMap);
		console.log(`✅ Seeded carts: ${cartDocs.length}`);

		const orderDocs = await seedOrders(userEmailMap, productSlugMap);
		console.log(`✅ Seeded orders: ${orderDocs.length}`);

		const reviewDocs = await seedReviews(userEmailMap, productSlugMap);
		console.log(`✅ Seeded reviews: ${reviewDocs.length}`);

		const loginLogDocs = await seedLoginLogs(userEmailMap);
		console.log(`✅ Seeded login logs: ${loginLogDocs.length}`);

		console.log('🎉 Seeding completed successfully');
		process.exit(0);
	} catch (error) {
		console.error('❌ Seeding failed:', error.message);
		process.exit(1);
	} finally {
		await mongoose.connection.close();
	}
};

run();
