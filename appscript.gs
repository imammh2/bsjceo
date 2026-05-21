// Konstanta untuk nama sheet
const SHEET_PENGGUNA = 'data_peserta';
const SHEET_SEKOLAH  = 'data_sekolah';
const SHEET_LOG      = 'log_pencarian';

// ======================================================================
// == FUNGSI HELPER ==
// ======================================================================

/**
 * Sanitasi string: lowercase, hilangkan semua non-huruf (a-z)
 * Sesuai sanitasi yang dilakukan di frontend (script.js:152)
 */
function sanitizeKey(str) {
  return String(str).trim().toLowerCase().replace(/[^a-z]/g, '');
}

/**
 * Fuzzy / LIKE match untuk nama peserta.
 * Setiap huruf dari query harus muncul berurutan di target
 * (char-level wildcard .* antar huruf).
 */
function fuzzyMatch(querySource, target) {
  const q = sanitizeKey(querySource);
  if (!q) return false;
  const pattern = q.split('').join('.*');
  return new RegExp(pattern).test(sanitizeKey(target));
}

// ======================================================================
// == DEBUG: HELPER FUNCTIONS ==
// ======================================================================

/**
 * Menguji sanitizeKey() dengan berbagai jenis input:
 * spasi, huruf besar, angka, simbol, string kosong, dan null.
 * Jalankan dari Apps Script Editor → Run → debug_sanitizeKey
 */
function debug_sanitizeKey() {
  const cases = [
    'SMK Negeri 1 Bandung',
    '  SMAN 2  ',
    'Kota Surabaya123',
    'Jl. Merdeka #5',
    '',
    null
  ];
  Logger.log('=== DEBUG: sanitizeKey ===');
  cases.forEach(c => {
    Logger.log('Input: ' + JSON.stringify(c) + ' → "' + sanitizeKey(c) + '"');
  });
}

/**
 * Menguji fuzzyMatch() dengan kombinasi query dan target nama peserta.
 * Mencakup: partial match, sequential-char match, query kosong, dan mismatch.
 * Jalankan dari Apps Script Editor → Run → debug_fuzzyMatch
 */
function debug_fuzzyMatch() {
  const pairs = [
    ['budi',      'Budi Santoso'],
    ['bdisnt',    'Budi Santoso'],
    ['sari',      'Dewi Sari'],
    ['xyz',       'Budi Santoso'],
    ['',          'Budi Santoso'],
    ['a',         'Budi Santoso'],
    ['dewisari',  'Dewi Sari Putri']
  ];
  Logger.log('=== DEBUG: fuzzyMatch ===');
  pairs.forEach(([q, t]) => {
    const result = fuzzyMatch(q, t);
    Logger.log(
      'query=' + JSON.stringify(q) +
      ', target=' + JSON.stringify(t) +
      ' → ' + result
    );
  });
}

// ======================================================================
// == FUNGSI LOGGING PENCARIAN ==
// ======================================================================

function logSearchAttempt(username, logInfoArray) {
  try {
    const ss       = SpreadsheetApp.getActiveSpreadsheet();
    const logSheet = ss.getSheetByName(SHEET_LOG);
    if (!logSheet) return;

    const logData  = logInfoArray.join('\n');
    const dataRange = logSheet.getRange('B:B').getValues();
    let rowNum = -1;
    for (let i = 0; i < dataRange.length; i++) {
      if (dataRange[i][0] == username) {
        rowNum = i + 1;
        break;
      }
    }

    if (rowNum !== -1) {
      const counterCell  = logSheet.getRange(rowNum, 6);
      const currentCount = parseInt(counterCell.getValue()) || 0;
      counterCell.setValue(currentCount + 1);

      const rowData = logSheet.getRange(rowNum, 7, 1, logSheet.getMaxColumns() - 6).getValues()[0];
      let colNum = 7;
      for (let j = 0; j < rowData.length; j++) {
        if (rowData[j] === '') {
          colNum += j;
          break;
        }
        if (j === rowData.length - 1 && rowData[j] !== '') {
          colNum = 7 + j + 1;
        } else if (j === rowData.length - 1) {
          colNum += j;
        }
      }

      if (colNum <= logSheet.getMaxColumns()) {
        logSheet.getRange(rowNum, colNum).setValue(logData).setWrap(true);
      }
    }
  } catch (e) {
    console.error('Log Error: ' + e.toString());
  }
}

// ======================================================================
// == DEBUG: logSearchAttempt ==
// ======================================================================

/**
 * Mensimulasikan pencatatan log pencarian untuk satu username.
 * Setelah dijalankan, memverifikasi hasilnya dengan membaca kembali
 * baris yang bersangkutan dari sheet log_pencarian.
 *
 * ⚠️  Ganti testUsername dengan username yang SUDAH ADA di kolom B
 *      sheet log_pencarian sebelum dijalankan.
 *
 * Jalankan dari Apps Script Editor → Run → debug_logSearchAttempt
 */
function debug_logSearchAttempt() {
  const testUsername = 'USR001'; // ← ganti sesuai data di sheet
  const testLogInfo  = [
    'Browser: Chrome/Windows',
    'IP: 192.168.1.1',
    'Timestamp: ' + new Date().toISOString()
  ];

  Logger.log('=== DEBUG: logSearchAttempt ===');
  Logger.log('Username : ' + testUsername);
  Logger.log('LogInfo  : ' + JSON.stringify(testLogInfo));

  try {
    logSearchAttempt(testUsername, testLogInfo);
    Logger.log('✅ logSearchAttempt selesai tanpa error.');
  } catch (e) {
    Logger.log('❌ ERROR: ' + e.toString());
  }

  // Verifikasi hasil — baca kembali baris dari sheet
  const ss       = SpreadsheetApp.getActiveSpreadsheet();
  const logSheet = ss.getSheetByName(SHEET_LOG);
  if (logSheet) {
    const usernames = logSheet.getRange('B2:B' + logSheet.getLastRow()).getValues();
    for (let i = 0; i < usernames.length; i++) {
      if (usernames[i][0] == testUsername) {
        const row = logSheet.getRange(i + 2, 1, 1, logSheet.getMaxColumns()).getValues()[0];
        Logger.log('Data baris di sheet: ' + JSON.stringify(row));
        break;
      }
    }
  } else {
    Logger.log("⚠️ Sheet '" + SHEET_LOG + "' tidak ditemukan!");
  }
}

// ======================================================================
// == FUNGSI UTAMA (doGet, doPost) ==
// ======================================================================

function doGet(e) {
  const action = e.parameter.action;
  const ss     = SpreadsheetApp.getActiveSpreadsheet();

  // --------------------------------------------------
  // GET CITIES
  // --------------------------------------------------
  if (action === 'getCities') {
    const cache       = CacheService.getScriptCache();
    const cachedCities = cache.get('city_list');

    if (cachedCities != null) {
      return ContentService.createTextOutput(cachedCities).setMimeType(ContentService.MimeType.JSON);
    }

    const sheetSekolah = ss.getSheetByName(SHEET_SEKOLAH);
    const range        = sheetSekolah.getRange('A2:A' + sheetSekolah.getLastRow());
    const uniqueCities = [...new Set(range.getValues().flat())].filter(city => city !== '');

    const citiesJSON = JSON.stringify(uniqueCities);
    cache.put('city_list', citiesJSON, 21600);

    return ContentService.createTextOutput(citiesJSON).setMimeType(ContentService.MimeType.JSON);
  }

  // --------------------------------------------------
  // GET SCHOOLS
  // --------------------------------------------------
  if (action === 'getSchools') {
    const city       = e.parameter.city;
    const sheetSekolah = ss.getSheetByName(SHEET_SEKOLAH);
    const dataSekolah  = sheetSekolah.getRange('A2:B' + sheetSekolah.getLastRow()).getValues();

    const schools = dataSekolah
      .filter(row => row[0].toString().toLowerCase() === city.toLowerCase())
      .map(row => row[1])
      .sort();

    return ContentService.createTextOutput(JSON.stringify(schools)).setMimeType(ContentService.MimeType.JSON);
  }

  return ContentService.createTextOutput(JSON.stringify({ error: 'Invalid action' })).setMimeType(ContentService.MimeType.JSON);
}

// ======================================================================
// == DEBUG: doGet ==
// ======================================================================

/**
 * Mensimulasikan request GET action=getCities.
 * Cache city_list dihapus lebih dulu agar data dibaca langsung dari sheet.
 * Menampilkan jumlah kota dan 5 sample pertama.
 *
 * Jalankan dari Apps Script Editor → Run → debug_doGet_getCities
 */
function debug_doGet_getCities() {
  Logger.log('=== DEBUG: doGet action=getCities ===');

  CacheService.getScriptCache().remove('city_list');
  Logger.log('Cache city_list dihapus.');

  const mockEvent = { parameter: { action: 'getCities' } };

  try {
    const result = doGet(mockEvent);
    const text   = result.getContent();
    Logger.log('Response raw: ' + text);
    const cities = JSON.parse(text);
    Logger.log('Jumlah kota : ' + cities.length);
    Logger.log('Sample 5    : ' + cities.slice(0, 5).join(', '));
  } catch (e) {
    Logger.log('❌ ERROR: ' + e.toString());
  }
}

/**
 * Mensimulasikan request GET action=getSchools untuk kota tertentu.
 * Menampilkan seluruh daftar sekolah yang ditemukan beserta jumlahnya.
 *
 * ⚠️  Ganti testCity dengan nama kota yang ADA di sheet data_sekolah kolom A.
 *
 * Jalankan dari Apps Script Editor → Run → debug_doGet_getSchools
 */
function debug_doGet_getSchools() {
  const testCity  = 'Bandung'; // ← ganti sesuai data di sheet

  Logger.log('=== DEBUG: doGet action=getSchools ===');
  Logger.log('Kota: ' + testCity);

  const mockEvent = { parameter: { action: 'getSchools', city: testCity } };

  try {
    const result  = doGet(mockEvent);
    const text    = result.getContent();
    const schools = JSON.parse(text);
    Logger.log('Jumlah sekolah: ' + schools.length);
    schools.forEach((s, i) => Logger.log('  [' + i + '] ' + s));
  } catch (e) {
    Logger.log('❌ ERROR: ' + e.toString());
  }
}

// ======================================================================
// == FUNGSI POST — CARI DATA PESERTA ==
// ======================================================================

function doPost(e) {
  try {
    const searchData = JSON.parse(e.postData.contents);

    Logger.log('===== EKSEKUSI BARU (DATA AMAN) =====');
    Logger.log('Data: ' + JSON.stringify(searchData));

    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // Ambil semua data peserta ke memori
    // A=0, B=1(username), C=2(nama), D=3(email/lama), E=4(asal_sekolah),
    // F=5(kab_kota), G=6(pass_olymp), H=7(jenjang)
    const sheetPengguna = ss.getSheetByName(SHEET_PENGGUNA);
    const dataPeserta   = sheetPengguna.getDataRange().getValues();

    const ditemukanSiswa = [];

    const criteriaKota  = sanitizeKey(searchData.kab_kota      || '');
    const criteriaSekol = sanitizeKey(searchData.asal_sekolah  || '');

    for (let i = 1; i < dataPeserta.length; i++) {
      const row = dataPeserta[i];

      // FILTER 1: Kabupaten/Kota — EXACT match
      if (criteriaKota  && sanitizeKey(row[5]) !== criteriaKota)  continue;

      // FILTER 2: Asal Sekolah — EXACT match
      if (criteriaSekol && sanitizeKey(row[4]) !== criteriaSekol) continue;

      // FILTER 3: Nama Peserta — FUZZY / LIKE match
      if (!fuzzyMatch(searchData.nama || '', row[2])) continue;

      ditemukanSiswa.push({
        username:     row[1],
        nama:         row[2],
        asal_sekolah: row[4],
        kab_kota:     row[5],
        pass_olymp:   row[6],
        jenjang:      row[7]
      });
    }

    let response;

    if (ditemukanSiswa.length === 1) {
      const targetUsername = ditemukanSiswa[0].username;
      const logSheet       = ss.getSheetByName(SHEET_LOG);
      const searchLimit    = 5;

      if (logSheet) {
        const logUsernames = logSheet.getRange('B2:B' + logSheet.getLastRow()).getValues();
        for (let i = 0; i < logUsernames.length; i++) {
          if (logUsernames[i][0] == targetUsername) {
            const logRowNum    = i + 2;
            const counterCell  = logSheet.getRange(logRowNum, 6);
            const currentCount = parseInt(counterCell.getValue()) || 0;

            if (currentCount >= searchLimit) {
              response = {
                status:  'limit_reached',
                message: 'Batas pencarian tercapai (' + searchLimit + 'x).'
              };
              return ContentService.createTextOutput(JSON.stringify(response))
                .setMimeType(ContentService.MimeType.JSON);
            }
            break;
          }
        }
      }

      response = { status: 'success', data: ditemukanSiswa[0] };
      if (searchData.logInfo) {
        logSearchAttempt(ditemukanSiswa[0].username, searchData.logInfo);
      }

    } else if (ditemukanSiswa.length > 1) {
      response = { status: 'duplicate', message: 'Ditemukan data ganda.' };
    } else {
      response = { status: 'notfound', message: 'Nama peserta tidak ditemukan.' };
    }

    return ContentService.createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    Logger.log('ERROR: ' + error.message);
    const errorResponse = { status: 'error', message: 'Error Server: ' + error.message };
    return ContentService.createTextOutput(JSON.stringify(errorResponse))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ======================================================================
// == DEBUG: doPost ==
// ======================================================================

/**
 * Mensimulasikan pencarian peserta dengan payload lengkap (happy path).
 * Diharapkan menghasilkan status "success" jika data ada di sheet.
 *
 * ⚠️  Sesuaikan nama, kab_kota, dan asal_sekolah dengan data NYATA
 *      yang ada di sheet data_peserta sebelum dijalankan.
 *
 * Jalankan dari Apps Script Editor → Run → debug_doPost_found
 */
function debug_doPost_found() {
  const mockPayload = {
    nama:         'Budi',                  // ← ganti sesuai data di sheet
    kab_kota:     'Kota Bandung',          // ← ganti sesuai data di sheet
    asal_sekolah: 'SMK Negeri 1 Bandung',  // ← ganti sesuai data di sheet
    logInfo:      [
      'Browser: SEB-Win',
      'Timestamp: ' + new Date().toISOString()
    ]
  };

  Logger.log('=== DEBUG: doPost — pencarian normal ===');
  Logger.log('Payload: ' + JSON.stringify(mockPayload));

  const mockEvent = { postData: { contents: JSON.stringify(mockPayload) } };

  try {
    const result = doPost(mockEvent);
    const parsed = JSON.parse(result.getContent());
    Logger.log('Status: ' + parsed.status);
    if (parsed.status === 'success') {
      Logger.log('✅ Data ditemukan: ' + JSON.stringify(parsed.data));
    } else {
      Logger.log('ℹ️  Message: ' + parsed.message);
    }
  } catch (e) {
    Logger.log('❌ ERROR: ' + e.toString());
  }
}

/**
 * Menguji tiga skenario edge case sekaligus:
 *   1. Nama tidak ditemukan sama sekali
 *   2. Query nama terlalu pendek (satu huruf → potensi banyak hasil)
 *   3. Semua field kosong (fuzzyMatch harus return false → notfound)
 *
 * Jalankan dari Apps Script Editor → Run → debug_doPost_edge_cases
 */
function debug_doPost_edge_cases() {
  Logger.log('=== DEBUG: doPost — edge cases ===');

  const cases = [
    {
      label:   'Not found — nama tidak ada',
      payload: { nama: 'XYZABCNOTEXIST', kab_kota: '', asal_sekolah: '' }
    },
    {
      label:   'Nama satu huruf — potensi duplicate',
      payload: { nama: 'a', kab_kota: '', asal_sekolah: '' }
    },
    {
      label:   'Semua field kosong',
      payload: { nama: '', kab_kota: '', asal_sekolah: '' }
    }
  ];

  cases.forEach(({ label, payload }) => {
    const mockEvent = { postData: { contents: JSON.stringify(payload) } };
    try {
      const result = doPost(mockEvent);
      const parsed = JSON.parse(result.getContent());
      Logger.log(
        '[' + label + '] status=' + parsed.status +
        ' | message=' + (parsed.message || '-') +
        ' | data=' + (parsed.data ? JSON.stringify(parsed.data) : 'null')
      );
    } catch (e) {
      Logger.log('[' + label + '] ❌ ERROR: ' + e.toString());
    }
  });
}

/**
 * Memverifikasi bahwa rate limit 5x pencarian bekerja dengan benar.
 * Pertama membaca counter saat ini dari sheet log_pencarian,
 * lalu mensimulasikan pencarian dan mengecek apakah response "limit_reached".
 *
 * ⚠️  Ganti testUsername dengan username yang counter-nya sudah >= 5
 *      di kolom F sheet log_pencarian agar limit langsung terpicu.
 *      Sesuaikan pula nama/kab_kota/asal_sekolah agar peserta ditemukan (1 hasil).
 *
 * Jalankan dari Apps Script Editor → Run → debug_doPost_limit
 */
function debug_doPost_limit() {
  const testUsername = 'USR001'; // ← ganti username yang counter-nya >= 5

  Logger.log('=== DEBUG: doPost — rate limit ===');

  // Cek counter saat ini
  const ss       = SpreadsheetApp.getActiveSpreadsheet();
  const logSheet = ss.getSheetByName(SHEET_LOG);
  if (logSheet) {
    const usernames = logSheet.getRange('B2:B' + logSheet.getLastRow()).getValues();
    for (let i = 0; i < usernames.length; i++) {
      if (usernames[i][0] == testUsername) {
        const counter = logSheet.getRange(i + 2, 6).getValue();
        Logger.log('Counter saat ini untuk "' + testUsername + '": ' + counter);
        break;
      }
    }
  } else {
    Logger.log("⚠️ Sheet '" + SHEET_LOG + "' tidak ditemukan!");
    return;
  }

  // Simulasi pencarian — sesuaikan dengan data user tersebut
  const mockPayload = {
    nama:         'Budi',                  // ← ganti sesuai data peserta
    kab_kota:     'Kota Bandung',          // ← ganti sesuai data peserta
    asal_sekolah: 'SMK Negeri 1 Bandung'   // ← ganti sesuai data peserta
  };

  const mockEvent = { postData: { contents: JSON.stringify(mockPayload) } };

  try {
    const result = doPost(mockEvent);
    const parsed = JSON.parse(result.getContent());
    Logger.log('Status  : ' + parsed.status);
    Logger.log('Message : ' + (parsed.message || JSON.stringify(parsed.data)));

    if (parsed.status === 'limit_reached') {
      Logger.log('✅ Rate limit bekerja dengan benar.');
    } else if (parsed.status === 'success') {
      Logger.log('⚠️  Counter belum mencapai batas — coba tambah counter di sheet, atau kurangi searchLimit sementara.');
    } else {
      Logger.log('ℹ️  Peserta tidak ditemukan — periksa kesesuaian payload dengan data di sheet.');
    }
  } catch (e) {
    Logger.log('❌ ERROR: ' + e.toString());
  }
}