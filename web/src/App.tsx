
import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import './App.css';
//import theme from './theme';

import { Chat } from './app/chat';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Redirige la racine vers /chat */}
          <Route path="/" element={<Navigate to="/chat" replace />} />
          {/* Affiche le composant Chat */}
          <Route
            path="/chat"
            element={
              <Chat
                username="John Doe" // Remplacez par la valeur correcte
                existingChatSessionId={null}
                existingChatSessionCourseId="CS101"
              />
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
