from fastapi import APIRouter, Cookie, Depends, HTTPException, Response, status
from sqlalchemy import or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.core.config import get_settings
from app.core.database import get_db
from app.core.security import create_access_token, decode_access_token, hash_password, verify_password
from app.models.user import User
from app.schemas.auth import UserCreate, UserLogin, UserRead
from app.services.audit import create_audit_log


router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def register(payload: UserCreate, db: Session = Depends(get_db)) -> User:
    existing_user = db.scalar(
        select(User).where(
            or_(
                User.email == payload.email,
                User.cpf == payload.cpf if payload.cpf else False,
            )
        )
    )
    if existing_user is not None:
        detail = "Email ja cadastrado"
        if payload.cpf and existing_user.cpf == payload.cpf:
            detail = "CPF ja cadastrado"
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=detail,
        )

    user = User(
        full_name=payload.full_name,
        email=str(payload.email),
        cpf=payload.cpf,
        password_hash=hash_password(payload.password),
    )
    db.add(user)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email ou CPF ja cadastrado",
        ) from exc
    db.refresh(user)
    return user


@router.post("/login", response_model=UserRead)
def login(payload: UserLogin, response: Response, db: Session = Depends(get_db)) -> User:
    user = db.scalar(select(User).where(User.email == payload.email))
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciais invalidas",
        )

    access_token = create_access_token(str(user.id))
    settings = get_settings()
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        samesite=settings.cookie_samesite,
        secure=settings.cookie_secure,
        max_age=settings.jwt_expires_minutes * 60,
    )
    create_audit_log(db, action="login", entity="user", entity_id=user.id, user_id=user.id)
    db.commit()
    return user


@router.get("/me", response_model=UserRead)
def read_me(current_user: User = Depends(get_current_user)) -> User:
    return current_user


@router.get("/session")
def read_session(
    access_token: str | None = Cookie(default=None),
    db: Session = Depends(get_db),
) -> dict:
    if access_token is None:
        return {"user": None}

    try:
        user_id = int(decode_access_token(access_token))
    except ValueError:
        return {"user": None}

    user = db.get(User, user_id)
    if user is None:
        return {"user": None}

    return {"user": UserRead.model_validate(user).model_dump(mode="json")}
