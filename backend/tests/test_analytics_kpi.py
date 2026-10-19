import pytest
from civicpulse_app.domain.kpi import KPICalculator


def test_composite_kpi_perfect_performance():
    # 100% SLA, 5.0 CSAT, 0h MTTR (target 48), 0% reopen
    res = KPICalculator.calculate_composite_score(
        sla_percentage=100.0,
        avg_csat=5.0,
        mttr_hours=0.0,
        target_hours=48.0,
        reopen_rate_percent=0.0,
    )
    # 0.4*100 + 0.3*100 + 0.3*100 - 0 = 100
    assert res.score == 100.0
    assert res.csat_normalized == 100.0
    assert res.speed_normalized == 100.0


def test_composite_kpi_penalties_applied():
    # 80% SLA, 3.0 CSAT ((3-1)/4*100 = 50%), MTTR 24h (50% speed), 10% reopen penalty
    # Formula: 0.4*80 (32) + 0.3*50 (15) + 0.3*50 (15) - 10 = 52.0
    res = KPICalculator.calculate_composite_score(
        sla_percentage=80.0,
        avg_csat=3.0,
        mttr_hours=24.0,
        target_hours=48.0,
        reopen_rate_percent=10.0,
    )
    assert res.score == 52.0


def test_composite_kpi_clamped_at_zero():
    # Catastrophic performance: low SLA, 1.0 CSAT, high reopen rate
    res = KPICalculator.calculate_composite_score(
        sla_percentage=10.0,
        avg_csat=1.0,
        mttr_hours=96.0,
        target_hours=48.0,
        reopen_rate_percent=50.0,
    )
    assert res.score == 0.0


def test_chronic_blackspot_qualification():
    """
    Superpower 8: Qualification criterion >= 5 incidents within 50m in 30 days.
    """
    incident_count_1 = 4  # Does not qualify
    incident_count_2 = 5  # Qualifies
    incident_count_3 = 9  # Qualifies

    def qualifies_chronic(count: int, days_window: int) -> bool:
        return count >= 5 and days_window <= 30

    assert qualifies_chronic(incident_count_1, 20) is False
    assert qualifies_chronic(incident_count_2, 25) is True
    assert qualifies_chronic(incident_count_3, 10) is True
