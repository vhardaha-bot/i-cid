// ============================================
// i-CID — app.js
// Photo Forensic System — Complete Frontend Logic
// ============================================

// ---- CONFIG ----
const API_URL = "https://i-cid-backend.vhoriginal.com/upload.php"; // Apna actual Hostinger PHP path yahan daal de
const MAX_FILE_SIZE_MB = 5;
const COMPRESS_MAX_WIDTH = 1024;
const COMPRESS_QUALITY = 0.75;

// ---- DOM ELEMENTS ----
const dropZone = document.getElementById('dropZone');
const imageInput = document.getElementById('imageInput');
const imagePreview = document.getElementById('imagePreview');
const scanLine = document.getElementById('scanLine');
const actionButtons = document.getElementById('actionButtons');
const loadingTerminal = document.getElementById('loadingTerminal');
const terminalText = document.getElementById('terminalText');
const resultContainer = document.getElementById('resultContainer');
const coreIntelText = document.getElementById('coreIntelText');
const resultThumb = document.getElementById('resultThumb');
const statusHeader = document.getElementById('statusHeader');
const generateOGBtn = document.getElementById('generateOGBtn');
const newScanBtn = document.getElementById('newScanBtn');
const backBtn = document.getElementById('backBtn');
const exitToast = document.getElementById('exitToast');

// ---- STATE ----
let compressedImageBlob = null;
let originalPreviewDataUrl = null;
let currentAction = null;
let currentScreen = 'upload'; // 'upload' | 'actions' | 'loading' | 'result'

// ---- LOADING MESSAGES (Serious/Forensic tone) ----
const loadingMessages = [
    "[सिस्टम] फोटो को माइक्रोस्कोप के नीचे रखा जा रहा है...",
    "[स्कैन] पिक्सल-पिक्सल की तलाशी चल रही है...",
    "[AI] डिटेक्टिव दिमाग़ चालू हो रहा है...",
    "[प्रोसेस] कच्चा चिट्ठा तैयार हो रहा है...",
    "[स्टेटस] फाइनल रिपोर्ट पे मोहर लग रही है..."
];

// ---- PROMPTS — Har feature ke liye serious/factual Gemini system prompts ----
const prompts = {
    fake: `Tu ek tezz forensic image analyst hai jiska andaaz factual hai par baat karne ka tareeka thoda mazedaar. Is image ko analyze kar aur bata:
1. Kya yeh photo AI-generated lagti hai (Midjourney/DALL-E/Stable Diffusion ke patterns jaise unnatural texture, asymmetry, ya artifacts)?
2. Kya iss par heavy filter/beautification (Snapchat/Instagram filter) ka use hua hai?
3. Kya background edited/composite lagta hai (lighting mismatch, edge artifacts)?
4. Agar yeh ek screenshot hai (bank transaction, chat, ya document), kya isme scam/fraud ke common signs hain (galat formatting, suspicious sender, unrealistic amount)?
5. Agar image blurry ya low-quality hai jisse confident judgement na ho sake, yeh clearly bata "Photo ki quality kam hai, confident result nahi de sakte."

TONE: 70% factual + 30% halka witty. Pehle seedha factual finding do, fir ek-do mazedaar line se garnish kar do (jaise "Filter itna heavy hai ki asli chehra dhoondhne CID lagani padegi 😄"). Mazaak sirf photo/filter/edit pe, kisi insaan ka apmaan ya body-shaming kabhi nahi. Hinglish mein PAR Devanagari script (Hindi alphabet) mein likho, 4-5 lines. Agar koi minor (bachha) image mein hai, sirf general/safe observation do, mazaak bilkul nahi.`,

    brand: `Tu ek product/fashion identification expert hai jiska gyaan solid hai par baat karne ka style chatpata. Is image mein dikhne wale outfit, shoes, ya accessories ko analyze kar:
1. Brand identify karne ki koshish kar (sirf clearly visible logos/patterns se, confidence % bata: "70% confidence yeh Nike hai").
2. Original ya first-copy/duplicate hone ke visual signs bata (stitching quality, logo placement, material texture) — agar confident nahi hai, saaf bol do.
3. Anumanit price range Indian Rupees mein de (exact number nahi, range — jaise "₹1500-2500 ke beech").
4. Agar image blurry hai ya brand clearly visible nahi hai, yeh bata "Clear photo se behtar identification ho sakta hai."

TONE: 70% factual + 30% witty. Factual detail pehle, fir ek mazedaar line (jaise "Logo bol raha Nike, par stitching bol rahi Sarojini Nagar 😏"). Mazaak sirf product/brand pe, kabhi pehnne wale insaan ki financial status ya aukat pe comment mat karo. Hinglish PAR Devanagari script (Hindi alphabet) mein, 4-5 lines.`,

    utility: `Tu ek kaam ka utility assistant hai jo images se practical information nikalta hai — seedha aur thoda mazedaar. Is image mein jo bhi mile, usko handle kar:

- Agar vehicle number plate dikh rahi hai: sirf number plate ka text exactly nikal kar likho (jaise "MP 09 AB 1234"). Owner ki koi detail batane ki koshish bilkul mat karo — sirf yeh likho "Official verification ke liye Parivahan portal (parivahan.gov.in) par check karen."
- Agar math/calculation problem dikh rahi hai: step-by-step solve karo aur final answer do.
- Agar koi error message/screenshot (app crash, website error, phone settings) dikh raha hai: simple troubleshooting steps do.
- Agar koi sarkari form/document dikh raha hai: usme kya fields hain, kya zaroori bharni hai, ya kuch missing/incomplete lagta hai — bata.
- Agar image blurry hai, yeh bata "Text clearly nahi padh paa rahe, clear photo bhejen."

TONE: 70% practical + 30% halka witty. Kaam ki jaankari accurate aur sabse pehle, ek chhoti mazedaar tippani chalegi (jaise "Math ka sawaal? Chalo CID detective ban gaya teacher 😄"). Hinglish PAR Devanagari script (Hindi alphabet) mein, seedha jawab.`,

    device: `Tu ek photo forensic expert hai jo image quality patterns se anumaan lagata hai ki photo kis device se li gayi — factual par mazedaar andaaz mein. Is image ko dekh kar bata:
1. Kya yeh professional camera (DSLR/Mirrorless) se li gayi lagti hai (signs: shallow depth of field, low noise, high dynamic range)?
2. Kya yeh mobile phone camera se li gayi lagti hai (signs: HDR processing, typical smartphone color grading, aspect ratio)?
3. Kya yeh AI-generated, heavily edited, ya screenshot lagti hai (signs: compression artifacts, unnatural smoothness, screen capture patterns)?

Apna best anumaan confidence ke saath do (jaise "60% confidence yeh mobile camera se li gayi hai"), aur explicitly likho: "Yeh anumaan hai, asli camera metadata (EXIF) WhatsApp/Instagram forward hone par delete ho jaata hai, isliye 100% guarantee nahi."

TONE: 70% factual + 30% witty. Technical guess pehle, ek halki line se end (jaise "Itni clear photo? Lagta hai mehanga phone hai ya bande ne haath nahi hilaya 😄"). Hinglish PAR Devanagari script (Hindi alphabet) mein, 3-4 lines.`,

    deepscan: `Tu ek complete forensic image analyst hai jo photo ka poora kachcha chittha kholta hai — detailed, factual, aur baat karne ka andaaz mazedaar. Is image ka poora breakdown ek paragraph mein de:
- Image mein kya/kaun dikh raha hai (objects, log, setting)
- Background aur context kya bata raha hai
- Kya image edited/filtered/AI-generated lagti hai
- Agar koi text/document/number plate dikh raha hai, uska content
- Overall image quality aur kya yeh confident analysis ke liye sufficient hai

TONE: 70% factual forensic report + 30% witty narration. Sab kuch ek continuous paragraph mein, Hinglish mein PAR Devanagari script (Hindi alphabet) mein, jaise ek smart detective apni report sunaa raha ho jisme beech-beech mein halki mazedaar tippani ho. Mazaak photo/scene/edit pe, kisi insaan ka apmaan kabhi nahi. Agar minor dikhe toh mazaak hata do. 6-8 lines.`
};

// ============================================
// SCREEN STATE MANAGEMENT (Back button + History)
// ============================================

function setScreen(screen) {
    currentScreen = screen;
    history.pushState({ screen }, '', '#' + screen);
    updateBackButtonVisibility();
}

function updateBackButtonVisibility() {
    if (currentScreen === 'upload') {
        backBtn.classList.add('hidden');
        backBtn.classList.remove('flex');
    } else {
        backBtn.classList.remove('hidden');
        backBtn.classList.add('flex');
    }
}

// Back button click — screen ke hisaab se peeche jao
backBtn.addEventListener('click', () => {
    goBack();
});

function goBack() {
    if (currentScreen === 'result' || currentScreen === 'loading') {
        resetToActionScreen();
    } else if (currentScreen === 'actions') {
        resetToUploadScreen();
    }
}

// Browser/hardware back button handle karna
window.addEventListener('popstate', (e) => {
    if (currentScreen === 'result' || currentScreen === 'loading') {
        resetToActionScreen();
        history.pushState({ screen: 'actions' }, '', '#actions');
        currentScreen = 'actions';
        updateBackButtonVisibility();
    } else if (currentScreen === 'actions') {
        resetToUploadScreen();
    } else {
        // Upload screen pe hai — yeh double-click exit logic handle karega
        handleExitAttempt(e);
    }
});

// ---- DOUBLE-CLICK / DOUBLE-BACK EXIT LOGIC ----
let exitWarningShown = false;
let exitTimer = null;

function handleExitAttempt(e) {
    if (!exitWarningShown) {
        // Pehli baar back dabaya — warning dikhao, app ke andar hi rakho
        history.pushState({ screen: 'upload' }, '', '#upload');
        exitWarningShown = true;
        showExitToast();

        exitTimer = setTimeout(() => {
            exitWarningShown = false; // 3 second baad reset, agar user ne exit nahi kiya
        }, 3000);
    } else {
        // Dusri baar — ab actually exit hone do (history pop hone do)
        clearTimeout(exitTimer);
        // Kuch nahi karna — default browser behavior chalne do (app/tab close)
    }
}

function showExitToast() {
    exitToast.classList.add('show');
    setTimeout(() => {
        exitToast.classList.remove('show');
    }, 2000);
}

// Initial history state set karo
history.replaceState({ screen: 'upload' }, '', '#upload');

// ============================================
// IMAGE UPLOAD + COMPRESSION
// ============================================

dropZone.addEventListener('click', () => imageInput.click());

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-active');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('drag-active');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-active');
    const file = e.dataTransfer.files[0];
    if (file) handleImageFile(file);
});

imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) handleImageFile(file);
});

function handleImageFile(file) {
    // Basic validation
    if (!file.type.startsWith('image/')) {
        alert('सिर्फ इमेज फाइलें चलेंगी (JPG, PNG, WEBP)।');
        return;
    }

    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > MAX_FILE_SIZE_MB) {
        alert(`फोटो ${MAX_FILE_SIZE_MB}MB से बड़ी है। छोटी फोटो ट्राई करो।`);
        return;
    }

    compressImage(file);
}

// Canvas-based client-side compression — upload se pehle resize + JPEG convert
function compressImage(file) {
    const reader = new FileReader();

    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let { width, height } = img;

            // Resize agar zaroori ho (max width cap)
            if (width > COMPRESS_MAX_WIDTH) {
                height = Math.round((height * COMPRESS_MAX_WIDTH) / width);
                width = COMPRESS_MAX_WIDTH;
            }

            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob((blob) => {
                if (!blob) {
                    alert('फोटो प्रोसेस करने में दिक्कत आई। दूसरी फोटो ट्राई करो।');
                    return;
                }
                compressedImageBlob = blob;
                originalPreviewDataUrl = canvas.toDataURL('image/jpeg', COMPRESS_QUALITY);
                showPreviewAndButtons();
            }, 'image/jpeg', COMPRESS_QUALITY);
        };

        img.onerror = () => {
            alert('फोटो लोड नहीं हो पाई। दूसरी फाइल ट्राई करो।');
        };

        img.src = e.target.result;
    };

    reader.onerror = () => {
        alert('फाइल पढ़ने में दिक्कत आई।');
    };

    reader.readAsDataURL(file);
}

function showPreviewAndButtons() {
    document.getElementById('dropZoneContent').classList.add('hidden');
    document.getElementById('trustPills').classList.add('hidden');
    imagePreview.src = originalPreviewDataUrl;
    imagePreview.classList.remove('hidden');
    actionButtons.classList.remove('hidden');
    actionButtons.classList.add('grid');
    setScreen('actions');
}

// ============================================
// ACTION BUTTON CLICKS → TRIGGER SCAN
// ============================================

document.querySelectorAll('#actionButtons button').forEach((btn) => {
    btn.addEventListener('click', () => {
        const action = btn.getAttribute('data-action');
        currentAction = action;
        startScanProcess();
    });
});

// ============================================
// SCAN PROCESS — API Call to PHP Backend
// ============================================

async function startScanProcess() {
    if (!compressedImageBlob) return;

    actionButtons.classList.add('hidden');
    actionButtons.classList.remove('grid');
    resultContainer.classList.add('hidden');
    loadingTerminal.classList.remove('hidden');
    loadingTerminal.classList.add('flex');
    scanLine.style.display = 'block';
    setScreen('loading');

    terminalText.textContent = loadingMessages[0];
    let i = 1;
    const typingInterval = setInterval(() => {
        terminalText.textContent = loadingMessages[i % loadingMessages.length];
        i++;
    }, 1300);

    const formData = new FormData();
    formData.append('image', compressedImageBlob, 'image.jpg');
    formData.append('prompt', prompts[currentAction]);

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            body: formData
        });

        clearInterval(typingInterval);
        scanLine.style.display = 'none';

        const rawText = await response.text();
        let data;

        try {
            data = JSON.parse(rawText);
        } catch (jsonError) {
            throw new Error(`सर्वर से सही जवाब नहीं मिला (कोड: ${response.status})। थोड़ी देर बाद कोशिश करो।`);
        }

        if (!response.ok) {
            throw new Error(data?.error?.message || "सर्वर में दिक्कत आई है। दोबारा कोशिश करो।");
        }

        let finalOutput = "";
        if (data.candidates && data.candidates.length > 0 && data.candidates[0]?.content?.parts?.[0]?.text) {
            finalOutput = data.candidates[0].content.parts[0].text;
        } else if (data.error) {
            finalOutput = `एनालिसिस नहीं हो पाया: ${data.error.message || "अनजान एरर"}`;
        } else {
            finalOutput = "फोटो का एनालिसिस पूरा नहीं हो पाया। दूसरी फोटो ट्राई करो या थोड़ी देर बाद आओ।";
        }

        displayResult(finalOutput);

    } catch (error) {
        clearInterval(typingInterval);
        scanLine.style.display = 'none';
        displayResult(`⚠️ ${error.message}\n\nकृपया दोबारा कोशिश करो या कुछ देर बाद आओ।`);
    }
}

// ============================================
// DISPLAY RESULT
// ============================================

function displayResult(text) {
    loadingTerminal.classList.add('hidden');
    loadingTerminal.classList.remove('flex');
    resultContainer.classList.remove('hidden');
    resultContainer.classList.add('flex');

    resultThumb.src = originalPreviewDataUrl;

    const statusLabels = {
        fake: "असली या फेक रिपोर्ट",
        brand: "ब्रांड एंड कीमत रिपोर्ट",
        utility: "काम की जानकारी",
        device: "डिवाइस एनालिसिस",
        deepscan: "पूरा कच्चा चिट्ठा"
    };
    statusHeader.textContent = statusLabels[currentAction] || "रिपोर्ट तैयार";

    // Typewriter effect se text dikhana
    coreIntelText.textContent = "";
    let idx = 0;
    const typeSpeed = 15;

    function typeWriter() {
        if (idx < text.length) {
            coreIntelText.textContent += text.charAt(idx);
            idx++;
            setTimeout(typeWriter, typeSpeed);
        }
    }
    typeWriter();

    setScreen('result');
}

// ============================================
// RESET / NAVIGATION HELPERS
// ============================================

function resetToActionScreen() {
    resultContainer.classList.add('hidden');
    resultContainer.classList.remove('flex');
    loadingTerminal.classList.add('hidden');
    loadingTerminal.classList.remove('flex');
    actionButtons.classList.remove('hidden');
    actionButtons.classList.add('grid');
    currentScreen = 'actions';
    updateBackButtonVisibility();
}

function resetToUploadScreen() {
    resultContainer.classList.add('hidden');
    actionButtons.classList.add('hidden');
    actionButtons.classList.remove('grid');
    imagePreview.classList.add('hidden');
    imagePreview.src = "";
    document.getElementById('dropZoneContent').classList.remove('hidden');
    document.getElementById('trustPills').classList.remove('hidden');
    compressedImageBlob = null;
    originalPreviewDataUrl = null;
    currentAction = null;
    imageInput.value = "";
    currentScreen = 'upload';
    updateBackButtonVisibility();
}

newScanBtn.addEventListener('click', () => {
    resetToUploadScreen();
    history.pushState({ screen: 'upload' }, '', '#upload');
});

// ============================================
// WHATSAPP SHARE
// ============================================

generateOGBtn.addEventListener('click', () => {
    const reportText = coreIntelText.textContent;
    const shareText = `*i-CID फॉरेंसिक रिपोर्ट*\n\n${reportText}\n\n_अपनी फोटो भी चेक करो:_ https://i-cid.vhoriginal.com`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(whatsappUrl, '_blank');
});
