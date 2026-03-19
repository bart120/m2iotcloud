from fastapi import APIRouter, HTTPException
from .models_jobs import JobCreateRequest, job_to_entity
from .cosmos import get_cosmos_container

router = APIRouter(prefix="/jobs", tags=["jobs"])

@router.post("", status_code=201, summary="Créer un job et ...", description="Créer un job dans cosmos DB et prépare à l'upload du fichier a traiter.")
def create_job(req:JobCreateRequest):
    container = get_cosmos_container()
    entity = job_to_entity(req)

    try:
        container.create_item(body=entity)
    except CosmosHttpResponseError as e:
        raise HTTPException(status_code=500, detail=f"Cosmos error: {getattr(e, 'message', str(e))}")

    return {"status":"ok"}

@router.get("", status_code=200)
def get_job():
    return {"status":"ok"}