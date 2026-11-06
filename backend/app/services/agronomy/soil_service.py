"""Soil property and soil health management service."""

import contextlib
from datetime import datetime, timezone
import sqlite3
import uuid
from typing import Any, Dict, List, Optional

from app.data.regional_soil_data import get_regional_soil_profile
from app.schemas.soil import (
    FieldSoilTestResponse,
    FieldSoilTestSubmission,
    NutrientRating,
    RegionalSoilSummaryResponse,
    SoilDataSource,
)
from app.services.dataset.storage import dataset_storage


class SoilService:
    """Provides regional soil intelligence and farmer field-specific soil test management."""

    def __init__(self):
        self._init_field_test_db()

    @contextlib.contextmanager
    def _connection(self):
        conn = sqlite3.connect(dataset_storage.db_path)
        conn.row_factory = sqlite3.Row
        try:
            with conn:
                yield conn
        finally:
            conn.close()

    def _init_field_test_db(self) -> None:
        """Create table for field-level soil tests in persistent SQLite database."""
        with self._connection() as conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS field_soil_tests (
                    profile_id TEXT PRIMARY KEY,
                    location_id TEXT NOT NULL,
                    field_identifier TEXT,
                    sampling_date TEXT NOT NULL,
                    laboratory_name TEXT,
                    test_method TEXT,
                    ph REAL NOT NULL,
                    electrical_conductivity_ds_m REAL,
                    organic_carbon_pct REAL,
                    available_nitrogen_kg_ha REAL,
                    available_phosphorus_kg_ha REAL,
                    available_potassium_kg_ha REAL,
                    available_sulphur_ppm REAL,
                    zinc_ppm REAL,
                    iron_ppm REAL,
                    copper_ppm REAL,
                    manganese_ppm REAL,
                    boron_ppm REAL,
                    farmer_notes TEXT,
                    registered_at TEXT NOT NULL
                )
                """
            )
            conn.execute("CREATE INDEX IF NOT EXISTS idx_soil_loc ON field_soil_tests(location_id)")
            conn.commit()

    def get_regional_profile(self, block_id: str) -> RegionalSoilSummaryResponse:
        """Fetch regional estimated soil profile for an administrative block."""
        return get_regional_soil_profile(block_id)

    @staticmethod
    def classify_ph(ph: float) -> str:
        """Classify soil reaction according to ICAR standards."""
        if ph < 6.5:
            return "acidic"
        elif 6.5 <= ph <= 7.8:
            return "optimal_neutral"
        elif 7.8 < ph <= 8.5:
            return "moderately_alkaline"
        else:
            return "highly_alkaline"

    @staticmethod
    def classify_ec(ec: Optional[float]) -> str:
        """Classify soil salinity from Electrical Conductivity (dS/m)."""
        if ec is None:
            return "not_reported"
        if ec < 1.0:
            return "normal_non_saline"
        elif 1.0 <= ec <= 2.0:
            return "critical_for_sensitive_crops"
        else:
            return "hazardous_saline"

    @staticmethod
    def rate_organic_carbon(oc: Optional[float]) -> Optional[NutrientRating]:
        """Rate Organic Carbon (Walkley-Black %) per Maharashtra Dept of Ag norms."""
        if oc is None:
            return None
        if oc < 0.40:
            return NutrientRating.LOW
        elif 0.40 <= oc <= 0.60:
            return NutrientRating.MEDIUM
        else:
            return NutrientRating.HIGH

    @staticmethod
    def rate_nitrogen(n: Optional[float]) -> Optional[NutrientRating]:
        """Rate Available Nitrogen (kg/ha)."""
        if n is None:
            return None
        if n < 280.0:
            return NutrientRating.LOW
        elif 280.0 <= n <= 560.0:
            return NutrientRating.MEDIUM
        else:
            return NutrientRating.HIGH

    @staticmethod
    def rate_phosphorus(p: Optional[float]) -> Optional[NutrientRating]:
        """Rate Available Phosphorus P2O5 (kg/ha)."""
        if p is None:
            return None
        if p < 14.0:
            return NutrientRating.LOW
        elif 14.0 <= p <= 28.0:
            return NutrientRating.MEDIUM
        else:
            return NutrientRating.HIGH

    @staticmethod
    def rate_potassium(k: Optional[float]) -> Optional[NutrientRating]:
        """Rate Available Potassium K2O (kg/ha)."""
        if k is None:
            return None
        if k < 150.0:
            return NutrientRating.LOW
        elif 150.0 <= k <= 300.0:
            return NutrientRating.MEDIUM
        else:
            return NutrientRating.HIGH

    def register_field_soil_test(self, submission: FieldSoilTestSubmission) -> FieldSoilTestResponse:
        """Save a farmer soil test submission and return diagnostic ratings."""
        profile_id = f"soil_{uuid.uuid4().hex[:12]}"
        now = datetime.now(timezone.utc)

        with self._connection() as conn:
            conn.execute(
                """
                INSERT INTO field_soil_tests (
                    profile_id, location_id, field_identifier, sampling_date,
                    laboratory_name, test_method, ph, electrical_conductivity_ds_m,
                    organic_carbon_pct, available_nitrogen_kg_ha, available_phosphorus_kg_ha,
                    available_potassium_kg_ha, available_sulphur_ppm, zinc_ppm,
                    iron_ppm, copper_ppm, manganese_ppm, boron_ppm,
                    farmer_notes, registered_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    profile_id,
                    submission.location_id.strip().lower(),
                    submission.field_identifier,
                    submission.sampling_date.isoformat(),
                    submission.laboratory_name,
                    submission.test_method,
                    submission.ph,
                    submission.electrical_conductivity_ds_m,
                    submission.organic_carbon_pct,
                    submission.available_nitrogen_kg_ha,
                    submission.available_phosphorus_kg_ha,
                    submission.available_potassium_kg_ha,
                    submission.available_sulphur_ppm,
                    submission.zinc_ppm,
                    submission.iron_ppm,
                    submission.copper_ppm,
                    submission.manganese_ppm,
                    submission.boron_ppm,
                    submission.farmer_notes,
                    now.isoformat(),
                ),
            )
            conn.commit()

        # Build diagnostic ratings
        ph_class = self.classify_ph(submission.ph)
        salinity = self.classify_ec(submission.electrical_conductivity_ds_m)
        oc_rate = self.rate_organic_carbon(submission.organic_carbon_pct)
        n_rate = self.rate_nitrogen(submission.available_nitrogen_kg_ha)
        p_rate = self.rate_phosphorus(submission.available_phosphorus_kg_ha)
        k_rate = self.rate_potassium(submission.available_potassium_kg_ha)

        ratings: Dict[str, str] = {
            "soil_ph": ph_class,
            "salinity": salinity,
        }
        if oc_rate:
            ratings["organic_carbon"] = oc_rate.value
        if n_rate:
            ratings["available_nitrogen"] = n_rate.value
        if p_rate:
            ratings["available_phosphorus"] = p_rate.value
        if k_rate:
            ratings["available_potassium"] = k_rate.value

        return FieldSoilTestResponse(
            profile_id=profile_id,
            location_id=submission.location_id,
            field_identifier=submission.field_identifier,
            sampling_date=submission.sampling_date,
            laboratory_name=submission.laboratory_name,
            ph=submission.ph,
            ph_rating=ph_class,
            electrical_conductivity_ds_m=submission.electrical_conductivity_ds_m,
            salinity_status=salinity,
            organic_carbon_pct=submission.organic_carbon_pct,
            organic_carbon_rating=oc_rate,
            nitrogen_rating=n_rate,
            phosphorus_rating=p_rate,
            potassium_rating=k_rate,
            nutrient_ratings=ratings,
            source=SoilDataSource.FARMER_LAB_TEST,
            registered_at=now,
        )

    def get_latest_field_test(self, location_id: str) -> Optional[FieldSoilTestResponse]:
        """Retrieve most recent field test for a location if available."""
        with self._connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                SELECT * FROM field_soil_tests
                WHERE location_id = ?
                ORDER BY sampling_date DESC, registered_at DESC
                LIMIT 1
                """,
                (location_id.strip().lower(),),
            )
            row = cursor.fetchone()

        if not row:
            return None

        ph = float(row["ph"])
        ec = float(row["electrical_conductivity_ds_m"]) if row["electrical_conductivity_ds_m"] is not None else None
        oc = float(row["organic_carbon_pct"]) if row["organic_carbon_pct"] is not None else None
        n = float(row["available_nitrogen_kg_ha"]) if row["available_nitrogen_kg_ha"] is not None else None
        p = float(row["available_phosphorus_kg_ha"]) if row["available_phosphorus_kg_ha"] is not None else None
        k = float(row["available_potassium_kg_ha"]) if row["available_potassium_kg_ha"] is not None else None

        ph_class = self.classify_ph(ph)
        salinity = self.classify_ec(ec)
        oc_rate = self.rate_organic_carbon(oc)
        n_rate = self.rate_nitrogen(n)
        p_rate = self.rate_phosphorus(p)
        k_rate = self.rate_potassium(k)

        ratings: Dict[str, str] = {
            "soil_ph": ph_class,
            "salinity": salinity,
        }
        if oc_rate:
            ratings["organic_carbon"] = oc_rate.value
        if n_rate:
            ratings["available_nitrogen"] = n_rate.value
        if p_rate:
            ratings["available_phosphorus"] = p_rate.value
        if k_rate:
            ratings["available_potassium"] = k_rate.value

        return FieldSoilTestResponse(
            profile_id=row["profile_id"],
            location_id=row["location_id"],
            field_identifier=row["field_identifier"],
            sampling_date=datetime.fromisoformat(row["sampling_date"]).date() if "T" in row["sampling_date"] else datetime.strptime(row["sampling_date"], "%Y-%m-%d").date(),
            laboratory_name=row["laboratory_name"],
            ph=ph,
            ph_rating=ph_class,
            electrical_conductivity_ds_m=ec,
            salinity_status=salinity,
            organic_carbon_pct=oc,
            organic_carbon_rating=oc_rate,
            nitrogen_rating=n_rate,
            phosphorus_rating=p_rate,
            potassium_rating=k_rate,
            nutrient_ratings=ratings,
            source=SoilDataSource.FARMER_LAB_TEST,
            registered_at=datetime.fromisoformat(row["registered_at"]),
        )


soil_service = SoilService()
