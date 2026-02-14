/**
 * Autoplay and loop video module.
 * Applies to videos with data-autoplay-loop="true".
 * Handles autoplay with looping and pause on end.
 * Pauses when page is hidden to prevent power-saving interruptions.
 */
export function initAutoplayLoop() {
    const video = document.getElementById('hero-video'); // Target specific video by ID
    if (!video || video.getAttribute('data-autoplay-loop') !== 'true') {
        return; // Only apply if configured in markup
    }

    const pauseDuration = 2000; // 2 seconds pause before restart
    let wasPlaying = false; // Track if video was playing before hiding

    // Handle page visibility changes to pause/resume
    function handleVisibilityChange() {
        if (document.hidden) {
            wasPlaying = !video.paused;
            video.pause();
        } else if (wasPlaying) {
            video.play().catch((error) => {
                console.warn('Resume play failed:', error);
            });
        }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Handle looping with pause, only restart if page is visible
    video.addEventListener('ended', () => {
        setTimeout(() => {
            if (!document.hidden) {
                video.play().catch((error) => {
                    console.warn('Autoplay restart blocked or failed:', error);
                    // Video will show poster and controls
                });
            }
        }, pauseDuration);
    });

    // Attempt autoplay on load (muted is required for autoplay)
    video.play().catch((error) => {
        console.warn('Initial autoplay blocked:', error);
        // Video will show poster and controls
    });
}
