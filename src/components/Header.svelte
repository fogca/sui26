<script>
    import { page } from '$app/stores'
    import Logo from "../components/Logo.svelte"
    import Symbol from "../components/Symbol.svelte"
    import Menu from "../components/Menu.svelte"
    import { localizePath } from '$lib/i18n.js'

    // the logo must return the reader to the home page in THEIR language,
    // not drop an English visitor onto the Japanese site
    $: home = localizePath('/', $page.data?.lang ?? 'ja')
</script>

<header>

    <a href={home}><Symbol /></a>
    <a href={home} class="Logo"><Logo /></a>
    <Menu />

</header>



<style>

    header {
        height: 100vh;
        height: 100svh;
        padding: 2.5rem var(--padding);
        position: fixed;
        top: 0;
        left: 0;
        z-index: 10;
    }

    header .Logo {
        position: absolute;
        top: auto;
        bottom:2rem;
        left: var(--padding);
    }

    @media screen and (min-width:720px){

        header {
            padding-top: 4rem;
            padding-left: var(--pcPadding);
            padding-right: var(--pcPadding);
        }
        header .Logo {
            left: var(--pcPadding);
            bottom:4rem;
        }

    }

</style>