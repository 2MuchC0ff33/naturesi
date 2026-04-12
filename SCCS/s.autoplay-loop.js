h31523
s 00037/00000/00000
d D 1.1 26/04/12 13:56:44 twomuchcoffee 1 0
c date and time created 26/04/12 13:56:44 by twomuchcoffee
e
u
U
f e 0
t
T
I 1
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

    video.play().catch(() => {});

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
}
E 1
