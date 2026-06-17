// --- UI: SCANNING PROCESS (SONNET PRO LEVEL) ---
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
        // API Call
        const response = await fetch(API_URL, {
            method: 'POST',
            body: formData
        });
        
        clearInterval(typingInterval);

        // 🚨 PRO DEBUGGING: सीधे JSON पार्स मत कर, पहले रॉ-टेक्स्ट (Raw Text) निकाल!
        const rawText = await response.text();
        let data;

        // चेक कर कि सर्वर ने सच में JSON भेजा है या कोई HTML एरर चिपका दिया है
        try {
            data = JSON.parse(rawText);
        } catch (jsonError) {
            // अगर JSON नहीं है, तो पक्का Hostinger ने कोई एरर पेज भेजा है!
            throw new Error(`JSON Parse Fail (Code: ${response.status}). \nHostinger ne ye bheja: \n${rawText.substring(0, 150)}...`);
        }

        // अगर HTTP स्टेटस 200 नहीं है (जैसे 429, 500, 403)
        if(!response.ok) {
            throw new Error(`HTTP ${response.status}: ${data?.error?.message || data?.error || "Unknown Server Error"}`);
        }
        
        // Gemini API का रिजल्ट निकालना
        let finalOutput = "";
        if(data.candidates && data.candidates.length > 0) {
            finalOutput = data.candidates[0].content.parts[0].text;
        } else if (data.error) {
            finalOutput = `[GEMINI API ERROR] ${data.error.message}`;
        } else {
            finalOutput = `[UNKNOWN STRUCTURE] Data: ${JSON.stringify(data).substring(0, 100)}...`;
        }

        displayResult(finalOutput);

    } catch (error) {
        // 🚨 यह है हमारा ब्रह्मास्त्र! कोई भी एरर यहाँ से बच कर नहीं जाएगा।
        clearInterval(typingInterval);
        displayResult(`🚨 [RAW DEBUG ERROR] \n\n${error.message}`);
    }
}
