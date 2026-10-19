import pytest
from civicpulse_app.ai.detector import UltralyticsYoloDetectorProvider, MockYoloDetectorProvider
from civicpulse_app.ai.embedder import ClipEmbeddingService


@pytest.mark.asyncio
async def test_ultralytics_yolo_fallback_behavior():
    detector = UltralyticsYoloDetectorProvider()
    res = await detector.detect("manhole_test.jpg")

    assert res.primary_category == "Open_Manhole"
    assert res.confidence >= 0.90
    assert "yolov8" in res.model_version


def test_clip_embedding_dimension_and_normalization():
    embedder = ClipEmbeddingService()
    vec = embedder.compute_embedding("sample_before_image_content")

    assert len(vec) == 512
    # Verify vector norm ≈ 1.0 (unit vector)
    norm = sum(x * x for x in vec) ** 0.5
    assert abs(norm - 1.0) < 1e-4


def test_clip_cosine_similarity():
    embedder = ClipEmbeddingService()
    vec1 = embedder.compute_embedding("same_location_photo_angle_1")
    vec2 = embedder.compute_embedding("same_location_photo_angle_1")
    vec3 = embedder.compute_embedding("completely_different_scene_999")

    # Identical vector similarity must be 1.0
    sim_identical = embedder.cosine_similarity(vec1, vec2)
    assert abs(sim_identical - 1.0) < 1e-4

    # Different vector similarity
    sim_different = embedder.cosine_similarity(vec1, vec3)
    assert 0.0 <= sim_different < 1.0
