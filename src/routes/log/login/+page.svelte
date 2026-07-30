<script>
	import { enhance } from '$app/forms';
	import EditorHead from '$lib/log/EditorHead.svelte';
	export let form;
</script>

<EditorHead />
<svelte:head><title>log — sign in</title></svelte:head>

<section class="login">
	<form method="POST" use:enhance class="box">
		<h1 class="serif">log editor</h1>
		<input type="password" name="password" placeholder="パスワード" autocomplete="current-password" />
		{#if form?.error}<p class="err">{form.error}</p>{/if}
		<button type="submit">入る</button>
	</form>
</section>

<style>
	.login {
		min-height: 100vh;
		min-height: 100dvh;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.box {
		display: flex;
		flex-direction: column;
		gap: 1.4rem;
		width: min(28rem, 80vw);
	}
	h1 {
		font-size: 1.8rem;
		letter-spacing: 0.05em;
		margin-bottom: 0.6rem;
	}
	input {
		border-bottom: 1px solid #ddd;
		padding: 0.6rem 0;
		font-size: 1.4rem;
	}
	button {
		align-self: flex-start;
		margin-top: 0.6rem;
		font-size: 1.2rem;
		color: var(--blackColor);
		cursor: pointer;
	}
	.err {
		color: #c0392b;
		font-size: 1.1rem;
	}
</style>
