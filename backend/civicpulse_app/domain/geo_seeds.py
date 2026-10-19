import json
from shapely.geometry import shape, MultiPolygon, Polygon


def get_indore_synthetic_wards():
    """
    Returns synthetic wards for Indore (Palasia, Vijay Nagar, Rajwada, Bhanwarkuan, Sarafa)
    centred around coordinates ~ (75.8577, 22.7196).
    """
    return [
        {
            "zone_number": 1,
            "zone_name": "Central Zone",
            "ward_number": 1,
            "ward_name": "Rajwada Heritage Ward",
            "coordinates": [
                [
                    [75.845, 22.710],
                    [75.860, 22.710],
                    [75.860, 22.725],
                    [75.845, 22.725],
                    [75.845, 22.710],
                ]
            ],
        },
        {
            "zone_number": 1,
            "zone_name": "Central Zone",
            "ward_number": 2,
            "ward_name": "Sarafa Night Bazaar Ward",
            "coordinates": [
                [
                    [75.860, 22.710],
                    [75.875, 22.710],
                    [75.875, 22.725],
                    [75.860, 22.725],
                    [75.860, 22.710],
                ]
            ],
        },
        {
            "zone_number": 2,
            "zone_name": "East Zone",
            "ward_number": 3,
            "ward_name": "Old Palasia Ward",
            "coordinates": [
                [
                    [75.875, 22.710],
                    [75.895, 22.710],
                    [75.895, 22.725],
                    [75.875, 22.725],
                    [75.875, 22.710],
                ]
            ],
        },
        {
            "zone_number": 2,
            "zone_name": "East Zone",
            "ward_number": 4,
            "ward_name": "Vijay Nagar Tech Hub Ward",
            "coordinates": [
                [
                    [75.875, 22.725],
                    [75.905, 22.725],
                    [75.905, 22.755],
                    [75.875, 22.755],
                    [75.875, 22.725],
                ]
            ],
        },
        {
            "zone_number": 3,
            "zone_name": "South Zone",
            "ward_number": 5,
            "ward_name": "Bhanwarkuan Student Hub Ward",
            "coordinates": [
                [
                    [75.845, 22.685],
                    [75.875, 22.685],
                    [75.875, 22.710],
                    [75.845, 22.710],
                    [75.845, 22.685],
                ]
            ],
        },
    ]
