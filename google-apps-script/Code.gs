/**
 * ============================================================================
 * REVELATION GROUP — SECURE GOOGLE SHEETS REAL-TIME DATABASE BACKEND (Apps Script)
 * ============================================================================
 * Akun Super Admin Utama: david.calvin89@gmail.com
 *
 * PANDUAN DEPLOY:
 * 1. Buka Google Sheet di akun david.calvin89@gmail.com
 * 2. Menu Extensions -> Apps Script, ganti isi Code.gs dengan kode ini
 * 3. Simpan (Ctrl+S / Cmd+S)
 * 4. Klik Deploy -> New deployment -> Web app
 *    - Description: Revelation Backend Secure v1.2
 *    - Execute as: Me (david.calvin89@gmail.com)
 *    - Who has access: Anyone
 * 5. Salin URL Web App dan tempel di Halaman Super Admin Revelation Group.
 */

const SUPER_ADMIN_EMAIL = 'david.calvin89@gmail.com';
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
  Object.keys(SCHEMAS).forEach(function(sheetName) {
    let sheet = ss.getSheetByName(sheetName);
    const headers = SCHEMAS[sheetName];
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length)
        .setFontWeight('bold')
        .setBackground('#1A45E5')
        .setFontColor('#FFFFFF');
      sheet.setFrozenRows(1);
    } else if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.setFrozenRows(1);
    }
  });
}

function sheetToObjects(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet || sheet.getLastRow() <= 1) return [];
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rows = data.slice(1);
  return rows.filter(function(r) { return r[0] !== '' && r[0] !== null; }).map(function(row) {
    const obj = {};
    headers.forEach(function(h, idx) {
      let val = row[idx];
      if (h === 'hpp_components') {
        try {
          val = typeof val === 'string' && val.trim() ? JSON.parse(val) : [];
        } catch (e) {
          val = [];
        }
      } else if (h === 'is_active' || h === 'is_archived') {
        val = val === true || val === 'true' || val === 'TRUE' || val === 1;
      } else if (['current_total_hpp', 'current_selling_price', 'qty', 'hpp_snapshot', 'selling_price_snapshot', 'total_revenue', 'total_hpp', 'gross_profit', 'amount', 'opening_balance', 'system_balance_before', 'actual_bank_balance', 'difference_amount'].indexOf(h) !== -1) {
        val = Number(val) || 0;
      } else if ((h === 'transaction_date' || h === 'opening_date' || h === 'adjustment_date') && val instanceof Date) {
        val = Utilities.formatDate(val, Session.getScriptTimeZone(), 'yyyy-MM-dd');
      } else if ((h === 'created_at' || h === 'updated_at') && val instanceof Date) {
        val = val.toISOString();
      }
      obj[h] = val;
    });
    return obj;
  });
}

function writeObjectsToSheet(sheetName, items) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  const headers = SCHEMAS[sheetName];
  sheet.clearContents();
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  if (!items || items.length === 0) return;
  const rows = items.map(function(item) {
    return headers.map(function(h) {
      const val = item[h];
      if (h === 'hpp_components') {
        return JSON.stringify(val || []);
      }
      return val !== undefined && val !== null ? val : '';
    });
  });
  sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
}

function upsertRowInSheet(sheetName, item) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  const headers = SCHEMAS[sheetName];
  const lastRow = sheet.getLastRow();
  const rowValues = headers.map(function(h) {
    const val = item[h];
    if (h === 'hpp_components') return JSON.stringify(val || []);
    return val !== undefined && val !== null ? val : '';
  });

  if (lastRow > 1) {
    const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues().map(function(r) { return String(r[0]); });
    const existingIndex = ids.indexOf(String(item.id));
    if (existingIndex !== -1) {
      sheet.getRange(existingIndex + 2, 1, 1, headers.length).setValues([rowValues]);
      return;
    }
  }
  sheet.appendRow(rowValues);
}

function deleteRowFromSheet(sheetName, id) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return;
  const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues().map(function(r) { return String(r[0]); });
  const existingIndex = ids.indexOf(String(id));
  if (existingIndex !== -1) {
    sheet.deleteRow(existingIndex + 2);
  }
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
  const payload = {
    status: 'ok',
    super_admin_email: SUPER_ADMIN_EMAIL,
    updated_at: new Date().toISOString(),
    data: {
      users: sheetToObjects('users'),
      businesses: sheetToObjects('businesses'),
      products: sheetToObjects('products'),
      sales_transactions: sheetToObjects('sales_transactions'),
      operational_expenses: sheetToObjects('operational_expenses'),
      bank_settings: bankRows.length > 0 ? bankRows[0] : null,
      balance_adjustments: sheetToObjects('balance_adjustments')
    }
  };
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);
  try {
    ensureSheetsInitialized();
    const body = JSON.parse(e.postData.contents);

    if (!isAuthorized(e, body)) {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'error',
        message: 'Unauthorized: Invalid or missing API Key.'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    const action = body.action;

    if (action === 'syncAll') {
      const d = body.data || {};
      if (d.users) writeObjectsToSheet('users', d.users);
      if (d.businesses) writeObjectsToSheet('businesses', d.businesses);
      if (d.products) writeObjectsToSheet('products', d.products);
      if (d.sales_transactions) writeObjectsToSheet('sales_transactions', d.sales_transactions);
      if (d.operational_expenses) writeObjectsToSheet('operational_expenses', d.operational_expenses);
      if (d.bank_settings) writeObjectsToSheet('bank_settings', [Object.assign({ id: 'bank-main' }, d.bank_settings)]);
      if (d.balance_adjustments) writeObjectsToSheet('balance_adjustments', d.balance_adjustments);
    } else if (action === 'upsertRow') {
      upsertRowInSheet(body.table, body.row);
    } else if (action === 'batchUpsertRows') {
      (body.rows || []).forEach(function(r) {
        upsertRowInSheet(body.table, r);
      });
    } else if (action === 'deleteRow') {
      deleteRowFromSheet(body.table, body.id);
    } else if (action === 'sendInviteEmail') {
      MailApp.sendEmail({
        to: body.to,
        subject: 'Undangan Akses Portal Revelation Group (Link Berlaku 5 Menit)',
        body:
          'Halo ' + (body.fullName || '') + ',\n\n' +
          'Anda telah diundang oleh ' + SUPER_ADMIN_EMAIL + ' ke Portal Manajemen Revelation Group.\n\n' +
          'Password Lama (Sementara): ' + body.tempPassword + '\n' +
          'Klik link berikut (berlaku HANYA 5 MENIT) untuk memasukkan Password Lama dan membuat Password Baru:\n' +
          body.inviteLink + '\n\n' +
          'Salam,\nRevelation Group (' + SUPER_ADMIN_EMAIL + ')'
      });
    } else if (action === 'sendForgotPasswordEmail') {
      // Open Email Relay Defense: verify recipient exists in registered users
      const users = sheetToObjects('users');
      const targetUser = users.find(function(u) { return u.email && u.email.toLowerCase() === String(body.to).toLowerCase(); });
      if (!targetUser) {
        return ContentService.createTextOutput(JSON.stringify({
          status: 'error',
          message: 'User email not found in registered accounts.'
        })).setMimeType(ContentService.MimeType.JSON);
      }
      MailApp.sendEmail({
        to: body.to,
        subject: 'Informasi Password Akses — Revelation Group',
        body:
          'Halo ' + (body.fullName || targetUser.full_name || '') + ',\n\n' +
          'Berikut adalah password akses Anda untuk Portal Revelation Group:\n' +
          'Password: ' + body.password + '\n\n' +
          'Silakan gunakan password tersebut untuk Login.\n\n' +
          'Salam,\nRevelation Group (' + SUPER_ADMIN_EMAIL + ')'
      });
    }

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok', action: action, timestamp: new Date().toISOString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}
