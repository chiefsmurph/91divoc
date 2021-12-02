import logo from './logo.svg';
import './App.css';

import { useState, useEffect} from 'react';

import { Line } from 'react-chartjs-2';

import socketIOClient from "socket.io-client";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const socketEndpoint = origin.includes('localhost') && true ? 'http://localhost:3000' : `https://chiefsmurph.com`;
const socket = socketIOClient(socketEndpoint, {
  path: '/socket.io',
  secure: true,
  transports: ['websocket']
});

const colors = ['orange', 'green', 'blue', 'red', 'turquoise', 'magenta']

function App() {
  const [highestLowestData, setHighestLowestData] = useState(null);
  useEffect(() => {
    socket.emit('getHighestLowest', data => {
      console.log({ data });
      setHighestLowestData(data);
    });
  }, []);
  const getChartData = keyFilter => ({
    labels: highestLowestData.map(({ date }) => date),
    datasets: Object.keys(highestLowestData[0])
      .filter(key => key.includes(keyFilter))
      .filter(key => key !== 'date')
      .map((key, i) => ({
        label: key,
        // fill: false,
        // lineTension: 0.1,
        backgroundColor: colors[i],
        borderColor: colors[i],
        // borderCapStyle: 'butt',
        // borderDash: [],
        // borderDashOffset: 0.0,
        // borderJoinStyle: 'miter',
        // pointBorderColor: colors[i],
        // pointBackgroundColor: '#fff',
        // pointBorderWidth: 1,
        // pointHoverRadius: 5,
        // // pointHoverBackgroundColor: colors[i],
        // // pointHoverBorderColor: colors[i],
        // pointHoverBorderWidth: 2,
        pointRadius: 0.5,
        // pointHitRadius: 10,
        data: highestLowestData.map(d => d[key] || undefined)
      }))
  });
  return (
    <div className="App">
      <header className="App-header">
        dovic91
      </header>
      {
        highestLowestData && (
          <div className="charts">
            <div><Line data={getChartData('cases')} options={{ responsive: true }} /></div>
            <div><Line data={getChartData('deaths')} options={{ responsive: true }}  /></div>
            <div><Line data={getChartData('total_vacc')} options={{ responsive: true }}  /></div>
          </div>
        )
      }
      
      <pre>{JSON.stringify(highestLowestData, null, 2)}</pre>
    </div>
  );
}

export default App;
