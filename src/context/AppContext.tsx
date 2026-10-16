import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  BalanceAdjustment,
  BankSettings,
  Business,
  DatabaseState,
  HppComponentItem,
  HppMode,
  OperationalExpense,
  Product,
  SalesTransaction,
  SUPER_ADMIN_EMAIL,
  SUPER_ADMIN_ID,
  User,
  UserRole,
} from '../types';
import { INITIAL_SEED_DATA } from '../data/seedData';
import {
  fetchFromGoogleSheets,
  postToGoogleSheets,
  STORAGE_KEYS,
} from '../services/googleSheetsService';
import { generateProductSku } from '../utils/calculations';

export interface InviteUserResult {
  user: User;
  tempPassword: string;
  inviteLink: string;
  expiresAt: number;
}

interface AppContextType {
  db: DatabaseState;
  currentUser: User | null;
  isSuperAdmin: boolean;
  canManageBusinessAndProducts: boolean;
  sheetsWebhookUrl: string;
  isSyncing: boolean;
  lastSyncTime: string | null;
  syncStatusMessage: string | null;
  // Auth
  loginWithEmail: (email: string, password?: string) => { ok: boolean; message?: string };
  logout: () => void;
  switchDemoUser: (userId: string) => void;
  requestForgotPassword: (email: string) => {
    ok: boolean;
    message?: string;
    sentToEmail?: string;
  };
  completePasswordSetup: (
    email: string,
    token: string,
    oldPassword: string,
    newPassword: string
  ) => { ok: boolean; message?: string };
  // Google Sheets Sync
  setSheetsWebhookUrl: (url: string) => void;
  pullFromGoogleSheets: (customUrl?: string) => Promise<boolean>;
  pushAllToGoogleSheets: (customUrl?: string) => Promise<boolean>;
  resetToSeedData: () => void;
  // User Management (Super Admin only)
  inviteOrAddUser: (
    email: string,
    fullName: string,
    role: 'admin' | 'member'
  ) => InviteUserResult | null;
  updateUserRoleOrStatus: (
    userId: string,
    updates: { role?: UserRole; is_active?: boolean }
  ) => void;
  // Business CRUD
  saveBusiness: (
    business: Omit<Business, 'id' | 'created_at' | 'created_by'> & { id?: string }
  ) => void;
  deleteOrArchiveBusiness: (businessId: string, archiveOnly?: boolean) => void;
  // Product & HPP CRUD (Historical Snapshot safe + Auto-generated SKU)
  saveProduct: (productInput: {
    id?: string;
    business_id: string;
    name: string;
    hpp_mode: HppMode;
    hpp_components: HppComponentItem[];
    current_total_hpp: number;
    current_selling_price: number;
    is_active?: boolean;
  }) => void;
  deleteProduct: (productId: string) => void;
  // Transactions Input (Supports Backdate)
  recordBatchSalesTransactions: (
    businessId: string,
    transactionDate: string,
    items: { productId: string; qty: number }[]
  ) => number;
  deleteSalesTransaction: (txId: string) => void;
  recordOperationalExpense: (input: {
    business_id: string;
    transaction_date: string;
    expense_name: string;
    category: string;
    amount: number;
    notes: string;
  }) => void;
  deleteOperationalExpense: (expenseId: string) => void;
  // Shared Partner Bank Settings & Reconciliation (Super Admin & Partner Admin)
  updateBankSettings: (input: {
    bank_name: string;
    opening_balance: number;
    opening_date: string;
  }) => void;
  recordBalanceAdjustment: (input: {
    adjustment_date: string;
    system_balance_before: number;
    actual_bank_balance: number;
    reason: string;
  }) => void;
  deleteBalanceAdjustment: (adjustmentId: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

function stripParenthesesFromName(name: string): string {
  return name.replace(/\s*\([^)]*\)\s*/g, '').trim().slice(0, 20);
}

function enforceSuperAdminLock(users: User[]): User[] {
  const hasOwner = users.some(
    (u) => u.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()
  );
  const normalized = users.map((u) => {
    const cleanName = stripParenthesesFromName(u.full_name);
    if (u.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
      return {
        ...u,
        full_name: cleanName || 'David Calvin',
        role: 'super_admin' as UserRole,
        is_active: true,
      };
    }
    if (u.role === 'super_admin') {
      return {
        ...u,
        full_name: cleanName,
        role: 'admin' as UserRole,
      };
    }
    return {
      ...u,
      full_name: cleanName,
    };
  });

  if (!hasOwner) {
    normalized.unshift({
      id: SUPER_ADMIN_ID,
      email: SUPER_ADMIN_EMAIL,
      full_name: 'David Calvin',
      role: 'super_admin',
      is_active: true,
      created_at: new Date().toISOString(),
    });
  }
  return normalized;
}

function ensureProductsHaveSku(products: Product[], businesses: Business[]): Product[] {
  const countPerBiz: Record<string, number> = {};
  return products.map((p) => {
    countPerBiz[p.business_id] = (countPerBiz[p.business_id] || 0) + 1;
    const seq = countPerBiz[p.business_id];
    const bizName =
      businesses.find((b) => b.id === p.business_id)?.name || 'Revelation';
    const cleanProdName = stripParenthesesFromName(p.name);
    const sku = p.sku || generateProductSku(bizName, seq, cleanProdName);
    return {
      ...p,
      name: cleanProdName,
      sku,
    };
  });
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [db, setDb] = useState<DatabaseState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DB_STATE);
      if (saved) {
        const parsed = JSON.parse(saved) as DatabaseState;
        const businesses = parsed.businesses || INITIAL_SEED_DATA.businesses;
        return {
          ...parsed,
          users: enforceSuperAdminLock(parsed.users || INITIAL_SEED_DATA.users),
          businesses,
          products: ensureProductsHaveSku(
            parsed.products || INITIAL_SEED_DATA.products,
            businesses
          ),
          bank_settings: parsed.bank_settings || INITIAL_SEED_DATA.bank_settings,
          balance_adjustments: parsed.balance_adjustments || INITIAL_SEED_DATA.balance_adjustments || [],
        };
      }
    } catch (e) {
      console.warn('Failed to parse local DB state:', e);
    }
    return INITIAL_SEED_DATA;
  });

  const [currentUserId, setCurrentUserId] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID) || SUPER_ADMIN_ID;
  });

  const [sheetsWebhookUrl, setSheetsWebhookUrlState] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.SHEETS_WEBHOOK_URL) || '';
  });

  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEYS.LAST_SYNC_TIME) || null;
  });
  const [syncStatusMessage, setSyncStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.DB_STATE, JSON.stringify(db));
    } catch (e) {
      console.warn('Failed to save DB to localStorage:', e);
    }
  }, [db]);

  const currentUser =
    db.users.find((u) => u.id === currentUserId && u.is_active) || null;

  const isSuperAdmin =
    Boolean(currentUser) &&
    currentUser!.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase() &&
    currentUser!.role === 'super_admin';

  const canManageBusinessAndProducts =
    Boolean(currentUser) &&
    (isSuperAdmin || currentUser!.role === 'admin');

  const setSheetsWebhookUrl = (url: string) => {
    const clean = url.trim();
    setSheetsWebhookUrlState(clean);
    localStorage.setItem(STORAGE_KEYS.SHEETS_WEBHOOK_URL, clean);
  };

  const pullFromGoogleSheets = useCallback(
    async (customUrl?: string): Promise<boolean> => {
      const targetUrl = (customUrl ?? sheetsWebhookUrl).trim();
      if (!targetUrl) return false;
      setIsSyncing(true);
      setSyncStatusMessage('Mengambil data terbaru dari Google Sheets...');
      try {
        const remoteData = await fetchFromGoogleSheets(targetUrl);
        if (remoteData) {
          const hasAnyRemoteRows =
            (remoteData.users && remoteData.users.length > 0) ||
            (remoteData.businesses && remoteData.businesses.length > 0);

          if (hasAnyRemoteRows) {
            const remoteBusinesses = remoteData.businesses || [];
            setDb((prev) => ({
              users: enforceSuperAdminLock(remoteData.users || []),
              businesses: remoteBusinesses,
              products: ensureProductsHaveSku(remoteData.products || [], remoteBusinesses),
              sales_transactions: remoteData.sales_transactions || [],
              operational_expenses: remoteData.operational_expenses || [],
              bank_settings:
                remoteData.bank_settings ||
                prev.bank_settings ||
                INITIAL_SEED_DATA.bank_settings,
              balance_adjustments:
                remoteData.balance_adjustments ||
                prev.balance_adjustments ||
                [],
            }));
          } else {
            await postToGoogleSheets(targetUrl, {
              action: 'syncAll',
              data: db,
            });
          }
          const nowStr = new Date().toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
          });
          setLastSyncTime(nowStr);
          localStorage.setItem(STORAGE_KEYS.LAST_SYNC_TIME, nowStr);
          setSyncStatusMessage('Tersinkronisasi dengan Google Sheets');
          return true;
        }
        setSyncStatusMessage('Format respons Google Sheets tidak dikenali');
        return false;
      } catch (err) {
        setSyncStatusMessage('Gagal terhubung ke Google Sheets (Cek URL / Izin Anyone)');
        return false;
      } finally {
        setIsSyncing(false);
      }
    },
    [sheetsWebhookUrl, db]
  );

  const pushAllToGoogleSheets = useCallback(
    async (customUrl?: string): Promise<boolean> => {
      const targetUrl = (customUrl ?? sheetsWebhookUrl).trim();
      if (!targetUrl) return false;
      setIsSyncing(true);
      setSyncStatusMessage('Mengirim seluruh tabel ke Google Sheets...');
      try {
        const ok = await postToGoogleSheets(targetUrl, {
          action: 'syncAll',
          data: db,
        });
        if (ok) {
          const nowStr = new Date().toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
          });
          setLastSyncTime(nowStr);
          localStorage.setItem(STORAGE_KEYS.LAST_SYNC_TIME, nowStr);
          setSyncStatusMessage('Berhasil disimpan ke Google Sheets!');
        } else {
          setSyncStatusMessage('Gagal push ke Google Sheets');
        }
        return ok;
      } finally {
        setIsSyncing(false);
      }
    },
    [sheetsWebhookUrl, db]
  );

  useEffect(() => {
    if (sheetsWebhookUrl) {
      pullFromGoogleSheets(sheetsWebhookUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const syncRowInBackground = (table: string, row: unknown) => {
    if (!sheetsWebhookUrl) return;
    postToGoogleSheets(sheetsWebhookUrl, {
      action: 'upsertRow',
      table,
      row,
    }).then((ok) => {
      if (ok) {
        const nowStr = new Date().toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
        });
        setLastSyncTime(nowStr);
        localStorage.setItem(STORAGE_KEYS.LAST_SYNC_TIME, nowStr);
      }
    });
  };

  const syncDeleteInBackground = (table: string, id: string) => {
    if (!sheetsWebhookUrl) return;
    postToGoogleSheets(sheetsWebhookUrl, {
      action: 'deleteRow',
      table,
      id,
    });
  };

  const loginWithEmail = (
    email: string,
    password?: string
  ): { ok: boolean; message?: string } => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      return { ok: false, message: 'Silakan masukkan alamat E-mail Anda.' };
    }
    const found = db.users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (!found) {
      return {
        ok: false,
        message: 'E-mail belum terdaftar. Hubungi Super Admin (david.calvin89@gmail.com).',
      };
    }
    if (!found.is_active) {
      return {
        ok: false,
        message: 'Akun Anda sedang dinonaktifkan oleh Super Admin.',
      };
    }
    if (password !== undefined && found.password) {
      if (password !== found.password) {
        return {
          ok: false,
          message: 'Password tidak sesuai. Gunakan fitur Lupa Password jika lupa.',
        };
      }
    }
    setCurrentUserId(found.id);
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, found.id);
    return { ok: true };
  };

  const requestForgotPassword = (
    email: string
  ): { ok: boolean; message?: string; sentToEmail?: string } => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      return { ok: false, message: 'Silakan isi alamat E-mail terlebih dahulu.' };
    }
    const found = db.users.find((u) => u.email.toLowerCase() === cleanEmail);
    const userPassword = found?.password || 'revelation2026';

    if (sheetsWebhookUrl) {
      postToGoogleSheets(sheetsWebhookUrl, {
        action: 'sendForgotPasswordEmail',
        from: SUPER_ADMIN_EMAIL,
        to: cleanEmail,
        fullName: found?.full_name || cleanEmail,
        password: userPassword,
      });
    }

    return {
      ok: true,
      sentToEmail: cleanEmail,
    };
  };

  const completePasswordSetup = (
    email: string,
    token: string,
    oldPassword: string,
    newPassword: string
  ): { ok: boolean; message?: string } => {
    const cleanEmail = email.trim().toLowerCase();
    const found = db.users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (!found) {
      return { ok: false, message: 'Akun pengguna tidak ditemukan.' };
    }
    if (found.invite_token && found.invite_token !== token) {
      return { ok: false, message: 'Token link undangan tidak valid.' };
    }
    if (found.invite_expires_at && Date.now() > found.invite_expires_at) {
      return {
        ok: false,
        message:
          'Link undangan sudah kadaluarsa (melebihi batas waktu 5 menit). Minta Super Admin (david.calvin89@gmail.com) untuk mengirim ulang.',
      };
    }
    if (found.password && oldPassword.trim() !== found.password) {
      return {
        ok: false,
        message: 'Password Lama (Sementara) tidak sesuai dengan yang dikirim di email.',
      };
    }
    if (newPassword.trim().length < 4) {
      return {
        ok: false,
        message: 'Password baru minimal harus terdiri dari 4 karakter.',
      };
    }

    const updatedUser: User = {
      ...found,
      password: newPassword.trim(),
      invite_token: undefined,
      invite_expires_at: undefined,
      is_active: true,
    };

    setDb((prev) => ({
      ...prev,
      users: enforceSuperAdminLock(
        prev.users.map((u) => (u.id === found.id ? updatedUser : u))
      ),
    }));
    syncRowInBackground('users', updatedUser);
    setCurrentUserId(found.id);
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, found.id);
    return { ok: true };
  };

  const logout = () => {
    setCurrentUserId(null);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
  };

  const switchDemoUser = (userId: string) => {
    const target = db.users.find((u) => u.id === userId && u.is_active);
    if (target) {
      setCurrentUserId(target.id);
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, target.id);
    }
  };

  const resetToSeedData = () => {
    setDb(INITIAL_SEED_DATA);
    localStorage.setItem(STORAGE_KEYS.DB_STATE, JSON.stringify(INITIAL_SEED_DATA));
  };

  const inviteOrAddUser = (
    email: string,
    fullName: string,
    role: 'admin' | 'member'
  ): InviteUserResult | null => {
    if (!isSuperAdmin) return null;
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = stripParenthesesFromName(fullName);
    if (!cleanEmail || !cleanName) return null;
    if (cleanEmail === SUPER_ADMIN_EMAIL.toLowerCase()) return null;

    const tempPassword = `REV-${Math.floor(1000 + Math.random() * 9000)}`;
    const token = `inv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const expiresAt = Date.now() + 5 * 60 * 1000; // Valid for 5 minutes only
    const origin =
      typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
    const inviteLink = `${origin}/setup-password?token=${encodeURIComponent(
      token
    )}&email=${encodeURIComponent(cleanEmail)}`;

    const existing = db.users.find((u) => u.email.toLowerCase() === cleanEmail);
    const newUser: User = existing
      ? {
          ...existing,
          full_name: cleanName,
          role,
          is_active: true,
          password: tempPassword,
          invite_token: token,
          invite_expires_at: expiresAt,
        }
      : {
          id: `usr-${Date.now()}`,
          email: cleanEmail,
          full_name: cleanName,
          role,
          is_active: true,
          password: tempPassword,
          invite_token: token,
          invite_expires_at: expiresAt,
          created_at: new Date().toISOString(),
        };

    setDb((prev) => {
      const nextList = existing
        ? prev.users.map((u) => (u.id === existing.id ? newUser : u))
        : [...prev.users, newUser];
      return {
        ...prev,
        users: enforceSuperAdminLock(nextList),
      };
    });

    syncRowInBackground('users', newUser);

    if (sheetsWebhookUrl) {
      postToGoogleSheets(sheetsWebhookUrl, {
        action: 'sendInviteEmail',
        from: SUPER_ADMIN_EMAIL,
        to: cleanEmail,
        fullName: cleanName,
        role,
        tempPassword,
        inviteLink,
        expiresInMinutes: 5,
      });
    }

    return {
      user: newUser,
      tempPassword,
      inviteLink,
      expiresAt,
    };
  };

  const updateUserRoleOrStatus = (
    userId: string,
    updates: { role?: UserRole; is_active?: boolean }
  ) => {
    if (!isSuperAdmin) return;
    setDb((prev) => {
      const updatedUsers = prev.users.map((u) => {
        if (u.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
          return { ...u, role: 'super_admin' as UserRole, is_active: true };
        }
        if (u.id !== userId) return u;
        const safeRole =
          updates.role === 'super_admin' ? 'admin' : updates.role ?? u.role;
        const nextUser: User = {
          ...u,
          role: safeRole,
          is_active: updates.is_active !== undefined ? updates.is_active : u.is_active,
        };
        syncRowInBackground('users', nextUser);
        return nextUser;
      });
      return { ...prev, users: enforceSuperAdminLock(updatedUsers) };
    });
  };

  const saveBusiness = (
    input: Omit<Business, 'id' | 'created_at' | 'created_by'> & { id?: string }
  ) => {
    if (!canManageBusinessAndProducts || !currentUser) return;
    setDb((prev) => {
      if (input.id) {
        const updated = prev.businesses.map((b) => {
          if (b.id !== input.id) return b;
          const nextBiz: Business = {
            ...b,
            name: input.name,
            description: input.description,
            logo_url: input.logo_url,
            card_accent_color: input.card_accent_color,
            is_archived: input.is_archived ?? b.is_archived ?? false,
          };
          syncRowInBackground('businesses', nextBiz);
          return nextBiz;
        });
        return { ...prev, businesses: updated };
      } else {
        const newBiz: Business = {
          id: `biz-${Date.now()}`,
          name: input.name,
          description: input.description,
          logo_url: input.logo_url,
          card_accent_color: input.card_accent_color || '#DDD6FE',
          is_archived: false,
          created_by: currentUser.id,
          created_at: new Date().toISOString(),
        };
        syncRowInBackground('businesses', newBiz);
        const activeOnes = prev.businesses.filter((b) => !b.is_archived);
        const archivedOnes = prev.businesses.filter((b) => b.is_archived);
        return {
          ...prev,
          businesses: [...activeOnes, newBiz, ...archivedOnes],
        };
      }
    });
  };

  const deleteOrArchiveBusiness = (businessId: string, archiveOnly = false) => {
    if (!canManageBusinessAndProducts) return;
    if (archiveOnly) {
      setDb((prev) => {
        const target = prev.businesses.find((b) => b.id === businessId);
        if (!target) return prev;
        const nextBiz: Business = {
          ...target,
          is_archived: !target.is_archived,
        };
        syncRowInBackground('businesses', nextBiz);

        // Remove target from current position, then append to the bottom of active or archived list
        const others = prev.businesses.filter((b) => b.id !== businessId);
        const activeOthers = others.filter((b) => !b.is_archived);
        const archivedOthers = others.filter((b) => b.is_archived);

        const reordered = nextBiz.is_archived
          ? [...activeOthers, ...archivedOthers, nextBiz]
          : [...activeOthers, nextBiz, ...archivedOthers];

        return { ...prev, businesses: reordered };
      });
    } else {
      setDb((prev) => ({
        ...prev,
        businesses: prev.businesses.filter((b) => b.id !== businessId),
      }));
      syncDeleteInBackground('businesses', businessId);
    }
  };

  /**
   * Auto-generates SKU from Business Name + Product Count in Business + Product Name.
   * Also preserves Historical Snapshot on past sales_transactions.
   */
  const saveProduct = (productInput: {
    id?: string;
    business_id: string;
    name: string;
    hpp_mode: HppMode;
    hpp_components: HppComponentItem[];
    current_total_hpp: number;
    current_selling_price: number;
    is_active?: boolean;
  }) => {
    if (!canManageBusinessAndProducts) return;
    const calculatedHpp =
      productInput.hpp_mode === 'itemized'
        ? productInput.hpp_components.reduce((s, c) => s + Number(c.cost || 0), 0)
        : Number(productInput.current_total_hpp || 0);

    setDb((prev) => {
      const bizName =
        prev.businesses.find((b) => b.id === productInput.business_id)?.name ||
        'Revelation';
      const bizProducts = prev.products.filter(
        (p) => p.business_id === productInput.business_id
      );

      if (productInput.id) {
        const existingIndex = bizProducts.findIndex((p) => p.id === productInput.id);
        const seqNumber = existingIndex !== -1 ? existingIndex + 1 : bizProducts.length + 1;
        const autoSku = generateProductSku(bizName, seqNumber, productInput.name);

        const updated = prev.products.map((p) => {
          if (p.id !== productInput.id) return p;
          const nextProd: Product = {
            ...p,
            sku: autoSku,
            name: productInput.name,
            hpp_mode: productInput.hpp_mode,
            hpp_components: productInput.hpp_components,
            current_total_hpp: calculatedHpp,
            current_selling_price: Number(productInput.current_selling_price || 0),
            is_active: productInput.is_active ?? p.is_active,
            updated_at: new Date().toISOString(),
          };
          syncRowInBackground('products', nextProd);
          return nextProd;
        });
        return { ...prev, products: updated };
      } else {
        const seqNumber = bizProducts.length + 1;
        const autoSku = generateProductSku(bizName, seqNumber, productInput.name);
        const newProd: Product = {
          id: `prd-${Date.now()}`,
          business_id: productInput.business_id,
          sku: autoSku,
          name: productInput.name,
          hpp_mode: productInput.hpp_mode,
          hpp_components: productInput.hpp_components,
          current_total_hpp: calculatedHpp,
          current_selling_price: Number(productInput.current_selling_price || 0),
          is_active: true,
          updated_at: new Date().toISOString(),
        };
        syncRowInBackground('products', newProd);
        return { ...prev, products: [...prev.products, newProd] };
      }
    });
  };

  const deleteProduct = (productId: string) => {
    if (!canManageBusinessAndProducts) return;
    setDb((prev) => ({
      ...prev,
      products: prev.products.filter((p) => p.id !== productId),
    }));
    syncDeleteInBackground('products', productId);
  };

  const recordBatchSalesTransactions = (
    businessId: string,
    transactionDate: string,
    items: { productId: string; qty: number }[]
  ): number => {
    if (!currentUser) return 0;
    const validItems = items.filter((item) => item.qty > 0);
    if (validItems.length === 0) return 0;

    const newTransactions: SalesTransaction[] = [];
    const nowIso = new Date().toISOString();

    validItems.forEach((item, idx) => {
      const product = db.products.find((p) => p.id === item.productId);
      if (!product) return;

      const qty = Number(item.qty);
      const hpp_snapshot = Number(product.current_total_hpp);
      const selling_price_snapshot = Number(product.current_selling_price);
      const total_revenue = qty * selling_price_snapshot;
      const total_hpp = qty * hpp_snapshot;
      const gross_profit = total_revenue - total_hpp;

      newTransactions.push({
        id: `trx-${Date.now()}-${idx}`,
        business_id: businessId,
        product_id: product.id,
        transaction_date: transactionDate,
        qty,
        hpp_snapshot,
        selling_price_snapshot,
        total_revenue,
        total_hpp,
        gross_profit,
        created_by: currentUser.id,
        created_at: nowIso,
      });
    });

    if (newTransactions.length === 0) return 0;

    setDb((prev) => ({
      ...prev,
      sales_transactions: [...newTransactions, ...prev.sales_transactions],
    }));

    if (sheetsWebhookUrl) {
      postToGoogleSheets(sheetsWebhookUrl, {
        action: 'batchUpsertRows',
        table: 'sales_transactions',
        rows: newTransactions,
      });
    }

    return newTransactions.length;
  };

  const deleteSalesTransaction = (txId: string) => {
    if (!currentUser) return;
    setDb((prev) => ({
      ...prev,
      sales_transactions: prev.sales_transactions.filter((t) => t.id !== txId),
    }));
    syncDeleteInBackground('sales_transactions', txId);
  };

  const recordOperationalExpense = (input: {
    business_id: string;
    transaction_date: string;
    expense_name: string;
    category: string;
    amount: number;
    notes: string;
  }) => {
    if (!currentUser) return;
    const newExpense: OperationalExpense = {
      id: `exp-${Date.now()}`,
      business_id: input.business_id,
      transaction_date: input.transaction_date,
      expense_name: input.expense_name.trim(),
      category: input.category,
      amount: Number(input.amount),
      notes: input.notes.trim(),
      created_by: currentUser.id,
      created_at: new Date().toISOString(),
    };

    setDb((prev) => ({
      ...prev,
      operational_expenses: [newExpense, ...prev.operational_expenses],
    }));
    syncRowInBackground('operational_expenses', newExpense);
  };

  const deleteOperationalExpense = (expenseId: string) => {
    if (!currentUser) return;
    setDb((prev) => ({
      ...prev,
      operational_expenses: prev.operational_expenses.filter((e) => e.id !== expenseId),
    }));
    syncDeleteInBackground('operational_expenses', expenseId);
  };

  /**
   * Shared Partner Bank Opening Balance — Accessible by Super Admin & Partner Admin
   */
  const updateBankSettings = (input: {
    bank_name: string;
    opening_balance: number;
    opening_date: string;
  }) => {
    if (!canManageBusinessAndProducts || !currentUser) return;
    const nextBankSettings: BankSettings = {
      id: 'bank-main',
      bank_name: input.bank_name.trim() || 'Rekening Bank Utama Partner',
      opening_balance: Number(input.opening_balance || 0),
      opening_date: input.opening_date,
      updated_by: currentUser.id,
      updated_at: new Date().toISOString(),
    };
    setDb((prev) => ({
      ...prev,
      bank_settings: nextBankSettings,
    }));
    syncRowInBackground('bank_settings', nextBankSettings);
  };

  /**
   * Shared Partner Bank Reconciliation / Adjustment — Accessible by Super Admin & Partner Admin
   */
  const recordBalanceAdjustment = (input: {
    adjustment_date: string;
    system_balance_before: number;
    actual_bank_balance: number;
    reason: string;
  }) => {
    if (!canManageBusinessAndProducts || !currentUser) return;
    const systemBefore = Number(input.system_balance_before || 0);
    const actualBank = Number(input.actual_bank_balance || 0);
    const diff = actualBank - systemBefore;

    const newAdjustment: BalanceAdjustment = {
      id: `adj-${Date.now()}`,
      adjustment_date: input.adjustment_date,
      system_balance_before: systemBefore,
      actual_bank_balance: actualBank,
      difference_amount: diff,
      reason: input.reason.trim() || 'Rekonsiliasi Saldo Bank',
      created_by: currentUser.id,
      created_at: new Date().toISOString(),
    };

    setDb((prev) => ({
      ...prev,
      balance_adjustments: [newAdjustment, ...(prev.balance_adjustments || [])],
    }));
    syncRowInBackground('balance_adjustments', newAdjustment);
  };

  const deleteBalanceAdjustment = (adjustmentId: string) => {
    if (!canManageBusinessAndProducts || !currentUser) return;
    setDb((prev) => ({
      ...prev,
      balance_adjustments: (prev.balance_adjustments || []).filter(
        (a) => a.id !== adjustmentId
      ),
    }));
    syncDeleteInBackground('balance_adjustments', adjustmentId);
  };

  return (
    <AppContext.Provider
      value={{
        db,
        currentUser,
        isSuperAdmin,
        canManageBusinessAndProducts,
        sheetsWebhookUrl,
        isSyncing,
        lastSyncTime,
        syncStatusMessage,
        loginWithEmail,
        logout,
        switchDemoUser,
        requestForgotPassword,
        completePasswordSetup,
        setSheetsWebhookUrl,
        pullFromGoogleSheets,
        pushAllToGoogleSheets,
        resetToSeedData,
        inviteOrAddUser,
        updateUserRoleOrStatus,
        saveBusiness,
        deleteOrArchiveBusiness,
        saveProduct,
        deleteProduct,
        recordBatchSalesTransactions,
        deleteSalesTransaction,
        recordOperationalExpense,
        deleteOperationalExpense,
        updateBankSettings,
        recordBalanceAdjustment,
        deleteBalanceAdjustment,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
