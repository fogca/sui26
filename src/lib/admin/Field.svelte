<script>
	// Label + control + hint/error. Put the <input class="a-input"> in the slot.
	export let label = '';
	export let hint = '';
	export let error = '';
	export let required = false;
</script>

<label class="field" class:invalid={!!error}>
	<span class="lab">
		<span class="txt">{label}</span>
		{#if required}<span class="req">必須</span>{/if}
	</span>

	<span class="control"><slot /></span>

	{#if hint}<span class="hint">{hint}</span>{/if}
	{#if error}<span class="err" role="alert">{error}</span>{/if}
</label>

<style>
	.field {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
		width: 100%;
	}
	.lab {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		font-size: 1.05rem;
		line-height: 1.4;
		letter-spacing: 0.04em;
		color: var(--subColor);
	}
	.txt {
		color: var(--textColor);
	}
	.req {
		font-size: 0.9rem;
		line-height: 1;
		padding: 0.28rem 0.42rem;
		border: 1px solid #e5c8c2;
		border-radius: 2px;
		color: #a3453a;
		letter-spacing: 0.06em;
	}
	.control {
		display: block;
	}
	.hint,
	.err {
		font-size: 1rem;
		line-height: 1.6;
	}
	.hint {
		color: var(--subColor);
	}
	.err {
		color: #a3453a;
	}
	/* the invalid frame has to out-specify .a-input from admin.css */
	.field.invalid :global(.a-input),
	.field.invalid :global(.a-select),
	.field.invalid :global(.a-textarea) {
		border-color: #d8a89f;
	}
</style>
