from __future__ import annotations

from functools import lru_cache
from pathlib import Path

import xarray as xr

from app.ports.dataset_repository import DatasetRepository

DATA_DIR = Path(__file__).resolve().parents[2] / "data"


class ZarrRepository(DatasetRepository):
    def __init__(self, data_dir: Path = DATA_DIR):
        self.data_dir = data_dir

    def available(self) -> list[str]:
        return sorted(p.stem for p in self.data_dir.glob("*.zarr"))

    @lru_cache(maxsize=2)  # noqa: B019  (each loaded variable is ~40 MB; the hosted instance has 512 MB)
    def load(self, variable: str) -> xr.Dataset:
        path = self.data_dir / f"{variable}.zarr"
        if not path.exists():
            raise FileNotFoundError(variable)
        return xr.open_zarr(path).load()
