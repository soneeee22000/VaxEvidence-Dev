import { Suspense } from "react"

import { NewProtocolClient } from "./NewProtocolClient"

export default function NewProtocolPage() {
  return (
    <Suspense>
      <NewProtocolClient />
    </Suspense>
  )
}
