
import './App.css';
import GraphSection from './GraphSection';

import ReactGA from 'react-ga';

import socketIOClient from "socket.io-client";
import { useEffect, useState } from 'react';
import useLocalStorageState from 'use-local-storage-state';

const TRACKING_ID = "UA-131761952-2";
ReactGA.initialize(TRACKING_ID);

const socketEndpoint = origin.includes('localhost') && true ? 'http://localhost:3000' : `https://chiefsmurph.com/`;
const socket = socketIOClient(socketEndpoint, {
  // path: '/91divoc-server/socket.io',
  path: '/socket.io',
  secure: true,
  transports: ['websocket']
});

function App() {
  const [numberOfVisits, setNumberofVisits] = useState(null);
  const [counterDisabled, setCounterDisabled] = useLocalStorageState(false);
  useEffect(() => {
    socket.on('counter', setNumberofVisits);
    if (!counterDisabled) {
      socket.emit('increaseCounter');
    }
  }, [counterDisabled]);
  const headerClick = evt => {
    if (evt.detail === 3) {
      setCounterDisabled(!counterDisabled);
    }
  };
  return (
    <div className="App">
      {numberOfVisits && <span className="numberOfVisits">
        numberOfVisits: {numberOfVisits}
      </span>}
      <header className="App-header" onClick={headerClick}>
        91divoc
      </header>
      <GraphSection
        socket={socket}
        title="World Locations" 
        socketMethod="highestLowestWorld"
        sources={[
          {
            url: 'https://github.com/owid/covid-19-data/tree/master/public/data',
            name: 'Our World In Data (OWID)'
          }
        ]}
        jsonUrl="https://chiefsmurph.com/91divoc-server/world-data.json"
      />
      <GraphSection
        socket={socket} 
        title="United States"
        socketMethod="highestLowestStates"
        sources={[
          {
            url: 'https://github.com/owid/covid-19-data/blob/1beec66a5fa9900f1953a94e4a5f4b8dc07cd279/public/data/vaccinations/README.md#united-states-vaccination-data',
            name: 'Vaccinations: Our World In Data (OWID)'
          },
          {
            url: 'https://data.cdc.gov/Case-Surveillance/United-States-COVID-19-Cases-and-Deaths-by-State-o/9mfq-cb36',
            name: 'Cases & Deaths: CDC.gov'
          },
          {
            url: 'https://datausa.io/api/data?drilldowns=State&measures=Population&year=latest',
            name: 'State Population: DataUSA.io'
          }
        ]}
        jsonUrl="https://chiefsmurph.com/91divoc-server/state-data.json"
      />
    </div>
  );
}

export default App;
