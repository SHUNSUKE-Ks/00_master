/* @refresh reload */
import { render } from 'solid-js/web'
import SandboxApp from './sandbox/SandboxApp'
import './sandbox/sandbox-theme.css'

const root = document.getElementById('root')

// This entry intentionally does not import the production App, store, Firebase, or shared data bridges.
render(() => <SandboxApp />, root!)
