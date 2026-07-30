<!-- PWA meta bundle for editor routes only, so the public site stays a plain
     website while /log/edit (+ login/new/edit) can be installed to the home
     screen as a standalone app. -->
<svelte:head>
	<link rel="manifest" href="/manifest.webmanifest" />
	<meta name="theme-color" content="#fbfbfa" />
	<meta name="mobile-web-app-capable" content="yes" />
	<meta name="apple-mobile-web-app-capable" content="yes" />
	<meta name="apple-mobile-web-app-status-bar-style" content="default" />
	<meta name="apple-mobile-web-app-title" content="SUI log" />
</svelte:head>
