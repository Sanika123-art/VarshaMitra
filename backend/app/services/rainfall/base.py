"""Abstract base interface for rainfall data providers."""

from abc import ABC, abstractmethod
from app.schemas.location import BlockDetail
from app.schemas.rainfall import ProviderStatusResponse, RainfallObservationSeries


class RainfallProvider(ABC):
    """Abstract interface defining the rainfall provider contract."""

    @property
    @abstractmethod
    def provider_id(self) -> str:
        """Unique identifier key for the provider."""
        pass

    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Human-readable display name of the provider."""
        pass

    @abstractmethod
    async def get_recent_observations(
        self,
        block: BlockDetail,
        days: int = 7,
    ) -> RainfallObservationSeries:
        """Fetch and normalize daily rainfall observations for an administrative block."""
        pass

    @abstractmethod
    async def get_source_status(self) -> ProviderStatusResponse:
        """Report provider operational, credential, and freshness status."""
        pass
