from io import BytesIO
from js import jsarray
from astropy.io import fits

class FitsReader:

    def __init__(self, bytesfile) -> None:
        self.content = fits.open(BytesIO(bytesfile), mode="readonly")

    @property
    def header(self) -> dict:
        header = self.content[0].header
        return dict(header)

    @property
    def rawdata(self) -> list:
        return self.content[0].data.tolist()

    def axisdata(self, idx) -> list:
        if idx > self.header.get("NAXIS"):
            raise RuntimeError(f"Input index {idx} is higher than the dimension")

        naxis = self.header[f"NAXIS{idx}"]
        reval = self.header[f"CRVAL{idx}"]
        repix = self.header[f"CRPIX{idx}"]
        delta = self.header[f"CDELT{idx}"]
        return [reval + (i-repix) * delta for i in range(naxis)]

# if __name__ == "__main__":
#     array = jsarray.to_py().tobytes()
#     print("in main", array)
#     fitsreader = FitsReader(array)
#     FitsReader(array)

array = jsarray.to_py().tobytes()
fitsreader = FitsReader(array)
# FitsReader(array)