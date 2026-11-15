from __future__ import annotations

from abc import ABC, abstractmethod

import xarray as xr


class DatasetRepository(ABC):
    @abstractmethod
    def available(self) -> list[str]: ...

    @abstractmethod
    def load(self, variable: str) -> xr.Dataset:
        """Dataset with `value[time, lat, lon]` monthly values."""
