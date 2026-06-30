document.addEventListener('DOMContentLoaded', function () {
    const settingsBtn = document.getElementById('settingsBtn');
    const closeSettingsBtn = document.getElementById('closeSettingsBtn');
    const settingsModal = document.getElementById('settingsModal');
    const settingsOverlay = document.getElementById('settingsOverlay');
    const togglePastShowtimes = document.getElementById('togglePastShowtimes');

    if (!settingsBtn || !settingsModal) return;

    // Load saved settings
    const hidePast = localStorage.getItem('hidePastShowtimes') !== 'false';
    togglePastShowtimes.checked = hidePast;

    // Open modal
    settingsBtn.addEventListener('click', function () {
        settingsModal.classList.add('show');
        settingsOverlay.classList.add('show');
    });

    // Close modal
    function closeModal() {
        settingsModal.classList.remove('show');
        settingsOverlay.classList.remove('show');
    }

    closeSettingsBtn.addEventListener('click', closeModal);
    settingsOverlay.addEventListener('click', closeModal);

    // Handle toggle change
    togglePastShowtimes.addEventListener('change', function () {
        localStorage.setItem('hidePastShowtimes', this.checked);
        // Reload the page to apply the setting cleanly
        // since we'd need to undo the display: none which can be complex depending on filters
        window.location.reload();
    });
});
