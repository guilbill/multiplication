import { useGame } from './context/GameContext'
import ProfileScreen from './components/ProfileScreen'
import SubjectScreen from './components/SubjectScreen'
import MultiGame from './components/MultiGame'
import MultiProgress from './components/MultiProgress'
import ConjGame from './components/ConjGame'
import ConjProgress from './components/ConjProgress'
import VerbConjGame from './components/VerbConjGame'
import HomophoneGame from './components/HomophoneGame'
import VocabGame from './components/VocabGame'
import BossGame from './components/BossGame'

export default function App() {
  const { state } = useGame()

  const screens = {
    'profile':        <ProfileScreen />,
    'subject':        <SubjectScreen />,
    'mult-game':      <MultiGame />,
    'mult-progress':  <MultiProgress />,
    'conj-game':      <ConjGame />,
    'conj-progress':  <ConjProgress />,
    'verb-conj-game': <VerbConjGame />,
    'homophone-game': <HomophoneGame />,
    'vocab-game':     <VocabGame />,
    'boss-game':      <BossGame />,
  } as const

  // L'écriture au stylet a besoin de place : cet écran s'élargit
  const wide = state.screen === 'vocab-game'

  return <div id="app" className={wide ? 'app-wide' : undefined}>{screens[state.screen]}</div>
}
