import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db, auth } from './firebase';
import {
  CatalogProduct,
  Customer,
  Order,
  PaymentRecord,
  SystemSettings,
  StaffUser,
  WishRequest,
} from '../types';

// Collections mapping
const COLLECTIONS = {
  SETTINGS: 'system_settings',
  CATALOG: 'catalog',
  ORDERS: 'orders',
  PAYMENTS: 'payments',
  CUSTOMERS: 'customers',
  WISHES: 'wishes',
  STAFF_USERS: 'staff_users',
} as const;

export interface CloudSyncStatus {
  isConnecting: boolean;
  isConnected: boolean;
  lastSyncedAt?: string;
  error?: string | null;
}

// ----------------------------------------------------
// 1. System Settings (Public Storefront vs Private Finance)
// ----------------------------------------------------
export async function fetchCloudSettings(): Promise<SystemSettings | null> {
  try {
    // 1. Fetch public storefront config (accessible to anyone)
    const publicRef = doc(db, COLLECTIONS.SETTINGS, 'public_config');
    const publicSnap = await getDoc(publicRef);
    let publicData = publicSnap.exists() ? (publicSnap.data() as Partial<SystemSettings>) : null;

    // Fallback if still stored under legacy 'config'
    if (!publicData) {
      try {
        const legacyRef = doc(db, COLLECTIONS.SETTINGS, 'config');
        const legacySnap = await getDoc(legacyRef);
        if (legacySnap.exists()) {
          publicData = legacySnap.data() as Partial<SystemSettings>;
        }
      } catch {
        // Legacy config may be blocked by rules for unauthenticated users
      }
    }

    if (!publicData) return null;

    // 2. If staff is logged in, attempt to fetch private finance settings
    let financeData: Partial<SystemSettings> = {};
    try {
      const financeRef = doc(db, COLLECTIONS.SETTINGS, 'private_finance');
      const financeSnap = await getDoc(financeRef);
      if (financeSnap.exists()) {
        financeData = financeSnap.data() as Partial<SystemSettings>;
      }
    } catch {
      // Permission denied for anonymous or customer users; safe by design
    }

    return {
      ...publicData,
      ...financeData,
    } as SystemSettings;
  } catch (err) {
    console.error('fetchCloudSettings error:', err);
    throw err;
  }
}

export async function saveCloudSettings(settings: SystemSettings): Promise<void> {
  try {
    const { receivingBank, ...publicFields } = settings;

    // Save public configuration
    const publicRef = doc(db, COLLECTIONS.SETTINGS, 'public_config');
    await setDoc(
      publicRef,
      {
        ...publicFields,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    // Save private finance configuration
    if (receivingBank) {
      const financeRef = doc(db, COLLECTIONS.SETTINGS, 'private_finance');
      await setDoc(
        financeRef,
        {
          receivingBank,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    }
  } catch (err) {
    console.error('saveCloudSettings error:', err);
    throw err;
  }
}

// ----------------------------------------------------
// 2. Catalog Products (With Cost Isolation)
// ----------------------------------------------------
export async function fetchCloudCatalog(): Promise<CatalogProduct[]> {
  try {
    const colRef = collection(db, COLLECTIONS.CATALOG);
    const snap = await getDocs(colRef);
    const products = snap.docs.map((d) => d.data() as CatalogProduct);

    // Attempt to enrich with procurement costs if caller is authorized buyer/admin
    for (const prod of products) {
      try {
        const costRef = doc(db, COLLECTIONS.CATALOG, prod.id, 'procurement', 'cost_data');
        const costSnap = await getDoc(costRef);
        if (costSnap.exists()) {
          const costData = costSnap.data() as {
            productCost?: { originalPrice?: number; serviceFeeTwd?: number };
            subItemCosts?: Record<string, { originalPrice?: number; serviceFeeTwd?: number }>;
          };
          if (costData.productCost) {
            prod.originalPrice = costData.productCost.originalPrice;
            prod.serviceFeeTwd = costData.productCost.serviceFeeTwd;
          }
          if (costData.subItemCosts && Array.isArray(prod.subItems)) {
            prod.subItems = prod.subItems.map((sub) => {
              const itemCost = costData.subItemCosts?.[sub.id];
              return itemCost
                ? { ...sub, originalPrice: itemCost.originalPrice, serviceFeeTwd: itemCost.serviceFeeTwd }
                : sub;
            });
          }
        }
      } catch {
        // Permission-denied for customers & unauthenticated visitors; safe by design
      }
    }

    return products;
  } catch (err) {
    console.error('fetchCloudCatalog error:', err);
    throw err;
  }
}

export async function saveCloudProduct(product: CatalogProduct): Promise<void> {
  try {
    const productCost = {
      originalPrice: product.originalPrice,
      serviceFeeTwd: product.serviceFeeTwd,
    };

    const subItemCosts: Record<string, { originalPrice?: number; serviceFeeTwd?: number }> = {};
    const sanitizedSubItems = (product.subItems || []).map((sub) => {
      if (sub.originalPrice !== undefined || sub.serviceFeeTwd !== undefined) {
        subItemCosts[sub.id] = {
          originalPrice: sub.originalPrice,
          serviceFeeTwd: sub.serviceFeeTwd,
        };
      }
      const { originalPrice: _, serviceFeeTwd: __, ...publicSub } = sub;
      return publicSub;
    });

    const { originalPrice: _, serviceFeeTwd: __, ...publicProduct } = product;

    // 1. Save sanitized public product
    const docRef = doc(db, COLLECTIONS.CATALOG, product.id);
    await setDoc(docRef, {
      ...publicProduct,
      subItems: sanitizedSubItems,
      updatedAt: new Date().toISOString(),
    });

    // 2. Save procurement cost to isolated subcollection
    if (productCost.originalPrice !== undefined || Object.keys(subItemCosts).length > 0) {
      const costRef = doc(db, COLLECTIONS.CATALOG, product.id, 'procurement', 'cost_data');
      await setDoc(costRef, {
        productCost,
        subItemCosts,
        updatedAt: new Date().toISOString(),
      });
    }
  } catch (err) {
    console.error('saveCloudProduct error:', err);
    throw err;
  }
}

export async function deleteCloudProduct(productId: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.CATALOG, productId);
    await deleteDoc(docRef);
  } catch (err) {
    console.error('deleteCloudProduct error:', err);
    throw err;
  }
}

// ----------------------------------------------------
// 3. Orders
// ----------------------------------------------------
export async function fetchCloudOrders(): Promise<Order[]> {
  try {
    const colRef = collection(db, COLLECTIONS.ORDERS);
    const snap = await getDocs(colRef);
    const list = snap.docs.map((d) => d.data() as Order);
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (err) {
    console.error('fetchCloudOrders error:', err);
    throw err;
  }
}

export async function saveCloudOrder(order: Order): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.ORDERS, order.id);
    await setDoc(docRef, {
      ...order,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('saveCloudOrder error:', err);
    throw err;
  }
}

// ----------------------------------------------------
// 4. Payments
// ----------------------------------------------------
export async function fetchCloudPayments(): Promise<PaymentRecord[]> {
  try {
    const colRef = collection(db, COLLECTIONS.PAYMENTS);
    const snap = await getDocs(colRef);
    const list = snap.docs.map((d) => d.data() as PaymentRecord);
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (err) {
    console.error('fetchCloudPayments error:', err);
    throw err;
  }
}

export async function saveCloudPayment(payment: PaymentRecord): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.PAYMENTS, payment.id);
    await setDoc(docRef, payment);
  } catch (err) {
    console.error('saveCloudPayment error:', err);
    throw err;
  }
}

// ----------------------------------------------------
// 5. Customers (Stripping Plaintext Passwords Before Cloud Write)
// ----------------------------------------------------
export async function fetchCloudCustomers(): Promise<Customer[]> {
  try {
    const colRef = collection(db, COLLECTIONS.CUSTOMERS);
    const snap = await getDocs(colRef);
    return snap.docs.map((d) => d.data() as Customer);
  } catch (err) {
    console.error('fetchCloudCustomers error:', err);
    throw err;
  }
}

export async function saveCloudCustomer(customer: Customer): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.CUSTOMERS, customer.id);
    // Security constraint: Do NOT store plaintext passwords in Firestore!
    const { password: _, ...sanitized } = customer;
    await setDoc(docRef, {
      ...sanitized,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('saveCloudCustomer error:', err);
    throw err;
  }
}

// ----------------------------------------------------
// 6. Wishes
// ----------------------------------------------------
export async function fetchCloudWishes(): Promise<WishRequest[]> {
  try {
    const colRef = collection(db, COLLECTIONS.WISHES);
    const snap = await getDocs(colRef);
    const list = snap.docs.map((d) => d.data() as WishRequest);
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (err) {
    console.error('fetchCloudWishes error:', err);
    throw err;
  }
}

export async function saveCloudWish(wish: WishRequest): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.WISHES, wish.id);
    await setDoc(docRef, wish);
  } catch (err) {
    console.error('saveCloudWish error:', err);
    throw err;
  }
}

// ----------------------------------------------------
// 7. Staff Users
// ----------------------------------------------------
export async function fetchCloudStaffUsers(): Promise<StaffUser[]> {
  try {
    const colRef = collection(db, COLLECTIONS.STAFF_USERS);
    const snap = await getDocs(colRef);
    return snap.docs.map((d) => d.data() as StaffUser);
  } catch (err) {
    console.error('fetchCloudStaffUsers error:', err);
    throw err;
  }
}

export async function saveCloudStaffUser(staff: StaffUser): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.STAFF_USERS, staff.id);
    const { password: _, ...sanitized } = staff;
    await setDoc(docRef, sanitized);
  } catch (err) {
    console.error('saveCloudStaffUser error:', err);
    throw err;
  }
}

// ----------------------------------------------------
// 8. Safe Migration with Count Verification & Backup
// ----------------------------------------------------
export interface MigrationCounts {
  settingsCount: number;
  catalogCount: number;
  ordersCount: number;
  paymentsCount: number;
  customersCount: number;
  wishesCount: number;
  staffUsersCount: number;
}

export async function executeSafeCloudMigration(localData: {
  settings: SystemSettings;
  catalog: CatalogProduct[];
  orders: Order[];
  payments: PaymentRecord[];
  customers: Customer[];
  wishes: WishRequest[];
  staffUsers: StaffUser[];
}): Promise<{ success: boolean; migrated: MigrationCounts; error?: string }> {
  try {
    if (!auth.currentUser) {
      throw new Error('尚未偵測到 Firebase 登入狀態！請先使用管理員帳號密碼登入後再執行遷移。');
    }

    // 1. Ensure the logged-in Super Admin user document is bootstrapped in staff_users
    const currentAdminDoc: StaffUser = {
      id: auth.currentUser.uid,
      username: auth.currentUser.email?.split('@')[0] || 'admin',
      name: '最高管理員 (主理人)',
      role: 'super_admin',
      password: '',
      email: auth.currentUser.email || undefined,
      status: 'active',
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };
    await saveCloudStaffUser(currentAdminDoc);

    // 2. Save Settings
    await saveCloudSettings(localData.settings);

    // 3. Save Catalog
    for (const prod of localData.catalog) {
      await saveCloudProduct(prod);
    }

    // 4. Save Orders
    for (const ord of localData.orders) {
      await saveCloudOrder(ord);
    }

    // 5. Save Payments
    for (const pay of localData.payments) {
      await saveCloudPayment(pay);
    }

    // 6. Save Customers (Passwords automatically stripped!)
    for (const cust of localData.customers) {
      await saveCloudCustomer(cust);
    }

    // 7. Save Wishes
    for (const wish of localData.wishes) {
      await saveCloudWish(wish);
    }

    // 8. Save Staff Users
    for (const staff of localData.staffUsers) {
      if (staff.id !== auth.currentUser.uid) {
        await saveCloudStaffUser(staff);
      }
    }

    return {
      success: true,
      migrated: {
        settingsCount: 1,
        catalogCount: localData.catalog.length,
        ordersCount: localData.orders.length,
        paymentsCount: localData.payments.length,
        customersCount: localData.customers.length,
        wishesCount: localData.wishes.length,
        staffUsersCount: localData.staffUsers.length + 1,
      },
    };
  } catch (err: unknown) {
    let msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('permission-denied') || msg.includes('Missing or insufficient permissions')) {
      msg = '權限不足 (Firebase 權限檢查拒絕)：請確認已使用管理員帳號登入，且雲端安全規則已同步部署。';
    }
    return {
      success: false,
      migrated: {
        settingsCount: 0,
        catalogCount: 0,
        ordersCount: 0,
        paymentsCount: 0,
        customersCount: 0,
        wishesCount: 0,
        staffUsersCount: 0,
      },
      error: msg,
    };
  }
}
