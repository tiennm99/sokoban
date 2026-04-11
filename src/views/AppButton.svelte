<!--
    Shared button component. Wraps a native <button> so clicks are always
    native-reliable, focus + keyboard activation work for free, and one
    CSS rule controls the theme everywhere.
-->
<script>
    let {
        onclick,
        variant = 'primary',   // 'primary' | 'ghost' | 'danger'
        size = 'md',           // 'sm' | 'md' | 'lg'
        disabled = false,
        title = undefined,
        children
    } = $props();
</script>

<button
    class="btn {variant} {size}"
    type="button"
    {onclick}
    {disabled}
    {title}
>
    {@render children?.()}
</button>

<style>
    .btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 12px 24px;
        font-family: inherit;
        font-weight: 700;
        letter-spacing: 1px;
        color: var(--text);
        background: var(--panel);
        border: 2px solid var(--accent);
        border-radius: var(--radius);
        cursor: pointer;
        transition: background 120ms ease, transform 80ms ease, box-shadow 120ms ease;
        user-select: none;
    }

    .btn:hover:not(:disabled) {
        background: var(--panel-hover);
        box-shadow: 0 4px 18px rgba(136, 192, 208, 0.25);
    }

    .btn:active:not(:disabled) {
        transform: translateY(1px);
    }

    .btn:focus-visible {
        outline: 2px solid var(--accent);
        outline-offset: 2px;
    }

    .btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .btn.sm { padding: 6px 12px; font-size: 13px; }
    .btn.md { font-size: 15px; }
    .btn.lg { padding: 16px 32px; font-size: 18px; }

    .btn.ghost {
        background: transparent;
        border-color: var(--border);
    }

    .btn.ghost:hover:not(:disabled) {
        background: var(--panel);
        border-color: var(--accent);
    }

    .btn.danger {
        border-color: var(--danger);
    }

    .btn.danger:hover:not(:disabled) {
        background: rgba(191, 97, 106, 0.15);
    }
</style>
