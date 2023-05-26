import Rule from "../../libs/codeValidator/entities/Rule";

let svelteRules = [
   new Rule<Script>('script', '<script>$text</script>', () => { }),
   new Rule<Style>('style', '<style>$text</style>', () => { }),
   new Rule<Tag>('tag', '<$text$( $text$?(=$($string|{$text})))*$?(/)$<$(></$text>)>?$rule(tag)</$text>', () => { }),
   new Rule<SvelteIf>('if', '{#if $text}$text$?({:else$?( if $text)}$text)*{/if}', () => { }),
   new Rule<SvelteEach>('each', '{#each $text as $text$?(,)$<\($?($text)$?(($text))}$text$?({:else}$text){/each}', () => { }),
   new Rule<SvelteAwait>('await', '{#await $text $?($(then|catch)$text)}$text$?({:then $text}$text)$?({:catch $text}$text){/await}', () => { }),
   new Rule<SvelteKey>('key', '{#key $text}$text{/key}', () => { }),
   new Rule<SvelteDirective>('directive', '{@$(html|debug|const)$text}', () => { }),
   new Rule<Svelte>('svelte', '$rule(script)$text$rule(style)', () => { })
]