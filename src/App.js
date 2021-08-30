import { useEffect, useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone'
import Plot from 'react-plotly.js';
import script from './python/script.py';
import './App.css';

function App() {
  const [output, setOutput] = useState("(loading...)");
  const [isClicked, setClicked] = useState(false);
  const dummy = [{
    x: [1, 2, 3],
    y: [2, 6, 3],
    type: 'scatter',
    mode: 'lines+markers',
    marker: {color: 'red'},
  }]
  const [plotdata, setPlotdata] = useState(dummy);

  const runScript = code => {
    window.pyodide.loadPackage([]).then(() => {
      const output = window.pyodide.runPython(code);
      setOutput(output);
    })
  }

  useEffect(() => {
    window.languagePluginLoader.then(() => {
      fetch(script)
        .then(src => src.text())
        .then(runScript)
    })
  })

  const onDrop = useCallback((acceptedFiles) => {
    acceptedFiles.forEach((file) => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()

        reader.onabort = () => console.log('file reading was aborted')
        reader.onerror = () => console.log('file reading has failed')
        reader.onload = () => {
          // Do whatever you want with the file contents
          // const binaryStr = reader.result
          // console.log(binaryStr)
          window.jsarray = new Float32Array(reader.result);
          window.pyodide.loadPackage(['astropy']).then(() => {
            const ret = window.pyodide.runPython(`
                from io import BytesIO
                from js import jsarray
                from astropy.io import fits
                array = jsarray.to_py().tobytes()
                print(type(array))
                print(array)
                raw = fits.open(BytesIO(array), mode="readonly")
                data = raw[0].data
                data.tolist()
              `)
            console.log("return value", ret.toJs())
            console.log("return value", ret.toJs()[0])
            console.log("return value", ret.toJs()[0][0])
            resolve(ret.toJs())
            setPlotdata([{
              x: ret.toJs()[0][0].keys(),
              y: ret.toJs()[0][0],
              type: 'scatter',
              mode: 'lines+markers',
            }])
          })
        }
        reader.readAsArrayBuffer(file)
      })
    })
    
  }, [])
  const {getRootProps, getInputProps} = useDropzone({onDrop})

  return (
    <div className="App">
      <header className="App-header">
        <div className="flex-container">
          {/* <img src={logo} className="App-logo" alt="logo" /> */}
          <p>
            5 + 7 = {output}
          </p>
          <button onClick={() => setClicked(!isClicked)}>{''+isClicked}</button>
        </div>
        <div {...getRootProps()}>
          <input {...getInputProps()} />
          <p>Drag 'n' drop some files here, or click to select files</p>
        </div>
        <div>
          {/* <Plot
            data={[
              {
                x: [1, 2, 3],
                y: [2, 6, 3],
                type: 'scatter',
                mode: 'lines+markers',
                // marker: {color: 'red'},
              },
              // {type: 'bar', x: [1, 2, 3], y: [2, 5, 3]},
            ]}
            // layout={ {width: 320, height: 240, title: 'A Fancy Plot'} }
          /> */}
          <Plot data={plotdata}/>
        </div>
      </header>
    </div>
  );
}

export default App;