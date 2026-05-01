from app.services.audit import sanitize_metadata


def test_audit_metadata_redacts_sensitive_values():
    metadata = {
        "cpf": "12345678900",
        "password": "secret",
        "token": "jwt",
        "nested": {"password_hash": "hash", "Authorization": "Bearer jwt"},
        "items": [{"cookie": "access_token=jwt", "name": "Produto"}],
        "customer_name": "Cliente Teste",
    }

    assert sanitize_metadata(metadata) == {
        "cpf": "***",
        "password": "***",
        "token": "***",
        "nested": {"password_hash": "***", "Authorization": "***"},
        "items": [{"cookie": "***", "name": "Produto"}],
        "customer_name": "Cliente Teste",
    }
