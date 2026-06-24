/* @refresh reload */
import { render } from 'solid-js/web'
import './index.css'
import App from './App.tsx'
import { installKeyDebug } from './utils/keyDebug'

const root = document.getElementById('root')

installKeyDebug()
render(() => <App />, root!)
