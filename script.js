const GEMINI_API_KEY = "AIzaSyBgWYFyf8QeatlV5vE--35TshDCJrnNecw";

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('getOutfitBtn').addEventListener('click', getOutfit);
    document.getElementById('clothingInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') getOutfit();
    });
});

async function getOutfit() {
    const input = document.getElementById('clothingInput').value.trim();
    if (!input) return alert('Please describe your clothing item!');

    const loading = document.getElementById('loading');
    const result = document.getElementById('result');
    const btn = document.getElementById('getOutfitBtn');

    loading.classList.add('show');
    result.classList.remove('show');
    btn.disabled = true;
    btn.textContent = 'Generating...';

    try {
        const item = input.toLowerCase();
        let prompt;

        // Simplified prompts for perfect JSON
        if (item.includes('pant') || item.includes('trouser') || item.includes('jean') || item.includes('chino')) {
            prompt = `Based on pants "${input}" return ONLY valid JSON:
{"shirt":["White t-shirt", "Light blue button-up"], "shoes":["White sneakers", "Brown loafers"], "accessories":["Watch"], "style_tips":"Pair with casual tops for everyday wear and keep accessories minimal."}`;
        } else if (item.includes('shoe') || item.includes('sneaker') || item.includes('boot') || item.includes('loafer')) {
            prompt = `Based on shoes "${input}" return ONLY valid JSON:
{"shirt":["White button-up", "Navy henley"], "pants":["Dark slim jeans", "Black chinos"], "accessories":["Leather belt"], "style_tips":"Smart casual look works perfectly with these shoes."}`;
        } else {
            prompt = `Based on shirt "${input}" return ONLY valid JSON:
{"pants":["Dark wash jeans", "Khaki chinos"], "shoes":["White sneakers", "Chelsea boots"], "accessories":["Simple necklace"], "style_tips":"Balance casual shirt with fitted bottoms and clean shoes."}`;
        }

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }]
                })
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || `HTTP ${response.status}`);
        }

        const data = await response.json();

        if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
            throw new Error('No response content from Gemini');
        }

        let rawText = data.candidates[0].content.parts[0].text;
        console.log('Raw:', rawText);

        // Bulletproof JSON cleaning
        rawText = rawText
            .trim()
            .replace(/^```json\s*/i, '')
            .replace(/^```\s*/i, '')
            .replace(/```json?$/i, '')
            .replace(/```$/i, '')
            .replace(/^\s*[\r\n]/gm, '')
            .replace(/[\r\n]\s*$/gm, '')
            .trim();

        console.log('Cleaned:', rawText);

        const outfit = JSON.parse(rawText);
        displayOutfit(outfit, input);

    } catch (error) {
        console.error('Error:', error);
        document.getElementById('result').innerHTML = `
            <div class="section error">
                <h3>❌ Error</h3>
                <p>${error.message}</p>
                <p><small>Tip: Check your quota at <a href="https://aistudio.google.com/app/apikey" target="_blank">AI Studio</a></small></p>
            </div>
        `;
        document.getElementById('result').classList.add('show');
    } finally {
        loading.classList.remove('show');
        btn.disabled = false;
        btn.textContent = '✨ Get Perfect Outfit';
    }
}

function displayOutfit(outfit, input) {
    const result = document.getElementById('result');
    let html = `<h2 class="result-title">✨ Perfect matches for "${input}"</h2>`;

    if (outfit.shirt && Array.isArray(outfit.shirt)) {
        html += `<div class="section"><h3>👔 Shirts</h3><div class="items">${outfit.shirt.map(s => `<div class="item">${s}</div>`).join('')}</div></div>`;
    }
    if (outfit.pants && Array.isArray(outfit.pants)) {
        html += `<div class="section"><h3>👖 Pants</h3><div class="items">${outfit.pants.map(p => `<div class="item">${p}</div>`).join('')}</div></div>`;
    }
    if (outfit.shoes && Array.isArray(outfit.shoes)) {
        html += `<div class="section"><h3>👟 Shoes</h3><div class="items">${outfit.shoes.map(s => `<div class="item">${s}</div>`).join('')}</div></div>`;
    }
    if (outfit.accessories && Array.isArray(outfit.accessories)) {
        html += `<div class="section"><h3>💍 Accessories</h3><div class="items">${outfit.accessories.map(a => `<div class="item">${a}</div>`).join('')}</div></div>`;
    }
    if (outfit.style_tips) {
        html += `<div class="section"><h3>💡 Style Tips</h3><div class="tips">${outfit.style_tips}</div></div>`;
    }

    result.innerHTML = html;
    result.classList.add('show');
}
