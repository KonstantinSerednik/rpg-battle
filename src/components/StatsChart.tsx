import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useGame } from '../context/GameContext';

const StatsChart: React.FC = () => {
  const { state } = useGame();
  const { turnHistory } = state;

  if (turnHistory.length === 0) {
    return <div className="box">Нет данных для отображения статистики.</div>;
  }

  // Подготовка данных для графика
  const data = turnHistory.map(record => ({
    turn: record.turnNumber,
    hp1: record.p1Hp,
    hp2: record.p2Hp,
    energy1: record.p1Energy,
    energy2: record.p2Energy,
  }));

  return (
    <div className="box">
      <h3>Статистика боя</h3>
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="turn" label={{ value: 'Ход', position: 'insideBottom', offset: -5 }} />
            <YAxis label={{ value: 'HP', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="hp1" stroke="#3b82f6" name="HP Игрок 1" strokeWidth={2} dot={{ r: 4 }} />
            <Line type="monotone" dataKey="hp2" stroke="#ef4444" name="HP Игрок 2" strokeWidth={2} dot={{ r: 4 }} />
            <Line type="monotone" dataKey="energy1" stroke="#8b5cf6" name="Энергия Игрок 1" strokeWidth={2} dot={{ r: 4 }} />
            <Line type="monotone" dataKey="energy2" stroke="#f59e0b" name="Энергия Игрок 2" strokeWidth={2} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p style={{ fontSize: '0.9rem', color: '#aaa', marginTop: '10px' }}>
        График показывает изменение HP и энергии по ходам.
      </p>
    </div>
  );
};

export default StatsChart;