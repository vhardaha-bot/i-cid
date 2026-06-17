// app.js

// 1. API URL (Tera Hostinger Backend)
const API_URL = "https://vhoriginal.com/icid/upload.php";

// 2. DOM Elements
const dropZone = document.getElementById('dropZone');
const imageInput = document.getElementById('imageInput');
const imagePreview = document.getElementById('imagePreview');
const scanLine = document.getElementById('scanLine');
const actionButtons = document.getElementById('actionButtons');
const loadingTerminal = document.getElementById('loadingTerminal');
const terminalText = document.getElementById('terminalText');
const resultContainer = document.getElementById('resultContainer');
const resultThumb = document.getElementById('resultThumb');
const coreIntelText = document.getElementById('coreIntelText');
const quickTags = document.getElementById('quickTags');
const intelCursor = document.getElementById('intelCursor');
const generateOGBtn = document.getElementById('generateOGBtn');

let compressedImageBlob = null;
let currentAction = "";

// 3. FBI Terminal Loading Messages
const loadingMessages = [
    "[SYSTEM] Establishing secure connection to i-CID servers...",
    "[SCAN] Extracting EXIF metadata & deep pixels...",
    "[AI_VISION] Running deep neural network...",
    "[DB_CHECK] Cross-referencing global database...",
    "[DECRYPTING] Generating final classified report..."
];

// 4. Prompts (Gen-Z Hindi Tone)
const prompts = {
    drip: `ROLE: Tu ek desi fashion expert aur best friend hai jo brutally honest hai. RULES: Is photo mein kapde, joote, aur accessories scan kar. Brand guess kar aur bata original hai ya Sarojini/Palika ki copy. Total outfit ki approximate cost bata. Desi Gen-Z Hinglish (Jaise WhatsApp pe baat hoti hai) use kar. 3-4 line me wrap up kar.`,
    vibe: `ROLE: Tu ek vibe/personality reader hai. RULES: Photo ki aesthetic, background, aur pose dekh kar bande/bandi ki personality guess kar. Isko pahad pasand hai ya cafe? Music taste kaisa hoga? Android ya iPhone energy? Sab kuch desi Gen-Z humor ke sath bata.`,
    roast: `ROLE: Tu ek savage roaster hai. RULES: Is photo ka ek bhayankar aur funny roast kar. Ek WhatsApp meme caption de. Dhyaan rahe, physical body, rang ya kisi sensitive cheez pe comment nahi karna, sirf outfit, pose aur background pe mazaak udaana hai.`,
    fake: `ROLE: Tu ek Cyber Forensics Expert hai. RULES: Is photo ko dhyan se dekh aur bata kya ye AI generated hai? Kya isme Snapchat filter laga hai ya background chipkaya hua hai? Agar koi bank/chat screenshot hai, toh bata scam hai ya asli. Ek line ka verdict zaroor dena.`,
    location: `ROLE: Tu ek Geo-Guesser expert hai. RULES: Photo ke background me ped, building, board, ya sadak dekh kar guess kar ki ye India ke kis state/city ki photo ho sakti hai. Apne guess ka reason bhi bata.`,
    utility: `ROLE: Tu ek problem solver hai. RULES: Agar photo mein kisi gaadi ki number plate hai to sirf Gaadi ka Number aur Model bata. Agar koi math ka sawal hai to solve kar. Agar mobile ka error screenshot hai to solution de. Point to point answer de.`,
    deepscan: `ROLE: Tu i-CID ka Chief Investigator hai. RULES: Is photo ka complete X-Ray kar. Ek lamba paragraph likh jisme is photo ka A to Z saara sach likha ho - environment, mood, objects, log. Bilkul jaasoos wali tone use kar.`
};

// --- EVENTS: DRAG & DROP & CLICK ---
dropZone.addEventListener('click', () => imageInput.click());
dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('border-white'); });
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('border-white'));
dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('border-white');
    if(e.dataTransfer.files.length) handleImageUpload(e.dataTransfer.files[0]);
});
imageInput.addEventListener('change', (e) => {
    if(e.target.files.length) handleImageUpload(e.target.files[0]);
});

// --- CORE LOGIC: IMAGE COMPRESSION ---
function handleImageUpload(file) {
    if (!file.type.startsWith('image/')) {
        alert('अबे ओए! सिर्फ फोटो (JPG/PNG) डालनी है, PDF/Video नहीं!');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(event) {
        const img = new Image();
        img.onload = function() {
            // Compress Image via Canvas (Max width 1024px)
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 1024;
            let scaleSize = MAX_WIDTH / img.width;
            if(scaleSize > 1) scaleSize = 1; // Don't enlarge small images
            
            canvas.width = img.width * scaleSize;
            canvas.height = img.height * scaleSize;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            
            // Output as JPEG with 70% quality
            canvas.toBlob((blob) => {
                compressedImageBlob = blob;
                // Show in UI
                imagePreview.src = event.target.result;
                resultThumb.src = event.target.result;
                imagePreview.classList.remove('hidden');
                actionButtons.classList.remove('hidden');
                resultContainer.classList.add('hidden');
            }, 'image/jpeg', 0.7);
        }
        img.src = event.target.result;
    }
    reader.readAsDataURL(file);
}

// --- BUTTON CLICKS ---
document.querySelectorAll('#actionButtons button').forEach(btn => {
    btn.addEventListener('click', () => {
        currentAction = btn.getAttribute('data-action');
        startScanProcess();
    });
});

// --- UI: SCANNING PROCESS ---
async function startScanProcess() {
    if(!compressedImageBlob) return;
    
    // UI Changes
    actionButtons.classList.add('hidden');
    resultContainer.classList.add('hidden');
    loadingTerminal.classList.remove('hidden');
    loadingTerminal.classList.add('flex');
    scanLine.style.display = 'block';
    
    // Play fake terminal animation
    terminalText.innerHTML = "";
    let i = 0;
    const typingInterval = setInterval(() => {
        if(i < loadingMessages.length) {
            terminalText.innerHTML += `<div>${loadingMessages[i]}</div>`;
            i++;
        }
    }, 1200);

    // Prepare Data for PHP Backend
    const formData = new FormData();
    formData.append('image', compressedImageBlob, 'image.jpg');
    formData.append('prompt', prompts[currentAction]);

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            body: formData
        });
        
        clearInterval(typingInterval);
        
        if(!response.ok) {
            if(response.status === 429) throw new Error("सांस ले ले भाई! Limit Reached. Thodi der baad aana.");
            throw new Error("सर्वर पर बहुत लोड है या API Timeout हो गई।");
        }

        const data = await response.json();
        
        // Google Gemini gives result inside candidates[0].content.parts[0].text
        let finalOutput = "";
        if(data.candidates && data.candidates.length > 0) {
            finalOutput = data.candidates[0].content.parts[0].text;
        } else if (data.error) {
            finalOutput = `[ERROR] ${data.error.message}`;
        } else {
            finalOutput = "[ERROR] AI ka dimag hang ho gaya hai.";
        }

        displayResult(finalOutput);

    } catch (error) {
        clearInterval(typingInterval);
        displayResult(`🚨 [CRITICAL ERROR] \n${error.message}`);
    }
}

// --- UI: SHOW RESULT ---
function displayResult(text) {
    loadingTerminal.classList.remove('flex');
    loadingTerminal.classList.add('hidden');
    scanLine.style.display = 'none';
    resultContainer.classList.remove('hidden');
    
    // Clear old result
    coreIntelText.innerHTML = "";
    quickTags.innerHTML = "";
    intelCursor.classList.remove('hidden');

    // Special Lab Button for "Utility / Vehicle" Action
    if(currentAction === 'utility') {
        quickTags.innerHTML = `<a href="http://mis.mptransport.org/MPLogin/eSewa/VehicleSearch.aspx" target="_blank" class="bg-red-600 hover:bg-red-700 text-white p-2 rounded text-xs font-bold transition animate-pulse border border-red-400">🧪 Lab में जाके RTO से मालिक का नाम निकालो!</a>`;
    }

    // Typewriter effect for output
    let i = 0;
    const speed = 15; // Typing speed
    function typeWriter() {
        if (i < text.length) {
            coreIntelText.innerHTML += text.charAt(i);
            i++;
            setTimeout(typeWriter, speed);
        } else {
            intelCursor.classList.add('hidden'); // Hide cursor when done
        }
    }
    typeWriter();
}

// --- WHATSAPP SHARE FEATURE (Web Share API) ---
generateOGBtn.addEventListener('click', async () => {
    const shareText = `मैंने i-CID पर इस फोटो का कच्चा चिट्ठा निकाला है! 😂\n\nResult: \n${coreIntelText.innerText.substring(0, 100)}...\n\nअपना फोटो स्कैन करो: https://i-cid.vhoriginal.com`;
    
    if (navigator.share) {
        try {
            await navigator.share({
                title: 'i-CID Scan Result',
                text: shareText,
                url: 'https://i-cid.vhoriginal.com'
            });
        } catch (err) {
            console.log('Share cancelled');
        }
    } else {
        // Fallback for PC
        navigator.clipboard.writeText(shareText);
        alert("Result Copied! Ab ise WhatsApp par paste karke dosto ko pel de! 😂");
    }
});
