import { DatabaseState, SUPER_ADMIN_EMAIL } from '../types';
import { sanitizeExcelValue } from '../utils/security';

export const STORAGE_KEYS = {
  DB_STATE: 'revelation_group_db_v1',
  CURRENT_USER_ID: 'revelation_group_user_id_v1',
  SHEETS_WEBHOOK_URL: 'revelation_group_sheets_url_v1',
  SHEETS_API_KEY: 'revelation_group_sheets_api_key_v1',
  LAST_SYNC_TIME: 'revelation_group_last_sync_v1',
};

export async function fetchFromGoogleSheets(
  webhookUrl: string,
  apiKey?: string
): Promise<DatabaseState | null> {
  if (!webhookUrl || !webhookUrl.startsWith('http')) return null;
  let finalUrl = webhookUrl;
  if (apiKey && apiKey.trim()) {
    try {
      const parsed = new URL(webhookUrl);
      parsed.searchParams.set('key', apiKey.trim());
      finalUrl = parsed.toString();
    } catch {
      finalUrl = webhookUrl + (webhookUrl.includes('?') ? '&' : '?') + 'key=' + encodeURIComponent(apiKey.trim());
    }
  }

  const response = await fetch(finalUrl, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  const result = await response.json();
  if (result && result.status === 'ok' && result.data) {
    return result.data as DatabaseState;
  }
  if (result && result.status === 'error') {
    throw new Error(result.message || 'Gagal memuat data dari Google Sheets');
  }
  return null;
}

export async function postToGoogleSheets(
  webhookUrl: string,
  payload: Record<string, unknown>,
  apiKey?: string
): Promise<boolean> {
  if (!webhookUrl || !webhookUrl.startsWith('http')) return false;
  try {
    const finalPayload = apiKey && apiKey.trim() ? { ...payload, apiKey: apiKey.trim() } : payload;
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(finalPayload),
    });
    if (!response.ok) return false;
    const res = await response.json();
    return res?.status === 'ok';
  } catch (err) {
    console.warn('Google Sheets background sync warning:', err);
    return false;
  }
}

export function exportDatabaseToExcel(db: DatabaseState): void {
  const escapeXml = (val: unknown): string => {
    if (val === null || val === undefined) return '';
    // Formula injection defense (sanitize =, +, -, @)
    const sanitized = sanitizeExcelValue(val);
    return sanitized
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  };

  const buildSheetXml = (sheetName: string, headers: string[], rows: Record<string, unknown>[]) => {
    const headerCells = headers
      .map(
        (h) =>
          `<Cell ss:StyleID="Header"><Data ss:Type="String">${escapeXml(h)}</Data></Cell>`
      )
      .join('');

    const dataRows = rows
      .map((row) => {
        const cells = headers
          .map((h) => {
            const val = row[h];
            const isNum = typeof val === 'number' && !Number.isNaN(val);
            const dataType = isNum ? 'Number' : 'String';
            return `<Cell><Data ss:Type="${dataType}">${escapeXml(val)}</Data></Cell>`;
          })
          .join('');
        return `<Row>${cells}</Row>`;
      })
      .join('\n');

    return `
      <Worksheet ss:Name="${escapeXml(sheetName)}">
        <Table>
          <Row>${headerCells}</Row>
          ${dataRows}
        </Table>
      </Worksheet>`;
  };

  const xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Styles>
    <Style ss:ID="Header">
      <Font ss:Bold="1" ss:Color="#FFFFFF"/>
      <Interior ss:Color="#1A45E5" ss:Pattern="Solid"/>
    </Style>
  </Styles>
  ${buildSheetXml('users', ['id', 'email', 'full_name', 'role', 'is_active', 'created_at'], db.users as unknown as Record<string, unknown>[])}
  ${buildSheetXml('businesses', ['id', 'name', 'description', 'card_accent_color', 'is_archived', 'created_by', 'created_at'], db.businesses as unknown as Record<string, unknown>[])}
  ${buildSheetXml('products', ['id', 'business_id', 'sku', 'name', 'hpp_mode', 'hpp_components', 'current_total_hpp', 'current_selling_price', 'is_active', 'updated_at'], db.products as unknown as Record<string, unknown>[])}
  ${buildSheetXml('sales_transactions', ['id', 'business_id', 'product_id', 'transaction_date', 'qty', 'hpp_snapshot', 'selling_price_snapshot', 'total_revenue', 'total_hpp', 'gross_profit', 'created_by', 'created_at'], db.sales_transactions as unknown as Record<string, unknown>[])}
  ${buildSheetXml('operational_expenses', ['id', 'business_id', 'transaction_date', 'expense_name', 'category', 'amount', 'notes', 'created_by', 'created_at'], db.operational_expenses as unknown as Record<string, unknown>[])}
  ${buildSheetXml('bank_settings', ['bank_name', 'opening_balance', 'opening_date', 'updated_by', 'updated_at'], db.bank_settings ? [db.bank_settings as unknown as Record<string, unknown>] : [])}
  ${buildSheetXml('balance_adjustments', ['id', 'adjustment_date', 'system_balance_before', 'actual_bank_balance', 'difference_amount', 'reason', 'created_by', 'created_at'], (db.balance_adjustments || []) as unknown as Record<string, unknown>[])}
</Workbook>`;

  const blob = new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const today = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.setAttribute('download', `Revelation-Group-Database-${today}.xls`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export const APPS_SCRIPT_TEMPLATE = `// ============================================================================
// REVELATION GROUP — SECURE GOOGLE SHEETS REAL-TIME DATABASE (Apps Script)
// Akun Owner / Super Admin: ${SUPER_ADMIN_EMAIL}
// ============================================================================
// PANDUAN DEPLOY:
// 1. Buat Google Sheets baru di akun ${SUPER_ADMIN_EMAIL} (https://sheets.new)
// 2. Klik menu Extensions -> Apps Script, ganti isi Code.gs dengan kode ini
// 3. Konfigurasi API Secret Key (default: 'rev_secret_revelation_2026' atau sesuaikan)
// 4. Klik Deploy -> New deployment -> pilih type "Web app"
// 5. Execute as: "Me (${SUPER_ADMIN_EMAIL})" | Who has access: "Anyone"
// 6. Copy Web App URL dan tempel di halaman Super Admin Revelation Group!

const SUPER_ADMIN_EMAIL = '${SUPER_ADMIN_EMAIL}';
const DEFAULT_API_SECRET = 'rev_secret_revelation_2026';

const SCHEMAS = {
  users: ['id', 'email', 'full_name', 'role', 'is_active', 'password', 'invite_token', 'invite_expires_at', 'created_at'],
  businesses: ['id', 'name', 'description', 'logo_url', 'card_accent_color', 'is_archived', 'created_by', 'created_at'],
  products: ['id', 'business_id', 'sku', 'name', 'hpp_mode', 'hpp_components', 'current_total_hpp', 'current_selling_price', 'is_active', 'updated_at'],
  sales_transactions: ['id', 'business_id', 'product_id', 'transaction_date', 'qty', 'hpp_snapshot', 'selling_price_snapshot', 'total_revenue', 'total_hpp', 'gross_profit', 'created_by', 'created_at'],
  operational_expenses: ['id', 'business_id', 'transaction_date', 'expense_name', 'category', 'amount', 'notes', 'created_by', 'created_at'],
  bank_settings: ['id', 'bank_name', 'opening_balance', 'opening_date', 'updated_by', 'updated_at'],
  balance_adjustments: ['id', 'adjustment_date', 'system_balance_before', 'actual_bank_balance', 'difference_amount', 'reason', 'created_by', 'created_at']
};

function getApiSecret() {
  try {
    const prop = PropertiesService.getScriptProperties().getProperty('API_SECRET');
    if (prop && prop.trim()) return prop.trim();
  } catch (err) {}
  return DEFAULT_API_SECRET;
}

function isAuthorized(e, payload) {
  const secret = getApiSecret();
  if (!secret) return true;
  if (e && e.parameter && e.parameter.key === secret) return true;
  if (payload && (payload.apiKey === secret || payload.key === secret)) return true;
  return false;
}

function ensureSheetsInitialized() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  Object.keys(SCHEMAS).forEach(function(name) {
    let s = ss.getSheetByName(name);
    const h = SCHEMAS[name];
    if (!s) {
      s = ss.insertSheet(name);
      s.getRange(1, 1, 1, h.length).setValues([h]).setFontWeight('bold').setBackground('#1A45E5').setFontColor('#FFFFFF');
      s.setFrozenRows(1);
    } else if (s.getLastRow() === 0) {
      s.getRange(1, 1, 1, h.length).setValues([h]);
      s.setFrozenRows(1);
    }
  });
}

function sheetToObjects(name) {
  const s = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  if (!s || s.getLastRow() <= 1) return [];
  const data = s.getDataRange().getValues();
  const headers = data[0];
  return data.slice(1).filter(function(r) { return r[0] !== '' && r[0] !== null; }).map(function(row) {
    const obj = {};
    headers.forEach(function(h, i) {
      let v = row[i];
      if (h === 'hpp_components') { try { v = v ? JSON.parse(v) : []; } catch(e) { v = []; } }
      else if (h === 'is_active' || h === 'is_archived') { v = v === true || v === 'true' || v === 'TRUE'; }
      else if (['current_total_hpp','current_selling_price','qty','hpp_snapshot','selling_price_snapshot','total_revenue','total_hpp','gross_profit','amount','invite_expires_at','opening_balance','system_balance_before','actual_bank_balance','difference_amount'].indexOf(h) !== -1) { v = Number(v) || 0; }
      else if ((h === 'transaction_date' || h === 'opening_date' || h === 'adjustment_date') && v instanceof Date) { v = Utilities.formatDate(v, Session.getScriptTimeZone(), 'yyyy-MM-dd'); }
      obj[h] = v;
    });
    return obj;
  });
}

function writeObjectsToSheet(name, items) {
  const s = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  const h = SCHEMAS[name];
  s.clearContents();
  s.getRange(1, 1, 1, h.length).setValues([h]);
  if (!items || !items.length) return;
  const rows = items.map(function(item) {
    return h.map(function(k) { return k === 'hpp_components' ? JSON.stringify(item[k] || []) : (item[k] ?? ''); });
  });
  s.getRange(2, 1, rows.length, h.length).setValues(rows);
}

function upsertRowInSheet(name, item) {
  const s = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  const h = SCHEMAS[name];
  const last = s.getLastRow();
  const vals = h.map(function(k) { return k === 'hpp_components' ? JSON.stringify(item[k] || []) : (item[k] ?? ''); });
  if (last > 1) {
    const ids = s.getRange(2, 1, last - 1, 1).getValues().map(function(r) { return String(r[0]); });
    const idx = ids.indexOf(String(item.id));
    if (idx !== -1) { s.getRange(idx + 2, 1, 1, h.length).setValues([vals]); return; }
  }
  s.appendRow(vals);
}

function deleteRowFromSheet(name, id) {
  const s = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  const last = s.getLastRow();
  if (last <= 1) return;
  const ids = s.getRange(2, 1, last - 1, 1).getValues().map(function(r) { return String(r[0]); });
  const idx = ids.indexOf(String(id));
  if (idx !== -1) s.deleteRow(idx + 2);
}

function doGet(e) {
  if (!isAuthorized(e, null)) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: 'Unauthorized: Invalid or missing API Key.'
    })).setMimeType(ContentService.MimeType.JSON);
  }

  ensureSheetsInitialized();
  const bankRows = sheetToObjects('bank_settings');
  return ContentService.createTextOutput(JSON.stringify({
    status: 'ok',
    super_admin_email: SUPER_ADMIN_EMAIL,
    data: {
      users: sheetToObjects('users'),
      businesses: sheetToObjects('businesses'),
      products: sheetToObjects('products'),
      sales_transactions: sheetToObjects('sales_transactions'),
      operational_expenses: sheetToObjects('operational_expenses'),
      bank_settings: bankRows.length > 0 ? bankRows[0] : null,
      balance_adjustments: sheetToObjects('balance_adjustments')
    }
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);
  try {
    ensureSheetsInitialized();
    const b = JSON.parse(e.postData.contents);

    if (!isAuthorized(e, b)) {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'error',
        message: 'Unauthorized: Invalid or missing API Key.'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    if (b.action === 'syncAll' && b.data) {
      Object.keys(SCHEMAS).forEach(function(k) {
        if (k === 'bank_settings' && b.data.bank_settings) {
          writeObjectsToSheet('bank_settings', [Object.assign({ id: 'bank-main' }, b.data.bank_settings)]);
        } else if (b.data[k]) {
          writeObjectsToSheet(k, b.data[k]);
        }
      });
    } else if (b.action === 'upsertRow') {
      upsertRowInSheet(b.table, b.row);
    } else if (b.action === 'batchUpsertRows') {
      (b.rows || []).forEach(function(r) { upsertRowInSheet(b.table, r); });
    } else if (b.action === 'deleteRow') {
      deleteRowFromSheet(b.table, b.id);
    } else if (b.action === 'sendInviteEmail') {
      MailApp.sendEmail({
        to: b.to,
        subject: 'Undangan Akses Portal Revelation Group (Link Berlaku 5 Menit)',
        body: 'Halo ' + (b.fullName || '') + ',\\n\\nAnda telah diundang oleh ' + SUPER_ADMIN_EMAIL + ' ke Portal Revelation Group.\\n\\nPassword Lama (Sementara): ' + b.tempPassword + '\\nKlik link berikut (berlaku HANYA 5 MENIT) untuk memasukkan Password Lama & Password Baru:\\n' + b.inviteLink
      });
    } else if (b.action === 'sendForgotPasswordEmail') {
      // Open Email Relay Defense: verify recipient exists in registered users
      const users = sheetToObjects('users');
      const targetUser = users.find(function(u) { return u.email && u.email.toLowerCase() === String(b.to).toLowerCase(); });
      if (!targetUser) {
        return ContentService.createTextOutput(JSON.stringify({
          status: 'error',
          message: 'User email not found in registered accounts.'
        })).setMimeType(ContentService.MimeType.JSON);
      }
      MailApp.sendEmail({
        to: b.to,
        subject: 'Informasi Password Akses — Revelation Group',
        body: 'Halo ' + (b.fullName || targetUser.full_name || '') + ',\\n\\nPassword akses Anda untuk Portal Revelation Group adalah: ' + b.password + '\\n\\nSilakan gunakan password tersebut untuk Login.\\n\\nSalam,\\nRevelation Group (' + SUPER_ADMIN_EMAIL + ')'
      });
    }
    return ContentService.createTextOutput(JSON.stringify({ status: 'ok' })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}`;
