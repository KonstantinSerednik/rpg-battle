import React from 'react';
import './App.css';
import { GameProvider, useGame } from './context/GameContext';
import ModeSelection from './components/ModeSelection';
import CharacterSelection from './components/CharacterSelection';
import AttackSelection from './components/AttackSelection';
import BattleScene from './components/BattleScene';
import WinnerScreen from './components/WinnerScreen';

const GameContent: React.FC = () => {
  const { state } = useGame();
  const { stage, log } = state;

  return (
    <div className="arena-container">
      <div className="box">
        <h1>RPG ARENA</h1>
        <p className="log-text">{log}</p>
      </div>

      {stage === 'mode_select' && <ModeSelection />}
      {stage === 'p1_char' && <CharacterSelection forPlayer={1} />}
      {stage === 'p1_attacks' && <AttackSelection forPlayer={1} />}
      {stage === 'p2_char' && <CharacterSelection forPlayer={2} />}
      {stage === 'p2_attacks' && <AttackSelection forPlayer={2} />}
      {stage === 'battle' && <BattleScene />}
      {stage === 'winner' && <WinnerScreen />}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <GameProvider>
      <GameContent />
    </GameProvider>
  );
};

export default App;