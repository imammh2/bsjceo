/* ============================================
   BSJC English Olympiad 2026 - JavaScript
   ============================================ */

const API_URL = 'https://script.google.com/macros/s/AKfycbyIy1FkoNizcqaydxsmhItci52IwEWQMFdlhiA2saRRTF1zPwazgOVvagGYEQOIsV01/exec';

const searchSection = document.getElementById('search-section');
const form = document.getElementById('checkForm');
const submitBtn = document.getElementById('submitBtn');
const resultContainer = document.getElementById('result-container');
const announcementSection = document.getElementById('announcement-section');
const loader = document.getElementById('loader');

// Handle form submission
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const originalBtnText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sedang Mencari Data...';
    
    resultContainer.style.display = 'none';
    announcementSection.style.display = 'none'; 
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
        email: document.getElementById('email').value,
        password: "",
        asal_sekolah: "",
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
            searchSection.classList.add('hidden');
            
            const data = result.data;
            resultContainer.style.display = 'block';
            resultContainer.className = 'bg-white border border-slate-200 rounded-xl overflow-hidden';
            
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
                        <dd class="text-base font-semibold text-slate-800">Selasa, 06 Jan 2026 <br><small class="text-slate-500">(13.00 - 23.59)</small></dd>
                    </div>
                    <div>
                        <dt class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Jadwal Penyisihan</dt>
                        <dd class="text-base font-semibold text-slate-800">Kamis, 08 Jan 2026 <br><small class="text-slate-500">SMP: 13.00-14.00 | SMK: 14.30-16.30</small></dd>
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

                const elementToSave = document.getElementById('printable-area');
                const options = {
                    margin: 0.2,
                    filename: `BSJC2026_${data.username}.pdf`,
                    image: { type: 'jpeg', quality: 0.98 },
                    html2canvas: { 
                        scale: 2,
                        useCORS: true,
                        scrollY: 0
                    },
                    jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' } 
                };

                html2pdf().set(options).from(elementToSave).save().then(() => {
                    this.style.display = 'block';
                });
            });

        } else if (result.status === 'limit_reached') {
            searchSection.classList.remove('hidden');
            resultContainer.style.display = 'block';
            resultContainer.className = 'bg-red-50 border border-red-200 rounded-xl p-4 text-center';
            resultContainer.innerHTML = `<p class="text-red-600 font-semibold">⚠️ ${result.message}</p>`;    
            submitBtn.textContent = 'Batas Pencarian Tercapai';
            return;
        } else {
            searchSection.classList.remove('hidden');
            resultContainer.style.display = 'block';
            resultContainer.className = 'bg-red-50 border border-red-200 rounded-xl p-4 text-center';
            resultContainer.innerHTML = `<p class="text-red-600 font-semibold">❌ ${result.message}</p>`;
        }
    } catch (error) {
        console.error(error);
        searchSection.classList.remove('hidden');
        resultContainer.style.display = 'block';
        resultContainer.className = 'bg-red-50 border border-red-200 rounded-xl p-4 text-center';
        resultContainer.innerHTML = '<p class="text-red-600 font-semibold">Gagal terhubung ke server. Silakan coba lagi nanti.</p>';
    } finally {
        loader.classList.add('hidden');
        if (submitBtn.textContent !== 'Batas Pencarian Tercapai') {
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
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