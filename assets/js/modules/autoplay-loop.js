/**
 * Autoplay and loop video module.
 * Applies to videos with data-autoplay-loop="true".
 * Attempts autoplay once on load; if blocked, falls back gracefully.
 * Never retries — avoids flicker and AbortError loops.
 */
export function initAutoplayLoop() {
    const video = document.getElementById('hero-video');
    if (!video || video.getAttribute('data-autoplay-loop') !== 'true') {
        return;
    }

    const pauseDuration = 2000;
    let wasPlaying = false;
    let loopScheduled = false;

    function handleVisibilityChange() {
        if (document.hidden) {
            wasPlaying = !video.paused;
            video.pause();
        } else if (wasPlaying) {
            video.play().catch(() => {});
        }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange);

    video.addEventListener('ended', () => {
        if (loopScheduled || document.hidden) return;
        loopScheduled = true;
        setTimeout(() => {
            loopScheduled = false;
            video.play().catch(() => {});
        }, pauseDuration);
    });

    video.addEventListener('error', () => {
        video.style.display = 'none';
    });
}
