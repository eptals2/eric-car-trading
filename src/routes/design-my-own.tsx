import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/design-my-own')({
    component: RouteComponent,
})

function RouteComponent() {
    return <div>Design Your Own Setup, <a href="/" rel="noopener noreferrer">Home</a></div>
}
