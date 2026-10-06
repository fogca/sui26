<script>
	// Destructive actions always pass through a confirm() before the form submits.
	export let label = '';
	export let message = 'この操作を実行します。よろしいですか？';
	export let tone = 'default';
	export let type = 'submit';
	export let name = undefined;
	export let value = undefined;

	// Registered before the forwarded on:click, so stopImmediatePropagation also
	// cancels whatever the caller attached.
	function guard(e) {
		if (!confirm(message)) {
			e.preventDefault();
			e.stopImmediatePropagation();
		}
	}
</script>

<button
	class="a-btn"
	class:danger={tone === 'danger'}
	{type}
	{name}
	{value}
	on:click={guard}
	on:click
>
	{label}
</button>
