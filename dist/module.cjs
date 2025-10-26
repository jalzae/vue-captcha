'use strict';

const kit = require('@nuxt/kit');

var _documentCurrentScript = typeof document !== 'undefined' ? document.currentScript : null;
const module$1 = kit.defineNuxtModule({
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
    const { resolve } = kit.createResolver((typeof document === 'undefined' ? require('u' + 'rl').pathToFileURL(__filename).href : (_documentCurrentScript && _documentCurrentScript.tagName.toUpperCase() === 'SCRIPT' && _documentCurrentScript.src || new URL('module.cjs', document.baseURI).href)));
    nuxt.options.build.transpile.push(resolve("./runtime"));
    if (options.addPlugin) {
      kit.addPlugin(resolve("./runtime/plugins/verify-human"));
    }
    if (options.autoImports) {
      nuxt.hook("imports:dirs", (dirs) => {
        dirs.push(resolve("./runtime/composables"));
      });
    }
  }
});

module.exports = module$1;
