"""Authentication and role enforcement for VAANI operator APIs."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from .config import settings

_bearer = HTTPBearer(auto_error=False)


@dataclass(frozen=True)
class Principal:
    sub: str
    email: str | None
    name: str | None
    role: str
    claims: dict[str, Any]

    @property
    def is_operator(self) -> bool:
        return self.role in {"operator", "admin"}

    def as_dict(self) -> dict[str, Any]:
        return {
            "sub": self.sub,
            "email": self.email,
            "name": self.name,
            "role": self.role,
        }


def _role_for_email(email: str | None) -> str:
    if not email:
        return "viewer"
    normalized = email.lower().strip()
    domain = normalized.rsplit("@", 1)[-1] if "@" in normalized else ""
    if normalized in settings.operator_emails or domain in settings.operator_domains:
        return "operator"
    return "viewer"


def _verify_google_token(token: str) -> Principal:
    if settings.ALLOW_DEV_AUTH and token == settings.DEV_OPERATOR_TOKEN:
        return Principal(
            sub="local-dev-operator",
            email="local-operator@localhost",
            name="Local Operator",
            role="operator",
            claims={"iss": "local", "aud": "local"},
        )

    if not settings.GOOGLE_OAUTH_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google login is not configured",
        )

    try:
        from google.auth.transport import requests as google_requests
        from google.oauth2 import id_token

        claims = id_token.verify_oauth2_token(
            token,
            google_requests.Request(),
            audience=settings.GOOGLE_OAUTH_CLIENT_ID,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google ID token",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc

    issuer = claims.get("iss")
    if issuer not in {"accounts.google.com", "https://accounts.google.com"}:
        raise HTTPException(status_code=401, detail="Invalid token issuer")
    if claims.get("email_verified") is False:
        raise HTTPException(status_code=403, detail="Verified Google account required")

    email = claims.get("email")
    return Principal(
        sub=str(claims["sub"]),
        email=str(email) if email else None,
        name=claims.get("name"),
        role=_role_for_email(email),
        claims=claims,
    )


def get_current_principal(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
) -> Principal:
    """Return a viewer principal for public reads, or verify a supplied token."""
    if not credentials:
        return Principal(sub="anonymous", email=None, name=None, role="viewer", claims={})
    return _verify_google_token(credentials.credentials)


def require_pubsub_identity(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
) -> dict[str, Any]:
    """Verify the service-account OIDC token attached to a Pub/Sub push."""
    if not credentials and settings.ENVIRONMENT.lower() in {"development", "test"}:
        return {"sub": "local-pubsub", "email": "local-pubsub"}
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Pub/Sub service identity required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not settings.PUBSUB_PUSH_AUDIENCE or not settings.PUBSUB_PUSH_SERVICE_ACCOUNT_EMAIL:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Pub/Sub identity is not configured")

    try:
        from google.auth.transport import requests as google_requests
        from google.oauth2 import id_token

        claims = id_token.verify_token(
            credentials.credentials,
            google_requests.Request(),
            audience=settings.PUBSUB_PUSH_AUDIENCE,
        )
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Pub/Sub OIDC token") from exc

    expected_email = settings.PUBSUB_PUSH_SERVICE_ACCOUNT_EMAIL.lower().strip()
    token_email = str(claims.get("email", "")).lower().strip()
    if token_email != expected_email:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unexpected Pub/Sub service identity")
    return {"sub": str(claims.get("sub", "")), "email": token_email}


def require_operator(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
) -> Principal:
    """Require an authenticated, allowlisted operator/admin identity."""
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Operator authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    principal = _verify_google_token(credentials.credentials)
    if not principal.is_operator:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Operator role required")
    return principal
