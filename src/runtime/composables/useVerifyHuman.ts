import { ref } from 'vue'
import { verifyHuman as verifyHumanFunc } from '../../index'

/**
 * Composable for human verification
 *
 * @returns {Object} Verification state and methods
 *
 * @example
 * const { verifyHuman, isVerifying, verified, error } = useVerifyHuman()
 *
 * const handleVerify = async () => {
 *   const result = await verifyHuman()
 *   if (result) {
 *     console.log('✅ User verified!')
 *   }
 * }
 */
export const useVerifyHuman = () => {
  const isVerifying = ref(false)
  const verified = ref(false)
  const error = ref<string | null>(null)

  /**
   * Trigger the verification modal
   * @returns {Promise<boolean>} - true if verified, false if cancelled
   */
  const verifyHuman = async (): Promise<boolean> => {
    isVerifying.value = true
    error.value = null

    try {
      const result = await verifyHumanFunc()
      if (result) {
        verified.value = true
      }
      return result
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Verification failed'
      return false
    } finally {
      isVerifying.value = false
    }
  }

  /**
   * Reset verification state
   */
  const reset = () => {
    verified.value = false
    error.value = null
    isVerifying.value = false
  }

  return {
    verifyHuman,
    reset,
    isVerifying,
    verified,
    error
  }
}
