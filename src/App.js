import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone'
import Plot from 'react-plotly.js';
import './App.css';

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
          const ydata = window.pyodide.runPython(`
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
          // console.log("return value", ydata.toJs())
          // console.log("return value", ydata.toJs()[0])
          // console.log("return value", ydata.toJs()[0][0])
          const xdata = window.pyodide.runPython(`
              from io import BytesIO
              from js import jsarray
              from astropy.io import fits
              array = jsarray.to_py().tobytes()
              raw = fits.open(BytesIO(array), mode="readonly")
              header = raw[0].header
              naxis = header["NAXIS1"]
              reval = header["CRVAL1"]
              repix = header["CRPIX1"]
              delta = header["CDELT1"]
              xdata = [reval + (i-repix) * delta for i in range(naxis)]
              xdata
            `)
          // console.log("xdata", xdata.toJs())
          const header = window.pyodide.runPython(`
            from io import BytesIO
            from js import jsarray
            from astropy.io import fits
            array = jsarray.to_py().tobytes()
            raw = fits.open(BytesIO(array), mode="readonly")
            header = raw[0].header
            print(header.items())
            # header.items()
            dict(header)
          `)
          console.log("header", header.toJs())
          console.log("CRPIX1", header.get("CRPIX1"))

          setPlotData([{
            x: xdata.toJs(),
            y: ydata.toJs()[0][0],
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
          <Plot data={plotdata} layout={plotlayout}/>
        </div>
      </header>
    </div>
  );
}

export default App;