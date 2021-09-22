import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone'
import Plot from 'react-plotly.js';
import './App.css';
import fitsreader from './python/fitsreader.py';

function App() {

  const initlayout = {
    title: {
      text:'Plot Title',
      font: {
        family: 'Courier New, monospace',
        size: 24
      },
      xref: 'paper',
      x: 0.05,
    },
    xaxis: {
      title: {
        text: 'x Axis',
        font: {
          family: 'Courier New, monospace',
          size: 18,
          color: '#7f7f7f'
        }
      },
      tickformat: '.3e'
    },
    yaxis: {
      title: {
        text: 'y Axis',
        font: {
          family: 'Courier New, monospace',
          size: 18,
          color: '#7f7f7f'
        }
      },
    }
  };

  const [plotdata, setPlotData] = useState([{}]);
  const [plotlayout, setPlotLayout] = useState(initlayout);

  const onDrop = useCallback((acceptedFiles) => {
    acceptedFiles.forEach((file) => {
      const reader = new FileReader()

      reader.onabort = () => console.log('file reading was aborted')
      reader.onerror = () => console.log('file reading has failed')
      reader.onload = () => {
        // Do whatever you want with the file contents
        window.jsarray = new Float32Array(reader.result);
        window.pyodide.loadPackage(['astropy']).then(() => {
          const getData = async () => {
            const scriptText = await (await fetch(fitsreader)).text();
            // console.log("script text", scriptText)
            window.pyodide.runPython(scriptText);
            let content = window.pyodide.globals.get("fitsreader");
            // console.log("content", content)
            // console.log("header", content.header.toJs())
            const xdata = content.axisdata(1).toJs()
            const ydata = content.rawdata.toJs()[0][0]
  
            setPlotData([{
              x: xdata,
              y: ydata,
              type: 'scatter',
              mode: 'lines+markers',
            }])
          }

          getData();
        })
      }
      reader.readAsArrayBuffer(file)
    })
    
  }, [])
  const {getRootProps, getInputProps} = useDropzone({onDrop})

  return (
    <div className="App">
      <header className="App-header">
        <div {...getRootProps()}>
          <input {...getInputProps()} />
          <p>Drag 'n' drop some files here, or click to select files</p>
        </div>
        <div>
          <Plot data={plotdata} layout={plotlayout}/>
        </div>
      </header>
    </div>
  );
}

export default App;