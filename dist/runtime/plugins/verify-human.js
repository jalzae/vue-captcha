import { verifyHuman } from "../../index";
export default defineNuxtPlugin(() => {
  return {
    provide: {
      /**
       * Trigger human verification modal
       * @returns {Promise<boolean>} - true if verified, false if cancelled
       *
       * @example
       * const { $verifyHuman } = useNuxtApp()
       * const result = await $verifyHuman()
       */
      verifyHuman
    }
  };
});
