
import './App.css';
import GraphSection from './GraphSection';

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
        91divoc
      </header>
      <GraphSection title="World Locations" socket={socket} socketMethod={'getHighestLowestWorld'}/>
      <GraphSection title="United States" socket={socket} socketMethod={'getHighestLowestStates'}/>
    </div>
  );
}

export default App;
