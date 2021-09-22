import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone'
import Plot from 'react-plotly.js';
import './App.css';

function App() {

  const [plotdata, setPlotdata] = useState([{}]);

  const onDrop = useCallback((acceptedFiles) => {
    acceptedFiles.forEach((file) => {
      const reader = new FileReader()

      reader.onabort = () => console.log('file reading was aborted')
      reader.onerror = () => console.log('file reading has failed')
      reader.onload = () => {
        // Do whatever you want with the file contents
        window.jsarray = new Float32Array(reader.result);
        window.pyodide.loadPackage(['astropy']).then(() => {
          const rawdata = window.pyodide.runPython(`
              from io import BytesIO
              from js import jsarray
              from astropy.io import fits
              array = jsarray.to_py().tobytes()
              # print(type(array))
              # print(array)
              raw = fits.open(BytesIO(array), mode="readonly")
              data = raw[0].data
              data.tolist()
            `)
          // console.log("return value", rawdata.toJs())
          // console.log("return value", rawdata.toJs()[0])
          // console.log("return value", rawdata.toJs()[0][0])
          setPlotdata([{
            x: rawdata.toJs()[0][0].keys(),
            y: rawdata.toJs()[0][0],
            type: 'scatter',
            mode: 'lines+markers',
          }])
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
          <Plot data={plotdata}/>
        </div>
      </header>
    </div>
  );
}

export default App;