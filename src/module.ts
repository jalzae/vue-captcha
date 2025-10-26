import { defineNuxtModule, addPlugin, createResolver } from '@nuxt/kit'
import { fileURLToPath } from 'url'

export interface ModuleOptions {
  /**
   * Whether to auto-import the useVerifyHuman composable
   * @default true
   */
  autoImports?: boolean

  /**
   * Whether to provide $verifyHuman via useNuxtApp()
   * @default true
   */
  addPlugin?: boolean
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: '@jalzae/vue-captcha',
    configKey: 'verifyCaptcha',
    compatibility: {
      nuxt: '^3.0.0'
    }
  },
  defaults: {
    autoImports: true,
    addPlugin: true
  },
  setup(options, nuxt) {
    const { resolve } = createResolver(import.meta.url)

    // Transpile the module
    nuxt.options.build.transpile.push(resolve('./runtime'))

    // Add plugin if enabled
    if (options.addPlugin) {
      addPlugin(resolve('./runtime/plugins/verify-human'))
    }

    // Auto-import composable if enabled
    if (options.autoImports) {
      nuxt.hook('imports:dirs', (dirs) => {
        dirs.push(resolve('./runtime/composables'))
      })
    }
  }
})
