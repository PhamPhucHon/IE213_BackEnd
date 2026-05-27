export type ObjectId = string;

export type Address = {
  _id: ObjectId;
  label?: string;
  address: string;
  isDefault?: boolean;
};

export type User = {
  _id: ObjectId;
  name: string;
  email: string;
  avatar?: string;
  phone?: string;
  isAdmin?: boolean;
  isActive?: boolean;
  deletedAt?: string | null;
  addresses?: Address[];
  createdAt?: string;
  updatedAt?: string;
};

export type Category = {
  _id: ObjectId;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  isActive?: boolean;
  order?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type ProductVariant = {
  _id?: ObjectId;
  sku: string;
  color?: string;
  price: number;
  originalPrice?: number;
  images?: string[];
  isDefault?: boolean;
};

export type ProductSpecifications = {
  material?: string;
  lensMaterial?: string;
  origin?: string;
  gender?: "Male" | "Female" | "Unisex";
  size?: {
    dimensions?: string;
    width?: number;
    angle?: number;
    bridge?: number;
    totalWidth?: number;
    longestDiameter?: number;
  };
};

export type Product = {
  _id: ObjectId;
  name: string;
  slug: string;
  description: string;
  brand: string;
  type?: "Sunglasses" | "Eyeglasses" | "All";
  categoryId: ObjectId | Pick<Category, "_id" | "name" | "slug">;
  sale?: boolean;
  availability?: "in_stock" | "out_of_stock" | "pre_order";
  specifications?: ProductSpecifications;
  variants: ProductVariant[];
  images?: string[];
  rating?: {
    avg: number;
    count: number;
  };
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type ReviewReply = {
  _id?: ObjectId;
  adminId?: ObjectId;
  adminName?: string;
  comment: string;
  createdAt?: string;
};

export type Review = {
  _id: ObjectId;
  productId: ObjectId | Pick<Product, "_id" | "name" | "slug" | "brand">;
  userId: ObjectId;
  userName: string;
  userAvatar?: string;
  rating: number;
  title?: string;
  comment: string;
  images?: string[];
  likes?: number;
  replies?: ReviewReply[];
  isVerifiedPurchase?: boolean;
  isApproved?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type CartItem = {
  _id?: ObjectId;
  productId: ObjectId;
  sku: string;
  name?: string;
  image?: string;
  price: number;
  quantity: number;
};

export type Cart = {
  _id: ObjectId;
  userId: ObjectId;
  items: CartItem[];
  totalPrice: number;
  updatedAt?: string;
};

export type PaymentMethod = "COD" | "Momo" | "BankTransfer";

export type OrderStatus = "Pending" | "Processing" | "Shipped" | "Delivered" | "Cancelled";

export type ShippingAddress = {
  fullName: string;
  phone: string;
  address: string;
};

export type Order = {
  _id: ObjectId;
  orderNumber: string;
  userId: ObjectId | Pick<User, "_id" | "name" | "email" | "phone">;
  items: CartItem[];
  shippingAddress: ShippingAddress;
  paymentMethod: PaymentMethod;
  paymentResult?: {
    id?: string;
    status?: string;
    updateTime?: string;
  };
  itemsPrice: number;
  shippingPrice: number;
  totalPrice: number;
  status: OrderStatus;
  isPaid: boolean;
  paidAt?: string;
  deliveredAt?: string;
  note?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type Inventory = {
  _id: ObjectId;
  sku: string;
  productId: ObjectId | Pick<Product, "_id" | "name" | "slug">;
  stock: number;
  reserved: number;
  available: number;
  warehouse?: string;
  lastRestocked?: string;
};

export type StatsOverview = {
  totalUsers: number;
  totalOrders: number;
  revenueThisMonth: number;
  lowStockCount: number;
};

export type TopProduct = {
  _id: ObjectId;
  name: string;
  image?: string;
  slug?: string;
  isActive?: boolean;
  rating?: Product["rating"];
  totalSold: number;
  totalRevenue: number;
};
