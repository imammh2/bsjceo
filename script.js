/* ============================================
   BSJC English Olympiad 2025 - JavaScript
   ============================================ */

const API_URL = 'https://script.google.com/macros/s/AKfycbyIy1FkoNizcqaydxsmhItci52IwEWQMFdlhiA2saRRTF1zPwazgOVvagGYEQOIsV01/exec';

const searchSection = document.getElementById('search-section');
const form = document.getElementById('checkForm');
const submitBtn = document.getElementById('submitBtn');
const resultContainer = document.getElementById('result-container');
const announcementSection = document.getElementById('announcement-section');
const loader = document.getElementById('loader');

/* // ================================================================
   KODE NONAKTIF (DIKOMENTAR SEMENTARA) - UNTUK KEMBALIKAN FITUR LAMA
   ================================================================
   

const citySelect = document.getElementById('kab_kota');
const schoolSelect = document.getElementById('asal_sekolah');

// 1. Fetch cities on page load
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch(`${API_URL}?action=getCities`);
        const cities = await response.json();
        cities.sort().forEach(city => {
            const option = new Option(city, city);
            citySelect.add(option);
        });
    } catch (error) {
        // Silent fail or alert
        // alert('Gagal memuat daftar kota. Periksa koneksi Anda.');
    }
});

// 2. Fetch schools on city change
citySelect.addEventListener('change', async () => {
    const selectedCity = citySelect.value;
    schoolSelect.disabled = true;
    schoolSelect.innerHTML = '<option value="">Memuat sekolah...</option>';
    if (!selectedCity) return;

    try {
        const response = await fetch(`${API_URL}?action=getSchools&city=${encodeURIComponent(selectedCity)}`);
        const schools = await response.json();
        schoolSelect.innerHTML = '<option value="" disabled selected>Pilih Sekolah...</option>';
        schools.sort().forEach(school => {
            const option = new Option(school, school);
            schoolSelect.add(option);
        });
        schoolSelect.disabled = false;
    } catch (error) {
        schoolSelect.innerHTML = '<option value="">Gagal memuat sekolah</option>';
    }
});

// ================================================================
   AKHIR KODE NONAKTIF
   ================================================================
*/

// 3. Handle form submission
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const originalBtnText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sedang Mencari Data...';
    
    resultContainer.style.display = 'none';
    announcementSection.style.display = 'none'; 
    loader.style.display = 'flex';

    const timestamp = new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });
    const infoArray = [
        "Dicari pada 🕒 " + timestamp + " WIB",
        "🧭 Bahasa: " + navigator.language,
        "🌐 Zona Waktu: " + Intl.DateTimeFormat().resolvedOptions().timeZone,
        "📱 Ukuran Layar: " + `${window.screen.width}x${window.screen.height}`,
        "🖥️ User Agent: " + navigator.userAgent
    ];

    const formData = {
        // nama: document.getElementById('nama').value, // DIKOMENTAR
        nama: "", // Kirim kosong agar JS tidak error
        
        email: document.getElementById('email').value,
        
        // password: document.getElementById('password').value, // DIKOMENTAR
        password: "", // Kirim kosong
        
        // asal_sekolah: schoolSelect.value, // DIKOMENTAR
        asal_sekolah: "", // Kirim kosong
        
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
            // Animasi collapse form
            searchSection.classList.add('collapsed');
            
            const data = result.data;
            resultContainer.style.display = 'block';
            resultContainer.className = 'result-card';
            
            // Render HTML Hasil
            resultContainer.innerHTML = `
                <h4>✅ Data Peserta Ditemukan</h4>
                <dl>
                    <dt>Nama Lengkap</dt>
                    <dd>${data.nama}</dd>
                    
                    <dt>Username Lomba</dt>
                    <dd><strong>${data.username}</strong></dd>
                    
                    <dt>Password Lomba</dt>
                    <dd><strong>${data.pass_olymp}</strong></dd>

                    <dt>Jenjang Lomba</dt>
                    <dd><strong>${data.jenjang}</strong></dd>
                    
                    <dt>Asal Sekolah</dt>
                    <dd>${data.asal_sekolah}</dd>
                    
                    <dt>Kabupaten/Kota</dt>
                    <dd>${data.kab_kota}</dd>

                    <dt>Jadwal Simulasi</dt>
                    <dd>Selasa, 06 Jan 2026 <br><small>(13.00 - 23.59)</small></dd>

                    <dt>Jadwal Penyisihan</dt>
                    <dd>Kamis, 08 Jan 2026 <br>
                        <small>SMP: 13.00-14.00 | SMK: 14.30-16.30</small>
                    </dd>

                    <dt>Jadwal Final</dt>
                    <dd>Selasa, 13 Jan 2026 <br>
                        <small>SMP: 13.00-14.00 | SMK: 14.30-16.30</small>
                    </dd>
                </dl>
                
                <div class="result-actions">
                    <button id="savePdfBtn">📄 Simpan Bukti (PDF)</button>
                </div>
            `;

            announcementSection.style.display = 'block';

            // Tambahkan Event Listener untuk tombol PDF (harus di dalam blok sukses karena tombol baru dibuat)
            document.getElementById('savePdfBtn').addEventListener('click', function() {
                // Sembunyikan tombol saat generate PDF agar tidak ikut ter-render jelek
                this.style.display = 'none';

                const elementToSave = document.getElementById('printable-area');
                const options = {
                    margin: 0.2,
                    filename: `BSJC2025_${data.username}.pdf`,
                    image: { type: 'jpeg', quality: 0.98 },
                    html2canvas: { 
                        scale: 2, // Scale tinggi agar tajam di HP
                        useCORS: true, // Agar gambar dari external/CDN termuat
                        scrollY: 0
                    },
                    jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' } 
                };

                html2pdf().set(options).from(elementToSave).save().then(() => {
                    // Munculkan kembali tombol setelah download selesai
                    this.style.display = 'block';
                });
            });

        } else if (result.status === 'limit_reached') {
            searchSection.classList.remove('collapsed');
            resultContainer.style.display = 'block';
            resultContainer.className = 'error';
            resultContainer.innerHTML = `<p>⚠️ ${result.message}</p>`;    
            submitBtn.textContent = 'Batas Pencarian Tercapai';
            return; // Stop here, dont enable button
        } else {
            searchSection.classList.remove('collapsed');
            resultContainer.style.display = 'block';
            resultContainer.className = 'error';
            resultContainer.innerHTML = `<p>❌ ${result.message}</p>`;
        }
    } catch (error) {
        console.error(error);
        searchSection.classList.remove('collapsed');
        resultContainer.style.display = 'block';
        resultContainer.className = 'error';
        resultContainer.innerHTML = '<p>Gagal terhubung ke server. Silakan coba lagi nanti.</p>';
    } finally {
        loader.style.display = 'none';
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
    const loaderBar = document.querySelector('.loader-bar');
    const loaderText = document.querySelector('.loader-text');
    
    if (!splashScreen) return;
    
    let progress = 0;
    const messages = [
        'Memuat data...',
        'Menyiapkan antarmuka...',
        'Hampir selesai...',
        'Selamat datang!'
    ];
    
    // Function to update loader
    function updateLoader(percent, messageIndex) {
        if (loaderBar) {
            loaderBar.style.width = percent + '%';
        }
        if (loaderText && messageIndex < messages.length) {
            loaderText.textContent = messages[messageIndex];
        }
    }
    
    // Simulate loading process
    const loadingInterval = setInterval(function() {
        progress += Math.random() * 15;
        
        if (progress >= 100) {
            progress = 100;
            clearInterval(loadingInterval);
            
            // Hide splash screen
            setTimeout(function() {
                splashScreen.classList.add('hidden');
                
                // Remove splash screen from DOM after animation
                setTimeout(function() {
                    splashScreen.style.display = 'none';
                }, 500);
            }, 500);
            
            updateLoader(100, messages.length - 1);
        } else {
            // Update message based on progress
            let messageIndex = 0;
            if (progress >= 30) messageIndex = 1;
            if (progress >= 60) messageIndex = 2;
            if (progress >= 90) messageIndex = 3;
            
            updateLoader(Math.min(progress, 100), messageIndex);
        }
    }, 300);
});