import json
import urllib.error

import pytest

from backend.core.config import settings
from backend.services.flow import llm_extraction

ALLOWED_KEYS = {
    "temperature_c",
    "pulse_bpm",
    "respiratory_rate",
    "oxygen_saturation",
    "capillary_refill_seconds",
    "systolic_bp",
    "diastolic_bp",
    "avpu",
    "severe_pallor",
    "reported_symptoms",
    "symptom_summary",
}


class FakeResponse:
    def __init__(self, body: bytes):
        self.body = body

    def __enter__(self):
        return self

    def __exit__(self, *_args):
        return None

    def read(self) -> bytes:
        return self.body


@pytest.fixture
def configured_router(monkeypatch):
    monkeypatch.setattr(settings, "AGENTROUTER_API_KEY", "unit-test-key")
    monkeypatch.setattr(settings, "AGENTROUTER_BASE_URL", "https://provider.test/v1")
    monkeypatch.setattr(settings, "AGENTROUTER_MODEL", "test-observation-model")
    monkeypatch.setattr(settings, "AGENTROUTER_TIMEOUT_SECONDS", 7)


def patch_provider(monkeypatch, response_body: bytes, captured: list | None = None):
    def fake_urlopen(request, timeout):
        if captured is not None:
            captured.append((request, timeout))
        return FakeResponse(response_body)

    monkeypatch.setattr(llm_extraction.urllib.request, "urlopen", fake_urlopen)


def provider_body(content: str) -> bytes:
    return json.dumps(
        {"choices": [{"message": {"content": content}}]}
    ).encode("utf-8")


def test_valid_clinical_text_builds_request_and_returns_observation_fields(
    monkeypatch, configured_router
):
    captured = []
    patch_provider(
        monkeypatch,
        provider_body(
            '{"temperature_c": 39.2, "pulse_bpm": 112, '
            '"reported_symptoms": "fever and cough"}'
        ),
        captured,
    )

    result = llm_extraction.extract_observation_fields(
        "Fever of 39.2 C, pulse 112, cough since yesterday."
    )

    request, timeout = captured[0]
    payload = json.loads(request.data.decode("utf-8"))
    assert request.full_url == "https://provider.test/v1/chat/completions"
    assert request.get_method() == "POST"
    assert request.get_header("Authorization") == "Bearer unit-test-key"
    assert request.get_header("Content-type") == "application/json"
    assert timeout == 7
    assert payload["model"] == "test-observation-model"
    assert payload["temperature"] == 0.0
    assert payload["messages"][1]["content"] == (
        "Fever of 39.2 C, pulse 112, cough since yesterday."
    )
    assert "Do not diagnose" in payload["messages"][0]["content"]
    assert "Do not assign priority" in payload["messages"][0]["content"]
    assert result == {
        "temperature_c": 39.2,
        "pulse_bpm": 112,
        "reported_symptoms": "fever and cough",
    }


def test_filters_unexpected_fields_from_provider_json(monkeypatch, configured_router):
    patch_provider(
        monkeypatch,
        provider_body(
            '{"pulse_bpm": 72, "diagnosis": "flu", "priority": "urgent", '
            '"recommended_action": "transfer"}'
        ),
    )

    result = llm_extraction.extract_observation_fields("Patient pulse is 72.")

    assert result == {"pulse_bpm": 72}
    assert set(result).issubset(ALLOWED_KEYS)


def test_partial_extraction_returns_only_supplied_observation_fields(
    monkeypatch, configured_router
):
    patch_provider(monkeypatch, provider_body('{"oxygen_saturation": 97}'))

    result = llm_extraction.extract_observation_fields("Oxygen saturation was 97%.")

    assert result == {"oxygen_saturation": 97}
    assert "temperature_c" not in result
    assert "pulse_bpm" not in result


@pytest.mark.parametrize("text", ["", "   "])
def test_empty_or_whitespace_input_is_forwarded_without_local_validation(
    monkeypatch, configured_router, text
):
    captured = []
    patch_provider(monkeypatch, provider_body("{}"), captured)

    result = llm_extraction.extract_observation_fields(text)

    payload = json.loads(captured[0][0].data.decode("utf-8"))
    assert payload["messages"][1]["content"] == text
    assert result == {}


def test_operational_question_is_forwarded_and_not_interpreted_locally(
    monkeypatch, configured_router
):
    captured = []
    patch_provider(
        monkeypatch,
        provider_body('{"reported_symptoms": "6 patients are waiting"}'),
        captured,
    )
    query = "How many patients are waiting?"

    result = llm_extraction.extract_observation_fields(query)

    payload = json.loads(captured[0][0].data.decode("utf-8"))
    assert payload["messages"][1]["content"] == query
    # The function filters keys only; it does not classify the query as operational.
    assert result == {"reported_symptoms": "6 patients are waiting"}


def test_base_url_without_v1_gets_openai_compatible_path(
    monkeypatch, configured_router
):
    monkeypatch.setattr(settings, "AGENTROUTER_BASE_URL", "https://provider.test/")
    captured = []
    patch_provider(monkeypatch, provider_body("{}"), captured)

    llm_extraction.extract_observation_fields("synthetic input")

    assert captured[0][0].full_url == "https://provider.test/v1/chat/completions"


def test_missing_api_key_raises_before_making_request(monkeypatch, configured_router):
    monkeypatch.setattr(settings, "AGENTROUTER_API_KEY", "")

    def unexpected_request(*_args, **_kwargs):
        pytest.fail("urlopen must not be called without an API key")

    monkeypatch.setattr(llm_extraction.urllib.request, "urlopen", unexpected_request)

    with pytest.raises(RuntimeError, match="AGENTROUTER_API_KEY is not configured"):
        llm_extraction.extract_observation_fields("synthetic input")


@pytest.mark.parametrize("status_code", [401, 403, 429, 500])
def test_http_error_is_wrapped_as_provider_request_failure(
    monkeypatch, configured_router, status_code
):
    error = urllib.error.HTTPError(
        "https://provider.test/v1/chat/completions",
        status_code,
        "Upstream error",
        {},
        None,
    )

    def raise_http_error(*_args, **_kwargs):
        raise error

    monkeypatch.setattr(
        llm_extraction.urllib.request,
        "urlopen",
        raise_http_error,
    )

    with pytest.raises(RuntimeError, match="AgentRouter request failed") as caught:
        llm_extraction.extract_observation_fields("synthetic input")

    assert isinstance(caught.value.__cause__, urllib.error.HTTPError)
    assert caught.value.__cause__.code == status_code


def test_provider_unavailable_error_is_wrapped(monkeypatch, configured_router):
    error = urllib.error.URLError("provider unavailable")
    monkeypatch.setattr(
        llm_extraction.urllib.request, "urlopen", lambda *_args, **_kwargs: (_ for _ in ()).throw(error)
    )

    with pytest.raises(RuntimeError, match="AgentRouter request failed") as caught:
        llm_extraction.extract_observation_fields("synthetic input")

    assert caught.value.__cause__ is error


def test_timeout_is_wrapped(monkeypatch, configured_router):
    monkeypatch.setattr(
        llm_extraction.urllib.request,
        "urlopen",
        lambda *_args, **_kwargs: (_ for _ in ()).throw(TimeoutError("timed out")),
    )

    with pytest.raises(RuntimeError, match="AgentRouter request failed") as caught:
        llm_extraction.extract_observation_fields("synthetic input")

    assert isinstance(caught.value.__cause__, TimeoutError)


def test_invalid_upstream_json_is_not_wrapped(monkeypatch, configured_router):
    patch_provider(monkeypatch, b"not-json")

    with pytest.raises(json.JSONDecodeError):
        llm_extraction.extract_observation_fields("synthetic input")


def test_missing_response_fields_propagate_key_error(monkeypatch, configured_router):
    patch_provider(monkeypatch, json.dumps({"choices": []}).encode("utf-8"))

    with pytest.raises(IndexError):
        llm_extraction.extract_observation_fields("synthetic input")


def test_response_without_json_object_raises_value_error(monkeypatch, configured_router):
    patch_provider(monkeypatch, provider_body("No structured observation was found."))

    with pytest.raises(ValueError, match="Model did not return a JSON object"):
        llm_extraction.extract_observation_fields("synthetic input")


def test_allowed_field_values_are_not_type_validated(monkeypatch, configured_router):
    patch_provider(
        monkeypatch,
        provider_body('{"pulse_bpm": "seventy-two", "severe_pallor": "unknown"}'),
    )

    result = llm_extraction.extract_observation_fields("Pulse and pallor were not recorded.")

    assert result == {"pulse_bpm": "seventy-two", "severe_pallor": "unknown"}
    assert set(result).issubset(ALLOWED_KEYS)
    # The function preserves provider values; it does not enforce schema types.
    assert isinstance(result["pulse_bpm"], str)
