import azure.functions as func
import logging

app = func.FunctionApp()

@app.blob_trigger(arg_name="myblob", path="doc/input/{name}",
                               connection="iotvlas_STORAGE") 
def WorkerUpload(myblob: func.InputStream):
    logging.info(f"Test déploiement azure"
                f"Name: {myblob.name}"
                f"Blob Size: {myblob.length} bytes")