import { useEffect, useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone'
import Plot from 'react-plotly.js';
import script from './python/script.py';
import './App.css';

function MyDropzone() {
  const onDrop = useCallback((acceptedFiles) => {
    acceptedFiles.forEach((file) => {
      const reader = new FileReader()

      reader.onabort = () => console.log('file reading was aborted')
      reader.onerror = () => console.log('file reading has failed')
      reader.onload = () => {
        // Do whatever you want with the file contents
        const binaryStr = reader.result
        console.log(binaryStr)
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
        })
      }
      reader.readAsArrayBuffer(file)
    })
    
  }, [])
  const {getRootProps, getInputProps} = useDropzone({onDrop})

  return (
    <div {...getRootProps()}>
      <input {...getInputProps()} />
      <p>Drag 'n' drop some files here, or click to select files</p>
    </div>
  )
}

function App() {
  const [output, setOutput] = useState("(loading...)");
  const [isClicked, setClicked] = useState(false);

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
        <MyDropzone />
        <div>
          <Plot
            data={[
              {
                x: [1, 2, 3],
                y: [2, 6, 3],
                type: 'scatter',
                mode: 'lines+markers',
                marker: {color: 'red'},
              },
              {type: 'bar', x: [1, 2, 3], y: [2, 5, 3]},
            ]}
            layout={ {width: 320, height: 240, title: 'A Fancy Plot'} }
          />
        </div>
      </header>
    </div>
  );
}

export default App;