import {
  createContext,
  useContext,
  useReducer,
  useRef,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'
import type { GameState, Screen } from '../types'
import { saveProgress } from '../lib/api'

// ── Actions ────────────────────────────────────────────────
type Action =
  | {
      type: 'LOAD_PLAYER'
      profile: string
      multProgress: Record<string, number>
      conjProgress: Record<number, number>
    }
  | { type: 'NAVIGATE'; screen: Screen }
  | { type: 'UPDATE_MULT'; key: string; weight: number }
  | { type: 'UPDATE_CONJ'; idx: number; weight: number }

// ── Reducer ────────────────────────────────────────────────
const initialState: GameState = {
  screen: 'profile',
  profile: '',
  multProgress: {},
  conjProgress: {},
}

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'LOAD_PLAYER':
      return {
        ...state,
        profile: action.profile,
        multProgress: action.multProgress,
        conjProgress: action.conjProgress,
      }
    case 'NAVIGATE':
      return { ...state, screen: action.screen }
    case 'UPDATE_MULT':
      return { ...state, multProgress: { ...state.multProgress, [action.key]: action.weight } }
    case 'UPDATE_CONJ':
      return { ...state, conjProgress: { ...state.conjProgress, [action.idx]: action.weight } }
  }
}

// ── Context ────────────────────────────────────────────────
interface GameContextValue {
  state: GameState
  dispatch: React.Dispatch<Action>
  save: () => void
}

const GameContext = createContext<GameContextValue | null>(null)

// ── Provider ───────────────────────────────────────────────
export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  // Stable ref always pointing at latest state — used in callbacks/effects
  const stateRef = useRef(state)
  useEffect(() => { stateRef.current = state }, [state])

  const save = useCallback(() => {
    const { profile, multProgress, conjProgress } = stateRef.current
    if (profile) saveProgress(profile, multProgress, conjProgress)
  }, [])

  // Auto-save on tab hide
  useEffect(() => {
    const handler = () => { if (document.visibilityState === 'hidden') save() }
    document.addEventListener('visibilitychange', handler)
    return () => document.removeEventListener('visibilitychange', handler)
  }, [save])

  return (
    <GameContext.Provider value={{ state, dispatch, save }}>
      {children}
    </GameContext.Provider>
  )
}

// ── Hook ───────────────────────────────────────────────────
export function useGame() {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGame must be used inside <GameProvider>')
  return ctx
}
