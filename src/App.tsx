import { useGame } from './context/GameContext'
import ProfileScreen from './components/ProfileScreen'
import SubjectScreen from './components/SubjectScreen'
import MultiGame from './components/MultiGame'
import MultiProgress from './components/MultiProgress'
import ConjGame from './components/ConjGame'
import ConjProgress from './components/ConjProgress'

export default function App() {
  const { state } = useGame()

  const screens = {
    'profile':        <ProfileScreen />,
    'subject':        <SubjectScreen />,
    'mult-game':      <MultiGame />,
    'mult-progress':  <MultiProgress />,
    'conj-game':      <ConjGame />,
    'conj-progress':  <ConjProgress />,
  } as const

  return <div id="app">{screens[state.screen]}</div>
}
