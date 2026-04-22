from fastapi import APIRouter
from . import recipes
from . import ai
from . import biometrics

router = APIRouter()
router.include_router(recipes.router)
router.include_router(ai.router)
router.include_router(biometrics.router)
