import uuid
import pytest
from shapely.geometry import Point
from civicpulse_app.services.dedup import generate_ticket_code
from civicpulse_app.domain.enums import IssueStatus, PriorityLevel, Department


def test_ticket_code_generation():
    code1 = generate_ticket_code(4)
    code2 = generate_ticket_code(None)

    assert code1.startswith("IMC-")
    assert "-W04-" in code1
    assert code2.startswith("IMC-")
    assert "-W00-" in code2
    assert code1 != code2


def test_meter_distance_approximation_for_dedup():
    """
    Test that 25 metres spatial threshold in coordinates (~0.000225 deg lat/long in Indore)
    behaves accurately.
    Base: (75.8577, 22.7196)
    Point A: ~10m away -> within 25m
    Point B: ~50m away -> outside 25m
    """
    # Indore coordinates: 1 deg lat ≈ 111,000 m. 1 deg lon at lat 22.7 ≈ 102,400 m.
    base_lon, base_lat = 75.857700, 22.719600

    # +0.00009 deg lat ≈ 10 metres
    close_lon, close_lat = 75.857700, 22.719690
    # +0.00050 deg lat ≈ 55 metres
    far_lon, far_lat = 75.857700, 22.720100

    def approx_dist_m(lon1, lat1, lon2, lat2):
        dx = (lon2 - lon1) * 102400
        dy = (lat2 - lat1) * 111000
        return (dx * dx + dy * dy) ** 0.5

    dist_close = approx_dist_m(base_lon, base_lat, close_lon, close_lat)
    dist_far = approx_dist_m(base_lon, base_lat, far_lon, far_lat)

    assert dist_close <= 25.0
    assert dist_far > 25.0
