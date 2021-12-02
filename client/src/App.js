import logo from './logo.svg';
import './App.css';

import socketIOClient from "socket.io-client";

const socketEndpoint = origin.includes('localhost') && true ? 'http://localhost:3000' : `https://chiefsmurph.com`;
const socket = socketIOClient(socketEndpoint, {
    path: '/socket.io',
    secure: true,
    transports: ['websocket']
});

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;
