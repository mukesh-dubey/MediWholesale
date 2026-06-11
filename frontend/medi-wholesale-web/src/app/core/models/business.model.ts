export type CustomerType = 'Hospital' | 'Clinic' | 'MedicalStore' | 'NursingHome';

export interface Customer {
  id: number;
  name: string;
  customerType: CustomerType;
  phone: string;
  email?: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  gstin?: string;
  drugLicenseNumber: string;
  creditLimit: number;
  paymentTermDays: number;
  openingBalance: number;
  isActive: boolean;
  hasPortalAccess: boolean;
}

export interface Product {
  id: number;
  sku: string;
  name: string;
  genericName: string;
  brand?: string;
  category: string;
  unit: string;
  hsnCode: string;
  gstRatePercent: number;
  isPrescriptionRequired: boolean;
  reorderLevel: number;
  isActive: boolean;
  totalStock: number;
  saleRate: number;
}

export interface BatchStock {
  id: number;
  productId: number;
  productName: string;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  purchaseRate: number;
  saleRate: number;
  mrp: number;
  manufacturer?: string;
  rackLocation?: string;
  isExpired: boolean;
  isLowStock: boolean;
}

export interface OrderLine {
  id: number;
  productId: number;
  productName: string;
  batchNumber?: string;
  quantity: number;
  dispatchedQuantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface Order {
  id: number;
  orderNumber: string;
  customerId: number;
  customerName: string;
  orderDate: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  notes?: string;
  placedByCustomer: boolean;
  lines: OrderLine[];
}

export interface InvoiceLine {
  id: number;
  productId: number;
  productName: string;
  hsnCode: string;
  batchNumber?: string;
  expiryDate?: string;
  quantity: number;
  unitPrice: number;
  gstRatePercent: number;
  taxableAmount: number;
  discountAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  lineTotal: number;
}

export interface Invoice {
  id: number;
  invoiceNumber: string;
  salesOrderId?: number;
  orderNumber?: string;
  customerId: number;
  customerName: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  phone: string;
  email?: string;
  gstin?: string;
  invoiceDate: string;
  status: string;
  paymentStatus: string;
  supplyType: string;
  subTotal: number;
  discountAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalAmount: number;
  amountPaid: number;
  placeOfSupply?: string;
  lines: InvoiceLine[];
}

export interface Dashboard {
  totalCustomers: number;
  totalProducts: number;
  lowStockBatches: number;
  expiringBatches: number;
  pendingOrders: number;
  outstandingAmount: number;
}
