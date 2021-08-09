import { useEffect, useState, useCallback } from 'react';
import {useDropzone} from 'react-dropzone'
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
        // const binaryStr = reader.result
        // console.log(binaryStr)
        window.pyodide.loadPackage(['astropy']).then(() => {
          const output = window.pyodide.runPython(`
            # import numpy as np
            # from astropy.io import fits
            # fits.open(${reader.readAsArrayBuffer(file)})
            print(1+2)
          `)
          console.log(output)
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
        <MyDropzone/>
      </header>
    </div>
  );
}

export default App;