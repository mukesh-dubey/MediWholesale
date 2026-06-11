import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import {
  BatchStock,
  Customer,
  CustomerType,
  Dashboard,
  Invoice,
  Order,
  Product,
} from '../models/business.model';

export type CreateCustomerPayload = Omit<Customer, 'id' | 'isActive' | 'hasPortalAccess'>;
export type UpdateCustomerPayload = Omit<Customer, 'id' | 'hasPortalAccess'>;

export type CreateProductPayload = Omit<Product, 'id' | 'isActive' | 'totalStock' | 'saleRate'>;
export type UpdateProductPayload = Omit<Product, 'id' | 'totalStock' | 'saleRate'>;

export type CreateBatchPayload = {
  productId: number;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  purchaseRate: number;
  saleRate: number;
  mrp: number;
  manufacturer?: string;
  rackLocation?: string;
};

export type UpdateBatchPayload = Omit<CreateBatchPayload, 'productId'>;

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  getDashboard() {
    return this.http.get<Dashboard>(`${this.base}/dashboard`);
  }

  // Customers
  getCustomers(search?: string) {
    let params = new HttpParams();
    if (search) params = params.set('search', search);
    return this.http.get<Customer[]>(`${this.base}/customers`, { params });
  }

  createCustomer(body: CreateCustomerPayload) {
    return this.http.post<Customer>(`${this.base}/customers`, body);
  }

  updateCustomer(id: number, body: UpdateCustomerPayload) {
    return this.http.put<Customer>(`${this.base}/customers/${id}`, body);
  }

  deleteCustomer(id: number) {
    return this.http.delete<void>(`${this.base}/customers/${id}`);
  }

  // Products
  getProducts(search?: string, includeInactive = false) {
    let params = new HttpParams();
    if (search) params = params.set('search', search);
    if (includeInactive) params = params.set('includeInactive', 'true');
    return this.http.get<Product[]>(`${this.base}/products`, { params });
  }

  createProduct(body: CreateProductPayload) {
    return this.http.post<Product>(`${this.base}/products`, body);
  }

  updateProduct(id: number, body: UpdateProductPayload) {
    return this.http.put<Product>(`${this.base}/products/${id}`, body);
  }

  deleteProduct(id: number) {
    return this.http.delete<void>(`${this.base}/products/${id}`);
  }

  // Inventory batches
  getBatches(opts?: { expiringOnly?: boolean; lowStockOnly?: boolean }) {
    let params = new HttpParams();
    if (opts?.expiringOnly) params = params.set('expiringOnly', 'true');
    if (opts?.lowStockOnly) params = params.set('lowStockOnly', 'true');
    return this.http.get<BatchStock[]>(`${this.base}/inventory/batches`, { params });
  }

  createBatch(body: CreateBatchPayload) {
    return this.http.post<BatchStock>(`${this.base}/inventory/batches`, body);
  }

  updateBatch(id: number, body: UpdateBatchPayload) {
    return this.http.put<BatchStock>(`${this.base}/inventory/batches/${id}`, body);
  }

  deleteBatch(id: number) {
    return this.http.delete<void>(`${this.base}/inventory/batches/${id}`);
  }

  // Orders
  getOrders(status?: string) {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    return this.http.get<Order[]>(`${this.base}/orders`, { params });
  }

  createOrder(body: {
    customerId: number;
    notes?: string;
    lines: { productId: number; quantity: number; unitPrice: number }[];
  }) {
    return this.http.post<Order>(`${this.base}/orders`, body);
  }

  updateOrderStatus(id: number, status: string) {
    return this.http.patch<Order>(`${this.base}/orders/${id}/status`, null, {
      params: new HttpParams().set('status', status),
    });
  }

  cancelOrder(id: number) {
    return this.http.delete<void>(`${this.base}/orders/${id}`);
  }

  // Invoices
  getInvoices() {
    return this.http.get<Invoice[]>(`${this.base}/invoices`);
  }

  getInvoice(id: number) {
    return this.http.get<Invoice>(`${this.base}/invoices/${id}`);
  }
}

export const CUSTOMER_TYPES: CustomerType[] = [
  'Hospital',
  'Clinic',
  'MedicalStore',
  'NursingHome',
];
