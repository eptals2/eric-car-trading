import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/made-to-order')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/made-to-order"!</div>
}
