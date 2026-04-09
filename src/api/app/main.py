from fastapi import FastAPI
from .routes_jobs import router as jobs_router
from fastapi.middleware.cors import CORSMiddleware

origins = ["*"]
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,      # domaines autorisés
    allow_credentials=False,
    allow_methods=["*"],        # GET, POST, PUT, DELETE...
    allow_headers=["*"]
)


app.include_router(jobs_router)

@app.get("/health")
def health():
    return {"status":"ok"}