import { createApp, h } from "vue"
import HumanVerifyModal from "./HumanVerifyModal.vue"

export async function verifyHuman() {
  return new Promise((resolve) => {
    const container = document.createElement("div")
    document.body.appendChild(container)

    const app = createApp({
      render: () =>
        h(HumanVerifyModal, {
          onClose: () => {
            app.unmount()
            document.body.removeChild(container)
          },
          onSuccess: (result) => {
            resolve(result)
          },
        }),
    })

    app.mount(container)
  })
}
