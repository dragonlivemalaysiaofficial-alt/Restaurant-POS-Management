
export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  description?: string;
  imageUrl?: string;
  stockTracking: boolean;
  stock: number;
  commonNotes?: string[];
}

export interface CartItem {
  cartItemId: string;
  menuItem: MenuItem;
  quantity: number;
  note?: string;
}

export interface Discount {
  id:string;
  description: string;
  type: 'percentage' | 'fixed';
  value: number;
}

export type PaymentMethod = 'cash' | 'card' | 'bank';

export type KitchenStatus = 'Pending' | 'Preparing' | 'Ready';

export interface Customer {
  id: string;
  name: string;
  phone: string;
}

export interface Order {
  id: string;
  orderType: 'dine-in' | 'takeaway';
  tableId?: string;
  takeawayNumber?: number;
  items: CartItem[];
  subtotal: number;
  tax: number;
  taxRate: number;
  total: number;
  date: Date;
  status: 'active' | 'billed' | 'paid' | 'split' | 'cancelled';
  discounts: Discount[];
  totalDiscountAmount?: number;
  paymentMethod?: PaymentMethod;
  kitchenStatus?: KitchenStatus;
  createdBy: string;
  customer?: Customer;
  parentOrderId?: string;
  splitBillNumber?: number;
  totalSplitBills?: number;
  kot?: number;
  bot?: number;
  cancelledBy?: string;
  cancellationReason?: string;
}

export interface Category {
  id: string;
  name: string;
}

export type UserRole = 'Admin' | 'Manager' | 'Waiter' | 'Cashier';

export interface User {
  id: string;
  name: string;
  username: string;
  pin: string;
  role: UserRole;
}

export interface RestaurantSettings {
  restaurantName: string;
  address: string;
  phone: string;
  currencySymbol: string;
  taxRate: number;
  numberOfTables: number;
  footerMessage: string;
  commonNotes: string[];
  kotBotCategoryAssignments: {
    kitchen: string[];
    bar: string[];
  };
  managerPermissions: {
    canManageMenu: boolean;
    canManageUsers: boolean;
    canViewReports: boolean;
    canManageCustomers: boolean;
    canAccessAdminPanel: boolean;
  };
}

export enum View {
  POS = 'POS',
  MANAGE_MENU = 'MANAGE_MENU',
  REPORTS = 'REPORTS',
  KITCHEN_DISPLAY = 'KITCHEN_DISPLAY',
  BAR_DISPLAY = 'BAR_DISPLAY',
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  sources?: {
    web?: { uri?: string; title?: string };
    maps?: { uri?: string; title?: string };
  }[];
}

export interface ToastNotification {
  id: number;
  message: string;
  type: 'success' | 'error';
}

export interface DaySession {
    startTime: Date;
    startedBy: string;
}
