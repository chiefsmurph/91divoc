
import './App.css';
import GraphSection from './GraphSection';

import ReactGA from 'react-ga';

import socketIOClient from "socket.io-client";

const TRACKING_ID = "UA-131761952-2";
ReactGA.initialize(TRACKING_ID);

const socketEndpoint = origin.includes('localhost') && false ? 'http://localhost:3000' : `https://chiefsmurph.com`;
const socket = socketIOClient(socketEndpoint, {
  path: '/91divoc-server/socket.io',
  secure: true,
  transports: ['websocket']
});

function App() {
  return (
    <div className="App">
      <header className="App-header">
        91divoc
      </header>
      <GraphSection
        socket={socket}
        title="World Locations" 
        socketMethod="getHighestLowestWorld"
        sources={[
          {
            url: 'https://github.com/owid/covid-19-data/tree/master/public/data',
            name: 'Our World In Data (OWID)'
          }
        ]}
      />
      <GraphSection
        socket={socket} 
        title="United States"
        socketMethod="getHighestLowestStates"
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
      />
    </div>
  );
}

export default App;
