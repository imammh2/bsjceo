/* ============================================
   BSJC English Olympiad 2026 - JavaScript
   ============================================ */

const API_URL = 'https://script.google.com/macros/s/AKfycbyIy1FkoNizcqaydxsmhItci52IwEWQMFdlhiA2saRRTF1zPwazgOVvagGYEQOIsV01/exec';

const searchSection = document.getElementById('search-section');
const printableArea = document.getElementById('printable-area');
const spoilerToggle = document.getElementById('spoiler-toggle');
const searchForm = document.getElementById('search-form');
const spoilerArrow = document.getElementById('spoiler-arrow');
const kabKotaSelect = document.getElementById('kab_kota');
const sekolahSelect = document.getElementById('asal_sekolah');
const emailInput = document.getElementById('email');
const submitBtn = document.getElementById('submitBtn');
const resultContainer = document.getElementById('result-container');
const announcementSection = document.getElementById('announcement-section');
const loader = document.getElementById('loader');
const errorModal = document.getElementById('error-modal');
const errorModalMessage = document.getElementById('error-modal-message');
const errorModalClose = document.getElementById('error-modal-close');
const errorModalBackdrop = document.getElementById('error-modal-backdrop');

// Error Modal Functions
function showErrorModal(message) {
    errorModalMessage.textContent = message;
    errorModal.classList.remove('hidden');
}

function hideErrorModal() {
    errorModal.classList.add('hidden');
}

errorModalClose.addEventListener('click', hideErrorModal);
errorModalBackdrop.addEventListener('click', hideErrorModal);

/* ============================================
   Spoiler Toggle
   ============================================ */
spoilerToggle.addEventListener('click', function() {
    const isHidden = searchForm.classList.contains('hidden');
    if (isHidden) {
        searchForm.classList.remove('hidden');
        spoilerArrow.classList.add('rotate-180');
    } else {
        searchForm.classList.add('hidden');
        spoilerArrow.classList.remove('rotate-180');
    }
});

/* ============================================
   Load Cities on Page Load
   ============================================ */
document.addEventListener('DOMContentLoaded', async function() {
    try {
        const response = await fetch(`${API_URL}?action=getCities`);
        const cities = await response.json();
        cities.sort();
        
        kabKotaSelect.innerHTML = '<option value="">Pilih Kabupaten/Kota...</option>';
        cities.forEach(city => {
            const option = document.createElement('option');
            option.value = city;
            option.textContent = city;
            kabKotaSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading cities:', error);
        kabKotaSelect.innerHTML = '<option value="">Gagal memuat data</option>';
    }
});

/* ============================================
   Load Schools on City Change
   ============================================ */
kabKotaSelect.addEventListener('change', async function() {
    const selectedCity = kabKotaSelect.value;
    sekolahSelect.disabled = true;
    sekolahSelect.innerHTML = '<option value="">Memuat sekolah...</option>';
    
    if (!selectedCity) {
        sekolahSelect.innerHTML = '<option value="">Pilih kabupaten/kota terlebih dahulu</option>';
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}?action=getSchools&city=${encodeURIComponent(selectedCity)}`);
        const schools = await response.json();
        schools.sort();
        
        sekolahSelect.innerHTML = '<option value="">Pilih Sekolah...</option>';
        schools.forEach(school => {
            const option = document.createElement('option');
            option.value = school;
            option.textContent = school;
            sekolahSelect.appendChild(option);
        });
        sekolahSelect.disabled = false;
    } catch (error) {
        console.error('Error loading schools:', error);
        sekolahSelect.innerHTML = '<option value="">Gagal memuat sekolah</option>';
    }
});

/* ============================================
   Handle Form Submission
   ============================================ */
submitBtn.addEventListener('click', async function(e) {
    e.preventDefault();

    // Validasi email harus diisi
    if (!emailInput.value.trim()) {
        showErrorModal('Mohon isi email sesuai email saat pendaftaran terlebih dahulu!<br>Jika lupa silahkan hubungi PJ Lomba English Olympiad.');
        return;
    }

    const originalBtnText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<svg class="animate-spin w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Sedang Mencari...';
    
    resultContainer.innerHTML = '';
    announcementSection.classList.add('hidden');
    loader.classList.remove('hidden');

    const timestamp = new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });
    const infoArray = [
        "Dicari pada 🕒 " + timestamp + " WIB",
        "🧭 Bahasa: " + navigator.language,
        "🌐 Zona Waktu: " + Intl.DateTimeFormat().resolvedOptions().timeZone,
        "📱 Ukuran Layar: " + `${window.screen.width}x${window.screen.height}`,
        "🖥️ User Agent: " + navigator.userAgent
    ];

    const formData = {
        nama: "",
        email: emailInput.value,
        password: "",
        asal_sekolah: sekolahSelect.value,
        kab_kota: kabKotaSelect.value,
        logInfo: infoArray
    };

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            mode: 'cors',
            body: JSON.stringify(formData)
        });
        const result = await response.json();

        if (result.status === 'success') {
            // Hide search section and show printable area
            searchSection.classList.add('hidden');
            printableArea.classList.remove('hidden');
            
            const data = result.data;
            
            // Render HTML Hasil
            resultContainer.innerHTML = `
                <div class="bg-emerald-50 border-b border-emerald-200 p-4 text-center">
                    <h4 class="text-lg font-bold text-emerald-700">✅ Data Peserta Ditemukan</h4>
                </div>
                <dl class="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 md:p-6">
                    <div>
                        <dt class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Nama Lengkap</dt>
                        <dd class="text-base font-semibold text-slate-800">${data.nama}</dd>
                    </div>
                    <div>
                        <dt class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Username Lomba</dt>
                        <dd class="text-base font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">${data.username}</dd>
                    </div>
                    <div>
                        <dt class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Password Lomba</dt>
                        <dd class="text-base font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">${data.pass_olymp}</dd>
                    </div>
                    <div>
                        <dt class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Jenjang Lomba</dt>
                        <dd class="text-base font-semibold text-slate-800">${data.jenjang}</dd>
                    </div>
                    <div>
                        <dt class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Asal Sekolah</dt>
                        <dd class="text-base font-semibold text-slate-800">${data.asal_sekolah}</dd>
                    </div>
                    <div>
                        <dt class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Kabupaten/Kota</dt>
                        <dd class="text-base font-semibold text-slate-800">${data.kab_kota}</dd>
                    </div>
                    <div>
                        <dt class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Jadwal Simulasi</dt>
                        <dd class="text-base font-semibold text-slate-800">Kamis-Jumat, 21-22 Mei 2026<br><small class="text-slate-500"></small></dd>
                    </div>
                    <div>
                        <dt class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Jadwal Penyisihan</dt>
                        <dd class="text-base font-semibold text-slate-800">Sabtu, 23 Mei 2026<br><small class="text-slate-500"></small></dd>
                    </div>
                </dl>
                
                <div class="p-4 md:p-6 bg-slate-50 border-t border-slate-200 text-center">
                    <button id="savePdfBtn" class="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all">
                        📄 Simpan Bukti (PDF)
                    </button>
                </div>
            `;

            announcementSection.style.display = 'block';

            // PDF Button Event Listener
            document.getElementById('savePdfBtn').addEventListener('click', function() {
                this.style.display = 'none';

                // Create PDF content with header
                const pdfContent = document.createElement('div');
                pdfContent.innerHTML = `
                    <div style="font-family: 'Inter', sans-serif; padding: 20px; color: #1e293b;">
                        <!-- Header -->
                        <div style="text-align: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #46A6FF;">
                            <h1 style="font-size: 18px; font-weight: 800; color: #1473E6; margin: 0 0 5px 0;">BIG SMK Jatim Cup Junior Level</h1>
                            <p style="font-size: 14px; font-weight: 600; color: #475569; margin: 0;">English Olympiad 2026</p>
                            <div style="height: 2px; background: linear-gradient(135deg, #46A6FF 0%, #1473E6 100%); margin-top: 10px;"></div>
                        </div>
                        
                        <!-- Content Title -->
                        <h2 style="font-size: 16px; font-weight: 700; color: #1e293b; margin: 0 0 15px 0; padding: 10px; background: #f1f5f9; border-radius: 8px; text-align: center;">Data Peserta BSJC-JL English Olympiad</h2>
                        
                        <!-- Participant Data -->
                        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                            <tr>
                                <td style="padding: 8px 5px; border-bottom: 1px solid #e2e8f0; font-size: 12px; font-weight: 600; color: #64748b; width: 40%;">Nama Lengkap</td>
                                <td style="padding: 8px 5px; border-bottom: 1px solid #e2e8f0; font-size: 12px; font-weight: 700; color: #1e293b;">${data.nama}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 5px; border-bottom: 1px solid #e2e8f0; font-size: 12px; font-weight: 600; color: #64748b;">Username Lomba</td>
                                <td style="padding: 8px 5px; border-bottom: 1px solid #e2e8f0; font-size: 12px; font-weight: 700; color: #1473E6; background: #f0f9ff; border-radius: 4px;">${data.username}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 5px; border-bottom: 1px solid #e2e8f0; font-size: 12px; font-weight: 600; color: #64748b;">Password Lomba</td>
                                <td style="padding: 8px 5px; border-bottom: 1px solid #e2e8f0; font-size: 12px; font-weight: 700; color: #1473E6; background: #f0f9ff; border-radius: 4px;">${data.pass_olymp}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 5px; border-bottom: 1px solid #e2e8f0; font-size: 12px; font-weight: 600; color: #64748b;">Jenjang Lomba</td>
                                <td style="padding: 8px 5px; border-bottom: 1px solid #e2e8f0; font-size: 12px; font-weight: 700; color: #1e293b;">${data.jenjang}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 5px; border-bottom: 1px solid #e2e8f0; font-size: 12px; font-weight: 600; color: #64748b;">Asal Sekolah</td>
                                <td style="padding: 8px 5px; border-bottom: 1px solid #e2e8f0; font-size: 12px; font-weight: 700; color: #1e293b;">${data.asal_sekolah}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 5px; border-bottom: 1px solid #e2e8f0; font-size: 12px; font-weight: 600; color: #64748b;">Kabupaten/Kota</td>
                                <td style="padding: 8px 5px; border-bottom: 1px solid #e2e8f0; font-size: 12px; font-weight: 700; color: #1e293b;">${data.kab_kota}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 5px; border-bottom: 1px solid #e2e8f0; font-size: 12px; font-weight: 600; color: #64748b;">Jadwal Simulasi</td>
                                <td style="padding: 8px 5px; border-bottom: 1px solid #e2e8f0; font-size: 12px; font-weight: 700; color: #1e293b;">Kamis-Jumat, 21-22 Mei 2026</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 5px; border-bottom: 1px solid #e2e8f0; font-size: 12px; font-weight: 600; color: #64748b;">Jadwal Penyisihan</td>
                                <td style="padding: 8px 5px; border-bottom: 1px solid #e2e8f0; font-size: 12px; font-weight: 700; color: #1e293b;">Sabtu, 23 Mei 2026<br><span style="font-size: 11px; color: #64748b;"></span></td>
                            </tr>
                        </table>
                        
                        <!-- Announcement -->
                        <div style="background: #fffbeb; border: 1px solid #f59e0b; border-radius: 8px; padding: 15px; margin-top: 15px;">
                            <h3 style="font-size: 14px; font-weight: 700; color: #b45309; margin: 0 0 10px 0; text-align: center;">📢 PENGUMUMAN PENTING</h3>
                            <ol style="font-size: 11px; color: #92400e; margin: 0; padding-left: 18px; line-height: 1.8;">
                                <li><strong>Simpan Username & Password</strong> di atas. Digunakan untuk <em>Simulasi</em> dan <em>Penyisihan</em>.</li>
                                <li>Wajib instal aplikasi <strong>Safeexambrowser Olympiad</strong> sebelum simulasi.</li>
                                <li>Ikuti instruksi Panitia/Penanggungjawab di grup WA resmi Olympiad.</li>
                            </ol>
                            <p style="font-size: 10px; color: #dc2626; text-align: center; margin: 10px 0 0 0; padding-top: 8px; border-top: 1px solid #fcd34d; font-style: italic;">Rahasiakan akun Anda. Jangan berikan kepada orang lain.</p>
                        </div>
                        
                        <!-- Footer -->
                        <div style="text-align: center; margin-top: 20px; padding-top: 10px; border-top: 1px solid #e2e8f0;">
                            <p style="font-size: 10px; color: #94a3b8; margin: 0;">© 2026 MGMP Bahasa Inggris SMK Provinsi Jawa Timur</p>
                            <p style="font-size: 9px; color: #cbd5e1; margin: 3px 0 0 0;">By Olympiad Team</p>
                        </div>
                    </div>
                `;

                const options = {
                    margin: 0.3,
                    filename: `BSJC2026_${data.username}.pdf`,
                    image: { type: 'jpeg', quality: 0.98 },
                    html2canvas: {
                        scale: 2,
                        useCORS: true,
                        scrollY: 0
                    },
                    jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
                };

                html2pdf().set(options).from(pdfContent).save().then(() => {
                    this.style.display = 'block';
                });
            });

        } else if (result.status === 'limit_reached') {
            searchSection.classList.add('hidden');
            printableArea.classList.remove('hidden');
            resultContainer.innerHTML = `<div class="bg-red-50 border border-red-200 rounded-xl p-4 text-center"><p class="text-red-600 font-semibold">⚠️ ${result.message}</p></div><div class="mt-4 text-center"><button id="backToSearch" class="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg transition-all text-sm">← Kembali ke Pencarian</button></div>`;
            document.getElementById('backToSearch').addEventListener('click', function() {
                printableArea.classList.add('hidden');
                searchSection.classList.remove('hidden');
            });
            submitBtn.innerHTML = 'Batas Pencarian Tercapai';
            return;
        } else {
            searchSection.classList.add('hidden');
            printableArea.classList.remove('hidden');
            resultContainer.innerHTML = `<div class="bg-red-50 border border-red-200 rounded-xl p-4 text-center"><p class="text-red-600 font-semibold">❌ ${result.message}</p></div><div class="mt-4 text-center"><button id="backToSearch" class="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg transition-all text-sm">← Kembali ke Pencarian</button></div>`;
            document.getElementById('backToSearch').addEventListener('click', function() {
                printableArea.classList.add('hidden');
                searchSection.classList.remove('hidden');
            });
        }
    } catch (error) {
        console.error(error);
        searchSection.classList.add('hidden');
        printableArea.classList.remove('hidden');
        resultContainer.innerHTML = '<div class="bg-red-50 border border-red-200 rounded-xl p-4 text-center"><p class="text-red-600 font-semibold">Gagal terhubung ke server. Silakan coba lagi nanti.</p></div><div class="mt-4 text-center"><button id="backToSearch" class="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg transition-all text-sm">← Kembali ke Pencarian</button></div>';
        document.getElementById('backToSearch').addEventListener('click', function() {
            printableArea.classList.add('hidden');
            searchSection.classList.remove('hidden');
        });
    } finally {
        loader.classList.add('hidden');
        if (submitBtn.textContent !== 'Batas Pencarian Tercapai') {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
        }
    }
});

/* ============================================
   Splash Screen JavaScript
   ============================================ */

document.addEventListener('DOMContentLoaded', function() {
    const splashScreen = document.getElementById('splash-screen');
    const loaderBar = document.getElementById('loader-bar');
    const loaderText = document.getElementById('loader-text');
    
    if (!splashScreen) return;
    
    let progress = 0;
    const messages = [
        'Memuat data...',
        'Menyiapkan antarmuka...',
        'Hampir selesai...',
        'Selamat datang!'
    ];
    
    function updateLoader(percent, messageIndex) {
        if (loaderBar) {
            loaderBar.style.width = percent + '%';
        }
        if (loaderText && messageIndex < messages.length) {
            loaderText.textContent = messages[messageIndex];
        }
    }
    
    const loadingInterval = setInterval(function() {
        progress += Math.random() * 15;
        
        if (progress >= 100) {
            progress = 100;
            clearInterval(loadingInterval);
            
            setTimeout(function() {
                splashScreen.classList.add('hidden');
                
                setTimeout(function() {
                    splashScreen.style.display = 'none';
                }, 500);
            }, 500);
            
            updateLoader(100, messages.length - 1);
        } else {
            let messageIndex = 0;
            if (progress >= 30) messageIndex = 1;
            if (progress >= 60) messageIndex = 2;
            if (progress >= 90) messageIndex = 3;
            
            updateLoader(Math.min(progress, 100), messageIndex);
        }
    }, 300);
});