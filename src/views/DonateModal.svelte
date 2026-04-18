<!--
    Donation modal: shows the VietQR code. Shared between the menu
    "Donate" button and the "Buy me a coffee" button on the win screen.
-->
<script>
    import AppButton from './AppButton.svelte';

    let { open = false, onClose } = $props();

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
        <div class="dialog" role="dialog" aria-modal="true" aria-label="Donate" tabindex="-1">
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
    .overlay {
        position: fixed;
        inset: 0;
        background: rgba(12, 16, 24, 0.72);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 200;
        animation: fade-in 180ms ease;
        padding: 16px;
    }

    .dialog {
        background: var(--panel);
        border: 2px solid var(--accent);
        border-radius: var(--radius-lg);
        padding: 24px 28px 20px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
        max-width: 380px;
        max-height: 90vh;
        overflow: auto;
        box-shadow: 0 30px 80px rgba(0, 0, 0, 0.7);
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

    @keyframes fade-in {
        from { opacity: 0; }
        to { opacity: 1; }
    }
</style>
