<!--
    Donation modal: shows the VietQR code. Shared between the menu
    "Donate" button and the "Buy me a coffee" button on the win screen.
-->
<script>
    import AppButton from './AppButton.svelte';

    let { open = false, onClose } = $props();

    let dialogEl = $state();
    let prevFocus = null;

    // On open: stash the previously-focused element and move focus into the
    // dialog so screen readers announce it and Tab cycles within. On close:
    // restore the prior focus so keyboard users land back where they were.
    $effect(() => {
        if (open) {
            prevFocus = document.activeElement;
            queueMicrotask(() => dialogEl?.focus());
        } else if (prevFocus instanceof HTMLElement) {
            prevFocus.focus();
            prevFocus = null;
        }
    });

    function onKey(e) {
        if (open && e.key === 'Escape') onClose();
    }

    // Close only when the backdrop itself is clicked, not when a click
    // bubbles up from the dialog contents. Avoids needing stopPropagation
    // on the dialog (which would otherwise require a keyboard handler too).
    function onBackdropClick(e) {
        if (e.target === e.currentTarget) onClose();
    }
</script>

<svelte:window onkeydown={onKey} />

{#if open}
    <div class="overlay" onclick={onBackdropClick} role="presentation">
        <div
            class="dialog"
            bind:this={dialogEl}
            role="dialog"
            aria-modal="true"
            aria-label="Donate"
            tabindex="-1"
        >
            <h2>Thanks for playing!</h2>
            <p class="sub">Scan to send a tip — supports 50+ banking apps.</p>
            <img
                src="{import.meta.env.BASE_URL}assets/qr.jpg"
                alt="Donation QR code for NGUYEN MINH TIEN"
                class="qr"
            />
            <AppButton variant="ghost" onclick={onClose}>CLOSE</AppButton>
        </div>
    </div>
{/if}

<style>
    /* .overlay + .dialog base lives in app.css; only specific tweaks here. */
    .overlay {
        z-index: 200;
    }

    .dialog {
        padding: 24px 28px 20px;
        gap: 12px;
        max-width: 380px;
        max-height: 90vh;
        overflow: auto;
    }

    .dialog h2 {
        font-size: 22px;
        letter-spacing: 1px;
        color: var(--accent);
    }

    .sub {
        font-size: 13px;
        color: var(--text-muted);
        text-align: center;
    }

    .qr {
        width: 100%;
        max-width: 320px;
        height: auto;
        border-radius: var(--radius);
        display: block;
    }
</style>
