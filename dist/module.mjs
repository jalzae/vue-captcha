import { defineNuxtModule, createResolver, addPlugin } from '@nuxt/kit';

const module = defineNuxtModule({
  meta: {
    name: "@jalzae/vue-captcha",
    configKey: "verifyCaptcha",
    compatibility: {
      nuxt: "^3.0.0"
    }
  },
  defaults: {
    autoImports: true,
    addPlugin: true
  },
  setup(options, nuxt) {
    const { resolve } = createResolver(import.meta.url);
    nuxt.options.build.transpile.push(resolve("./runtime"));
    if (options.addPlugin) {
      addPlugin(resolve("./runtime/plugins/verify-human"));
    }
    if (options.autoImports) {
      nuxt.hook("imports:dirs", (dirs) => {
        dirs.push(resolve("./runtime/composables"));
      });
    }
  }
});

export { module as default };
