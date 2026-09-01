from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from app.core.database import get_database
from app.core.security import get_password_hash, verify_password, create_access_token, oauth2_scheme, decode_access_token
from app.models.user import UserInDB, UserRole
from app.schemas.user import UserSignup, UserLogin, UserResponse, TokenResponse

router = APIRouter()

@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED, summary="Register a new Citizen or Authority Admin user")
async def signup(payload: UserSignup, db: AsyncIOMotorDatabase = Depends(get_database)):
    # Check existing user
    existing = await db.users.find_one({"email": payload.email.lower()})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )
    
    hashed_pwd = get_password_hash(payload.password)
    from datetime import datetime, timezone
    user_doc = {
        "email": payload.email.lower(),
        "full_name": payload.full_name,
        "hashed_password": hashed_pwd,
        "role": payload.role.value,
        "department": payload.department if payload.role == UserRole.AUTHORITY_ADMIN else None,
        "created_at": datetime.now(timezone.utc)
    }

    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)

    user_resp = UserResponse(
        id=user_id,
        email=user_doc["email"],
        full_name=user_doc["full_name"],
        role=UserRole(user_doc["role"]),
        department=user_doc["department"],
        created_at=user_doc["created_at"]
    )

    token = create_access_token(data={"sub": user_id, "email": user_doc["email"], "role": user_doc["role"]})
    return TokenResponse(access_token=token, token_type="bearer", user=user_resp)

@router.post("/login", response_model=TokenResponse, summary="Authenticate user and obtain JWT access token")
async def login(payload: UserLogin, db: AsyncIOMotorDatabase = Depends(get_database)):
    user = await db.users.find_one({"email": payload.email.lower()})
    if not user or not verify_password(payload.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email address or password."
        )
    
    user_id = str(user["_id"])
    user_resp = UserResponse(
        id=user_id,
        email=user["email"],
        full_name=user["full_name"],
        role=UserRole(user["role"]),
        department=user.get("department"),
        created_at=user["created_at"]
    )

    token = create_access_token(data={"sub": user_id, "email": user["email"], "role": user["role"]})
    return TokenResponse(access_token=token, token_type="bearer", user=user_resp)

@router.get("/me", response_model=UserResponse, summary="Get current logged-in user profile")
async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication token required.")
    
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token.")
    
    user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User account not found.")
    
    return UserResponse(
        id=str(user["_id"]),
        email=user["email"],
        full_name=user["full_name"],
        role=UserRole(user["role"]),
        department=user.get("department"),
        created_at=user["created_at"]
    )
