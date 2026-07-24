// رابط السيرفر المربوط على Wispbyte
const API_BASE_URL = 'https://Fast-Save-Pro.wispbyte.app';

let selectedVideoFile = null;

// التبديل بين الأقسام
function switchTab(index) {
    document.querySelectorAll('.nav-tab').forEach((tab, i) => tab.classList.toggle('active', i === index));
    document.querySelectorAll('.section').forEach((sec, i) => sec.classList.toggle('active', i === index));
}

// عرض التنبيهات
function showToast(text) {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = text;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// 1. فحص رابط الفيديو عبر السيرفر
async function checkLink() {
    const url = document.getElementById('urlInput').value.trim();
    const isPlaylist = document.getElementById('playlistSwitch').checked;

    if (!url) {
        showToast('يرجى إدخال الرابط أولاً!');
        return;
    }

    const checkBtn = document.getElementById('checkBtn');
    const formatSelect = document.getElementById('formatSelect');
    const statusDiv = document.getElementById('downloadStatus');

    checkBtn.disabled = true;
    checkBtn.textContent = 'جاري الفحص...';
    statusDiv.className = 'status-message status-info show';
    statusDiv.textContent = 'جاري الاتصال بالسيرفر لفحص الرابط...';

    try {
        const response = await fetch(`${API_BASE_URL}/api/check`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: url, isPlaylist: isPlaylist })
        });

        if (!response.ok) throw new Error('الرابط غير صالح');

        const data = await response.json();
        formatSelect.innerHTML = '';

        if (data.formats && data.formats.length > 0) {
            data.formats.forEach(f => {
                const opt = document.createElement('option');
                opt.value = f.format_id || f.id || f.value;
                opt.textContent = f.label || `${f.ext || 'video'} - ${f.resolution || 'الجودة الافتراضية'}`;
                formatSelect.appendChild(opt);
            });
        } else {
            formatSelect.innerHTML = `
                <option value="bestvideo+bestaudio/best">أفضل جودة (MP4)</option>
                <option value="bestaudio/best">صوت فقط (MP3)</option>
            `;
        }

        formatSelect.disabled = false;
        document.getElementById('downloadBtn').disabled = false;
        statusDiv.className = 'status-message status-success show';
        statusDiv.textContent = `تم الفحص: ${data.title || 'جاهز للتحميل'}`;

    } catch (err) {
        statusDiv.className = 'status-message status-error show';
        statusDiv.textContent = 'خطأ في فحص الرابط أو عدم استجابة السيرفر.';
    } finally {
        checkBtn.disabled = false;
        checkBtn.innerHTML = '<i class="fas fa-search"></i> فحص الرابط';
    }
}

// 2. بدء التحميل عبر السيرفر
function startDownload() {
    const url = document.getElementById('urlInput').value.trim();
    const format = document.getElementById('formatSelect').value;

    if (!url) return;

    const statusDiv = document.getElementById('downloadStatus');
    statusDiv.className = 'status-message status-info show';
    statusDiv.textContent = 'جاري تحويلك لملف التنزيل...';

    // توجيه المتصفح لتحميل الملف مباشرة من السيرفر
    window.location.href = `${API_BASE_URL}/api/download?url=${encodeURIComponent(url)}&format=${encodeURIComponent(format)}`;
}

// 3. اختيار ملف محلي
function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        selectedVideoFile = file;
        document.getElementById('selectedVideoText').textContent = `الملف المختار: ${file.name}`;
        document.getElementById('convertBtn').disabled = false;
    }
}

// 4. تحويل الفيديو المحلي إلى MP3 عبر السيرفر
async function startConvert() {
    if (!selectedVideoFile) return;

    const convertBtn = document.getElementById('convertBtn');
    const statusDiv = document.getElementById('convertStatus');

    convertBtn.disabled = true;
    statusDiv.className = 'status-message status-info show';
    statusDiv.textContent = 'جاري رفع الفيديو ومعالجته...';

    try {
        const formData = new FormData();
        formData.append('video', selectedVideoFile);
        formData.append('startTime', document.getElementById('startTime').value || 0);
        formData.append('endTime', document.getElementById('endTime').value || 0);

        const response = await fetch(`${API_BASE_URL}/api/convert`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) throw new Error('فشلت معالجة الصوت');

        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `${selectedVideoFile.name.split('.')[0]}.mp3`;
        document.body.appendChild(a);
        a.click();
        a.remove();

        statusDiv.className = 'status-message status-success show';
        statusDiv.textContent = 'تم التحويل والتنزيل بنجاح!';
    } catch (err) {
        statusDiv.className = 'status-message status-error show';
        statusDiv.textContent = 'حدث خطأ أثناء معالجة الملف.';
    } finally {
        convertBtn.disabled = false;
    }
}
