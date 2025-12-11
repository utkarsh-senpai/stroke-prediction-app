// Globals
let currentStep = 1;
const totalSteps = 10;  // Updated to 9 (removed one if needed; adjust if 10)
const backendUrl = 'http://localhost:5000/predict';
let userData = {};

// Init
document.addEventListener('DOMContentLoaded', () => {
    showStep(1);
});

// Show step
function showStep(stepNum) {
    document.querySelectorAll('.step').forEach(step => step.classList.add('d-none'));
    document.getElementById(`step${stepNum}`).classList.remove('d-none');
    currentStep = stepNum;
    updateProgress();
}

// Update progress
function updateProgress() {
    const progress = (currentStep / totalSteps) * 100;
    document.getElementById('progressBar').style.width = progress + '%';
    document.getElementById('currentStep').textContent = currentStep;
}

// Next with validation
function nextStep(stepNum) {
    if (validateStep(stepNum)) {
        saveStepData(stepNum);
        if (stepNum < totalSteps) {
            showStep(stepNum + 1);
        }
    }
}

// Prev
function prevStep(stepNum) {
    showStep(stepNum - 1);
    loadStepData(stepNum - 1);
}

// Validate (enhanced: Bootstrap classes, no alerts)
function validateStep(stepNum) {
    let isValid = true;
    let input = null;

    switch (stepNum) {
        case 1: input = document.querySelector('input[name="gender"]:checked'); break;
        case 2:
            input = document.getElementById('age');
            if (input.value < 0 || input.value > 120) isValid = false;
            break;
        case 3: input = document.querySelector('input[name="hypertension"]:checked'); break;
        case 4: input = document.querySelector('input[name="heart_disease"]:checked'); break;
        case 5: input = document.querySelector('input[name="ever_married"]:checked'); break;
        case 6: input = document.getElementById('work_type'); break;
        case 7: input = document.querySelector('input[name="Residence_type"]:checked'); break;
        case 8:
            input = document.getElementById('avg_glucose_level');
            if (input.value < 50 || input.value > 300) isValid = false;
            break;
        case 9:
            input = document.getElementById('bmi');
            if (input.value < 10 || input.value > 100) isValid = false;
            break;
        case 10: input = document.getElementById('smoking_status'); break;
    }

    // Apply Bootstrap invalid
    if (input) {
        input.classList.toggle('is-invalid', !isValid);
    } else {
        const stepEl = document.getElementById(`step${stepNum}`);
        const radios = stepEl.querySelectorAll('input[type="radio"]:checked');
        const selects = stepEl.querySelectorAll('select');
        if (radios.length === 0 && selects[0].value === '') isValid = false;
        selects[0]?.classList.toggle('is-invalid', !isValid);
    }

    if (!isValid) {
        // Subtle feedback via class; no alert for UX
        document.querySelector('.invalid-feedback')?.classList.add('d-block');
    } else {
        document.querySelectorAll('.invalid-feedback').forEach(fb => fb.classList.remove('d-block'));
    }

    return isValid;
}

// Save data
function saveStepData(stepNum) {
    switch (stepNum) {
        case 1: userData.gender = document.querySelector('input[name="gender"]:checked').value; break;
        case 2: userData.age = parseFloat(document.getElementById('age').value); break;
        case 3:
            const hyp = document.querySelector('input[name="hypertension"]:checked');
            userData.hypertension = hyp ? parseInt(hyp.value) : null;
            break;
        case 4:
            const heart = document.querySelector('input[name="heart_disease"]:checked');
            userData.heart_disease = heart ? parseInt(heart.value) : null;
            break;
        case 5: userData.ever_married = document.querySelector('input[name="ever_married"]:checked').value; break;
        case 6: userData.work_type = document.getElementById('work_type').value; break;
        case 7: userData.Residence_type = document.querySelector('input[name="Residence_type"]:checked').value; break;
        case 8: userData.avg_glucose_level = parseFloat(document.getElementById('avg_glucose_level').value); break;
        case 9: userData.bmi = parseFloat(document.getElementById('bmi').value); break;
        case 10: userData.smoking_status = document.getElementById('smoking_status').value; break;
    }
}

// Load data (for back)
function loadStepData(stepNum) {
    // Optional: restore values when going back between steps
}

// ---------- NEW: helper to escape HTML ----------
function escapeHtml(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// ---------- NEW: format OpenAI text into bullets ----------
function formatRecommendationText(text) {
    if (!text) return '';

    const lines = text
        .split('\n')
        .map(l => l.trim())
        .filter(l => l.length > 0);

    let html = '';
    let inList = false;

    lines.forEach(line => {
        // Bullet line
        if (line.startsWith('- ')) {
            if (!inList) {
                html += '<ul class="mb-2 ps-4">';
                inList = true;
            }
            html += `<li>${escapeHtml(line.slice(2))}</li>`;
        } else {
            // Close previous list if needed
            if (inList) {
                html += '</ul>';
                inList = false;
            }

            // Treat numbered section titles as headings
            if (/^\d+\)/.test(line) || line.toUpperCase() === line) {
                html += `<h6 class="mt-3 mb-2">${escapeHtml(line.replace(/^\d+\)\s*/, ''))}</h6>`;
            } else {
                html += `<p class="mb-1">${escapeHtml(line)}</p>`;
            }
        }
    });

    if (inList) {
        html += '</ul>';
    }

    return html;
}

// Submit
function submitForm() {
    if (validateStep(10)) {
        saveStepData(10);
        document.getElementById('stepper').classList.add('d-none');
        document.getElementById('loadingSpinner').classList.remove('d-none');
        document.getElementById('submitBtn').innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Assessing...';

        fetch(backendUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        })
            .then(res => {
                if (!res.ok) throw new Error('API Error');
                return res.json();
            })
            .then(data => {
                // ----- UPDATED: pass recommendation as well -----
                showResult(data.stroke_prob, data.recommendation);
            })
            .catch(err => {
                alert('Connection issue: ' + err.message + '. Please try again.');
                resetToStep(10);  // Helper to reset to last step
            })
            .finally(() => {
                document.getElementById('loadingSpinner').classList.add('d-none');
            });
    }
}

// Show result (enhanced visuals + recommendation)
function showResult(prob, recommendation) {
    document.getElementById('resultSection').classList.remove('d-none');
    const probPercent = (prob * 100).toFixed(1);
    let riskLevel, message, iconClass, badgeClass;

    if (prob > 0.5) {
        riskLevel = 'High Risk';
        message = 'Prioritize immediate consultation with a healthcare provider for preventive strategies.';
        iconClass = 'text-danger';
        badgeClass = 'high-risk';
    } else if (prob > 0.2) {
        riskLevel = 'Moderate Risk';
        message = 'Lifestyle adjustments could lower your risk—discuss with your doctor or physiotherapist.';
        iconClass = 'text-warning';
        badgeClass = 'moderate-risk';
    } else {
        riskLevel = 'Low Risk';
        message = 'Excellent! Maintain healthy habits to stay on track.';
        iconClass = 'text-success';
        badgeClass = 'low-risk';
    }

    document.getElementById('resultIcon').className = `fas fa-chart-line fa-3x mb-3 ${iconClass}`;
    document.getElementById('resultTitle').textContent = riskLevel;
    document.getElementById('resultTitle').className = `mb-3 ${iconClass}`;
    document.getElementById('resultProb').textContent = `${probPercent}%`;
    document.getElementById('resultProb').className = `display-5 fw-bold mb-3 ${iconClass}`;
    document.getElementById('riskBadge').textContent = riskLevel;
    document.getElementById('riskBadge').className = `badge rounded-pill px-4 py-2 fs-5 mb-3 ${badgeClass}`;
    document.getElementById('resultMessage').textContent = message;

    // ---------- NEW: show structured recommendations ----------
    const recSection = document.getElementById('recommendationSection');
    const recContent = document.getElementById('recommendationContent');

    if (recSection && recContent) {
        if (recommendation) {
            recSection.classList.remove('d-none');
            recContent.innerHTML = formatRecommendationText(recommendation);
        } else {
            recSection.classList.add('d-none');
            recContent.innerHTML = '';
        }
    }
}

// Reset – FULLY clears everything
function resetForm() {
    // 1. Clear stored data completely
    for (const key in userData) {
        delete userData[key];
    }
    Object.keys(userData).forEach(key => delete userData[key]);

    // 2. Reset ALL form inputs to default state
    document.querySelectorAll('input[type="radio"]').forEach(radio => {
        radio.checked = false;
    });
    document.querySelectorAll('input[type="number"]').forEach(input => {
        input.value = '';
        input.classList.remove('is-invalid');
    });
    document.querySelectorAll('select').forEach(select => {
        select.selectedIndex = 0;  // "Choose one..."
        select.classList.remove('is-invalid');
    });

    // 3. Remove any invalid feedback
    document.querySelectorAll('.invalid-feedback').forEach(fb => {
        fb.classList.remove('d-block');
    });

    // 4. Hide recommendation section
    const recSection = document.getElementById('recommendationSection');
    const recContent = document.getElementById('recommendationContent');
    if (recSection && recContent) {
        recSection.classList.add('d-none');
        recContent.innerHTML = '';
    }

    // 5. Go back to step 1
    currentStep = 1;
    document.getElementById('resultSection').classList.add('d-none');
    document.getElementById('stepper').classList.remove('d-none');
    showStep(1);
    updateProgress();

    // 6. Restore submit button
    document.getElementById('submitBtn').innerHTML =
        '<i class="fas fa-calculator me-2"></i>Assess My Risk';
}

// Helper: Reset to specific step (e.g., on error)
function resetToStep(step) {
    currentStep = step;
    showStep(step);
    document.getElementById('stepper').classList.remove('d-none');
    document.getElementById('loadingSpinner').classList.add('d-none');
    document.getElementById('submitBtn').innerHTML = '<i class="fas fa-calculator me-2"></i>Assess My Risk';
}
