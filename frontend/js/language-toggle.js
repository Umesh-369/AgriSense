document.addEventListener('DOMContentLoaded', () => {
    const languageSelect = document.getElementById('languageSelect');

    // 1. Initialize Language
    const savedLanguage = localStorage.getItem('selectedLanguage') || 'en';
    setLanguage(savedLanguage);

    // 2. Event Listener for Dropdown
    if (languageSelect) {
        languageSelect.value = savedLanguage;
        languageSelect.addEventListener('change', (e) => {
            setLanguage(e.target.value);
        });
    }
});

function setLanguage(lang) {
    // Validate language
    if (!translations[lang]) {
        console.warn(`Language '${lang}' not found, falling back to English.`);
        lang = 'en';
    }

    // Save preference
    localStorage.setItem('selectedLanguage', lang);

    // Update Dropdown if it exists (sync across tabs/reloads)
    const languageSelect = document.getElementById('languageSelect');
    if (languageSelect) {
        languageSelect.value = lang;
    }

    // Update Content
    updateContent(lang);

    // Update HTML lang attribute
    document.documentElement.lang = lang;
}

function updateContent(lang) {
    const elements = document.querySelectorAll('[data-i18n]');

    elements.forEach(element => {
        const key = element.getAttribute('data-i18n');
        const translation = translations[lang][key];

        if (translation) {
            element.innerHTML = translation;
        } else {
            console.warn(`Missing translation for key: ${key}`);
        }
    });

    // Dispatch event for other potential components to listen to
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: lang } }));
}
