import uuid
import pytest
from shapely.geometry import Polygon, MultiPolygon, Point
from civicpulse_app.core.security import create_access_token, decode_token
from civicpulse_app.domain.geo_seeds import get_indore_synthetic_wards
from civicpulse_app.domain.enums import UserRole


def test_jwt_token_creation_and_decoding():
    user_id = str(uuid.uuid4())
    role = UserRole.FIELD_INSPECTOR.value
    token = create_access_token(user_id, role)
    payload = decode_token(token)

    assert payload["sub"] == user_id
    assert payload["role"] == role
    assert payload["type"] == "access"


def test_synthetic_ward_polygon_containment():
    """
    Test spatial containment logic with shapely geometries simulating ST_Covers.
    Point at Rajwada Indore: (75.850, 22.715) should be covered by Ward 1 (Rajwada).
    Point at Vijay Nagar: (75.890, 22.740) should be covered by Ward 4.
    """
    wards = get_indore_synthetic_wards()
    ward_polys = []
    for w in wards:
        poly = Polygon(w["coordinates"][0])
        ward_polys.append((w["ward_number"], w["ward_name"], poly))

    # Point 1: Rajwada
    pt_rajwada = Point(75.850, 22.715)
    matched_ward = None
    for ward_num, name, poly in ward_polys:
        if poly.covers(pt_rajwada):
            matched_ward = ward_num
            break
    assert matched_ward == 1

    # Point 2: Vijay Nagar
    pt_vijaynagar = Point(75.890, 22.740)
    matched_ward = None
    for ward_num, name, poly in ward_polys:
        if poly.covers(pt_vijaynagar):
            matched_ward = ward_num
            break
    assert matched_ward == 4

    # Point 3: Exact boundary point between Ward 1 and Ward 2 (lng 75.860, lat 22.715)
    # covers should return True for the boundary
    pt_boundary = Point(75.860, 22.715)
    boundary_covers = [wnum for wnum, _, poly in ward_polys if poly.covers(pt_boundary)]
    assert len(boundary_covers) >= 1  # Boundary is covered by at least one adjacent ward
