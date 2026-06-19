// ============================================
// i-CID — app.js
// Photo Forensic System — Complete Frontend Logic
// ============================================

// ---- CONFIG ----
const API_URL = "https://vhoriginal.com/icid/upload.php"; // Hostinger PHP backend path
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

// ---- BUTTON META — "aur jaano" section ke liye (label + chhota icon) ----
const buttonMeta = {
    fake:     { label: "असली या फेक?",    color: "#2ecc8f", icon: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><path d="M8 11l2 2 4-4"/>' },
    brand:    { label: "ब्रांड एंड कीमत",  color: "#2e9bf0", icon: '<path d="M20.38 3.46L16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/>' },
    cheap:    { label: "सस्ता या महँगा?",  color: "#e8c44f", icon: '<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>' },
    quality:  { label: "कपड़े की क्वालिटी", color: "#c44ff0", icon: '<path d="M20.38 3.46L16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/>' },
    utility:  { label: "काम की बात",       color: "#f0a93e", icon: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>' },
    device:   { label: "कैमरा या मोबाइल?", color: "#4fd8e8", icon: '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>' },
    daynight: { label: "दिन या रात?",      color: "#f0843e", icon: '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>' },
    ghost:    { label: "भूत या भ्रम? 👻",  color: "#9aa6f0", icon: '<path d="M9 10h.01M15 10h.01M12 2a8 8 0 0 0-8 8v12l3-3 3 3 2-3 2 3 3-3V10a8 8 0 0 0-8-8z"/>' },
    age:      { label: "इमेज की उम्र",     color: "#a8845c", icon: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>' },
    deepscan: { label: "पूरा कच्चा चिट्ठा", color: "#4fd8e8", icon: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="15" y2="17"/>' }
};

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
- Agar koi purani imaarat/monument/historical jagah dikhe to uske baare mein bata: kaunse daur ki lag rahi hai, architecture style kya hai (Mughal/Rajput/colonial/modern), andaazan kitni purani ho sakti hai. PAR koi specific raja ka naam ya exact saal confident hoke mat bol jab tak 100% sure na ho — "lagta hai", "ho sakta hai" use kar.
- Kya image edited/filtered/AI-generated lagti hai
- Agar koi text/document/number plate dikh raha hai, uska content
- Overall image quality

IMPORTANT — LOCATION RULE: Photo ki EXACT location (shehar, gaon, area, address) KABHI mat batao, chahe clues kitne bhi clear hon. Iske bajaye ant mein ek witty note daalo jaise: "Aur haan — privacy ke kaaran exact location nahi bataunga bhai, warna main chane bechने chala jaunga! 😏" (yeh line ya iski tarah koi mazedaar line). Sirf architecture/region ka general type bata sakte ho (jaise "North Indian style"), par specific jagah nahi.

TONE: 70% factual forensic report + 30% witty narration. Sab kuch ek continuous paragraph mein, Hinglish mein PAR Devanagari script (Hindi alphabet) mein, jaise ek smart detective apni report sunaa raha ho. Mazaak photo/scene/edit pe, kisi insaan ka apmaan kabhi nahi. Agar minor dikhe toh mazaak hata do. 6-8 lines.`,

    cheap: `Tu ek shopping/value expert hai jo cheezon ki keemat ka andaaza lagata hai — factual par chatpata. Is image mein dikhne wali cheez (kapde, accessory, gadget, furniture, jo bhi) ko dekh kar bata:
1. Yeh cheez sasti category ki lagti hai ya mehngi/premium? Kyun (material, finish, brand cues se)?
2. Andaazan keemat range Indian Rupees mein (jaise "₹500-1000" ya "₹5000+")?
3. Value for money lagti hai ya nahi?
Agar image blurry hai ya cheez clear nahi, bol do "clear photo bhejo behtar andaaze ke liye".
TONE: 70% factual + 30% witty. Mazaak cheez/product pe, kisi insaan ki aukat pe NAHI. Hinglish PAR Devanagari script mein, 3-4 lines.`,

    quality: `Tu ek textile/fabric quality expert hai. Is image mein dikhne wale kapde ko dekh kar factually bata:
1. Fabric kaunsa lagta hai (cotton, polyester, silk, denim, mix)?
2. Quality kaisी lagti hai (stitching, texture, finish se) — accha, average, ya cheap?
3. Pehnne ke liye kis mausam/occasion ke liye theek rahega?
Agar clear na dikhe to bol do clear photo bhejo.
TONE: 70% factual + 30% witty. Mazaak fabric/quality pe, insaan pe nahi. Hinglish PAR Devanagari script mein, 3-4 lines.`,

    daynight: `Tu ek photo analyst hai jo light/timing ka andaaza lagata hai. Is image ko dekh kar bata:
1. Yeh din mein li gayi lagti hai ya raat mein? Kis cheez se pata chala (sunlight, shadow direction, artificial light, sky)?
2. Andaazan time of day (subah, dopahar, shaam, raat)?
3. Indoor hai ya outdoor?
Agar pata na chale to honestly bol do.
TONE: 70% factual + 30% witty. Hinglish PAR Devanagari script mein, 3-4 lines.`,

    ghost: `Tu ek science-first photo analyst hai jo "bhootiya" lagne wali cheezon ko SCIENCE se samjhata hai. Is image ko dekh:
1. Kya isme koi aisी cheez hai jo log "bhoot/aatma" samajh sakte hain (dhundhli aakriti, reflection, shadow, chehra-jaisा pattern)?
2. Har aisी cheez ko SCIENCE se explain kar — yeh actually kya hai: camera reflection, lens flare, motion blur, double exposure, pareidolia (dimaag ka random patterns mein chehre dhoondhna), shadow, ya dust particle.
3. CLEAR conclusion: koi asli bhoot/aatma NAHI hai, yeh [scientific reason] hai.

BAHUT ZAROORI: Kabhi bhi yeh mat bolo ki photo mein sach mein bhoot/aatma/paranormal cheez hai. Hamesha science-based explanation do. Agar kuch bhi aisा nahi hai, to bol do "is photo mein koi bhootiya cheez nahi, ekdum normal hai — darne ki zaroorat nahi! 👻"
TONE: 70% science + 30% mazedaar. Halka spooky-fun andaaz par end mein hamesha science aur reassurance. Hinglish PAR Devanagari script mein, 4-5 lines.`,

    age: `Tu ek photo-dating expert hai jo andaaza lagata hai ki photo/cheez kitni purani hai. Is image ko dekh kar bata:
1. Yeh photo kab ki lag rahi hai (naye zamane ki, ya purani)? Kis cheez se pata chala (photo quality, colors, fashion, technology, vehicles, architecture)?
2. Agar koi purani imaarat/cheez hai to woh kitni purani ho sakti hai (andaazan daur/era)?
3. Photo khud kitni purani lagti hai (recent click ya scan ki hui purani photo)?
Confident na ho to "lagta hai", "ho sakta hai" use kar. Specific saal sirf tab bol jab pakka ho.
TONE: 70% factual + 30% witty. Hinglish PAR Devanagari script mein, 3-4 lines.`
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
    resultContainer.classList.remove('flex');
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
        cheap: "सस्ता या महँगा रिपोर्ट",
        quality: "कपड़े की क्वालिटी रिपोर्ट",
        utility: "काम की जानकारी",
        device: "डिवाइस एनालिसिस",
        daynight: "दिन या रात एनालिसिस",
        ghost: "भूत या भ्रम रिपोर्ट 👻",
        age: "इमेज की उम्र रिपोर्ट",
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

    renderMoreButtons();
    setScreen('result');

    // AdSense ad load karo (result visible hone par)
    try {
        window.adsbygoogle = window.adsbygoogle || [];
        window.adsbygoogle.push({});
    } catch (e) {
        // Ad block ya AdSense load nahi hua - chup-chaap ignore
    }
}

// "Aur jaano" buttons banao — current action chhod ke baaki sab
function renderMoreButtons() {
    const moreButtons = document.getElementById('moreButtons');
    moreButtons.innerHTML = "";

    Object.keys(buttonMeta).forEach((action) => {
        if (action === currentAction) return; // jo abhi dekha woh skip

        const meta = buttonMeta[action];
        const btn = document.createElement('button');
        btn.className = "panel-interactive more-btn";
        btn.setAttribute('data-action', action);
        btn.innerHTML = `
            <span class="more-btn-icon" style="color:${meta.color}">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${meta.icon}</svg>
            </span>
            <span class="more-btn-label">${meta.label}</span>
        `;
        btn.addEventListener('click', () => {
            currentAction = action;
            startScanProcess(); // same image, naya analysis
        });
        moreButtons.appendChild(btn);
    });
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
