<script>
    //import Header from "../components/Header.svelte"
    //import Footer from "../components/Footer.svelte"
    import { page } from '$app/stores';
    import { fade } from 'svelte/transition';
    import { fly } from 'svelte/transition';


  let loaded = false;
  if (typeof document !== 'undefined') {
    const checkFonts = () => {
      if (!document.documentElement.classList.contains('wf-loading')) {
        loaded = true;
      } else {
        setTimeout(checkFonts, 50);
      }
    };
    checkFonts();
  }



</script>


      
<svelte:head>
  <link rel="stylesheet" href="/css/base.css?var=1.17">
  <!--<script src="https://webfont.fontplus.jp/accessor/script/fontplus.js?kqbwQX--jVA%3D&box=2bQkUFfZnEc%3D&aa=1&ab=2"></script>-->
  <link rel="stylesheet" href="https://use.typekit.net/yia1qxv.css">
  
</svelte:head>
      

    
{#if loaded}  
{#key $page.url.pathname}
  <div in:fade={{ duration: 2000 }} >
    <slot />
  </div>
{/key}
{/if}
        

      