import os
import shutil
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import FastAPI, Depends, HTTPException, status, File, UploadFile, Form, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.security import OAuth2PasswordBearer
from passlib.context import CryptContext
# IMPORTANT: Make sure you have python-jose installed, NOT jose
# If you get syntax errors, run: pip uninstall jose && pip install python-jose[cryptography]
try:
    from jose import jwt
except SyntaxError:
    # If you get here, you have the wrong 'jose' package installed
    # Run: pip uninstall jose && pip install python-jose[cryptography]
    raise ImportError(
        "Wrong 'jose' package detected. Please run: pip uninstall jose && pip install python-jose[cryptography]"
    )

# JWTError is not used in this code, but if needed:
JWTError = Exception  # Simple fallback
from pydantic import BaseModel
from sqlalchemy.orm import Session

try:
    from .models import SessionLocal, User, Service, Booking, Review
except ImportError:
    from models import SessionLocal, User, Service, Booking, Review

# --- CONFIGURATION ---
SECRET_KEY = "super-secret-key-change-this-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours
UPLOAD_DIR = "uploads"

# Ensure upload directory exists
os.makedirs(UPLOAD_DIR, exist_ok=True)

# --- PYDANTIC SCHEMAS (Request/Response) ---
class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    avatar_url: Optional[str] = None
    
    class Config:
        from_attributes = True

class LoginRequest(BaseModel):
    email: str
    password: str
    user_type: str = "user"

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    role: str

class BookingCreate(BaseModel):
    service_id: str
    user_id: str
    booking_date: str

class BookingStatusUpdate(BaseModel):
    status: str

class ReviewCreate(BaseModel):
    service_id: str
    user_id: str
    rating: int
    comment: str

# --- AUTH UTILS ---
try:
    import bcrypt  # noqa: F401

    hash_schemes = ["bcrypt", "pbkdf2_sha256"]
    default_scheme = "bcrypt"
except ImportError:
    hash_schemes = ["pbkdf2_sha256"]
    default_scheme = "pbkdf2_sha256"
    print(
        "Warning: 'bcrypt' package not available. Falling back to PBKDF2 hashes. "
        "Install 'bcrypt' for stronger security."
    )

pwd_context = CryptContext(schemes=hash_schemes, default=default_scheme, deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- API ---
app = FastAPI()

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    import traceback
    print(f"Unhandled exception: {exc}")
    print(traceback.format_exc())
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal server error: {str(exc)}"}
    )

# CORS: Allow frontend to communicate
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, replace with ["http://localhost:3000"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded images statically
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# --- HEALTH CHECK ENDPOINT ---
@app.get("/health")
def health_check():
    """Health check endpoint for frontend to verify backend is running"""
    return {"status": "ok", "message": "Backend is running"}

# --- AUTH ENDPOINTS ---

@app.post("/register")
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    try:
        # Check if user exists
        if db.query(User).filter(User.email == req.email).first():
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Create User
        new_user = User(
            name=req.name,
            email=req.email,
            hashed_password=get_password_hash(req.password),
            role=req.role.upper(),
            avatar_url=f"https://ui-avatars.com/api/?name={req.name.replace(' ', '+')}"
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        token = create_access_token({"sub": new_user.email, "id": new_user.id})
        return {
            "token": token,
            "user": {
                "id": new_user.id,
                "name": new_user.name,
                "email": new_user.email,
                "role": new_user.role,
                "avatar_url": new_user.avatar_url
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")

@app.post("/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    try:
        user = db.query(User).filter(User.email == req.email).first()
        if not user or not verify_password(req.password, user.hashed_password):
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        token = create_access_token({"sub": user.email, "id": user.id})
        return {
            "token": token,
            "user": {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "role": user.role,
                "avatar_url": user.avatar_url
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Login failed: {str(e)}")

# --- SERVICE ENDPOINTS ---

@app.get("/services")
def get_services(
    q: Optional[str] = None, 
    category: Optional[str] = None, 
    location: Optional[str] = None, 
    db: Session = Depends(get_db)
):
    try:
        query = db.query(Service)
        
        if category and category != "All":
            query = query.filter(Service.category == category)
        if location:
            query = query.filter(Service.location.ilike(f"%{location}%"))
        if q:
            search = f"%{q}%"
            query = query.filter((Service.title.ilike(search)) | (Service.description.ilike(search)))
            
        services = query.all()
        
        # Transform to match frontend expectations
        results = []
        for s in services:
            try:
                provider_name = s.provider.name if s.provider else "Unknown"
            except:
                provider_name = "Unknown"
            
            results.append({
                "id": s.id,
                "provider_id": s.provider_id,
                "provider_name": provider_name,
                "title": s.title or "",
                "description": s.description or "",
                "category": s.category or "",
                "location": s.location or "",
                "price": float(s.price) if s.price else 0.0,
                "image_url": s.image_url or "",
                "rating": float(s.rating) if s.rating else 0.0,
                "review_count": int(s.review_count) if s.review_count else 0
            })
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch services: {str(e)}")

@app.get("/services/{service_id}")
def get_service_by_id(service_id: int, db: Session = Depends(get_db)):
    try:
        s = db.query(Service).filter(Service.id == service_id).first()
        if not s:
            raise HTTPException(status_code=404, detail="Service not found")
        
        try:
            provider_name = s.provider.name if s.provider else "Unknown"
        except:
            provider_name = "Unknown"
        
        return {
            "id": s.id,
            "provider_id": s.provider_id,
            "provider_name": provider_name,
            "title": s.title or "",
            "description": s.description or "",
            "category": s.category or "",
            "location": s.location or "",
            "price": float(s.price) if s.price else 0.0,
            "image_url": s.image_url or "",
            "rating": float(s.rating) if s.rating else 0.0,
            "review_count": int(s.review_count) if s.review_count else 0
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch service: {str(e)}")

@app.get("/services/provider/{provider_id}")
def get_provider_services(provider_id: int, db: Session = Depends(get_db)):
    try:
        services = db.query(Service).filter(Service.provider_id == provider_id).all()
        results = []
        for s in services:
            try:
                provider_name = s.provider.name if s.provider else "Unknown"
            except:
                provider_name = "Unknown"
            
            results.append({
                "id": s.id,
                "provider_id": s.provider_id,
                "provider_name": provider_name,
                "title": s.title or "",
                "description": s.description or "",
                "category": s.category or "",
                "location": s.location or "",
                "price": float(s.price) if s.price else 0.0,
                "image_url": s.image_url or "",
                "rating": float(s.rating) if s.rating else 0.0,
                "review_count": int(s.review_count) if s.review_count else 0
            })
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch provider services: {str(e)}")

@app.post("/services")
async def create_service(
    provider_id: str = Form(...),
    title: str = Form(...),
    description: str = Form(...),
    category: str = Form(...),
    location: str = Form(...),
    price: str = Form(...),
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    try:
        # Handle Image Upload
        image_url = "https://via.placeholder.com/400"
        if image and image.filename:
            try:
                file_extension = image.filename.split(".")[-1] if "." in image.filename else "jpg"
                file_name = f"{uuid.uuid4()}.{file_extension}"
                file_path = os.path.join(UPLOAD_DIR, file_name)
                with open(file_path, "wb") as buffer:
                    shutil.copyfileobj(image.file, buffer)
                # Assuming server runs on localhost:8000
                image_url = f"http://localhost:8000/uploads/{file_name}"
            except Exception as e:
                # If image upload fails, use placeholder
                pass

        new_service = Service(
            provider_id=int(provider_id),
            title=title,
            description=description,
            category=category,
            location=location,
            price=float(price),
            image_url=image_url
        )
        db.add(new_service)
        db.commit()
        db.refresh(new_service)
        
        try:
            provider_name = new_service.provider.name if new_service.provider else "Unknown"
        except:
            provider_name = "Unknown"
        
        # Return matched format
        return {
            "id": new_service.id,
            "provider_id": new_service.provider_id,
            "provider_name": provider_name,
            "title": new_service.title or "",
            "description": new_service.description or "",
            "category": new_service.category or "",
            "location": new_service.location or "",
            "price": float(new_service.price) if new_service.price else 0.0,
            "image_url": new_service.image_url or "",
            "rating": float(new_service.rating) if new_service.rating else 0.0,
            "review_count": int(new_service.review_count) if new_service.review_count else 0
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create service: {str(e)}")

@app.put("/services/{service_id}")
async def update_service(
    service_id: int,
    title: str = Form(...),
    description: str = Form(...),
    category: str = Form(...),
    location: str = Form(...),
    price: str = Form(...),
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    try:
        service = db.query(Service).filter(Service.id == service_id).first()
        if not service:
            raise HTTPException(status_code=404, detail="Service not found")

        # Update Text Fields
        service.title = title
        service.description = description
        service.category = category
        service.location = location
        service.price = float(price)

        # Handle Image Update only if provided
        if image and image.filename:
            try:
                file_extension = image.filename.split(".")[-1] if "." in image.filename else "jpg"
                file_name = f"{uuid.uuid4()}.{file_extension}"
                file_path = os.path.join(UPLOAD_DIR, file_name)
                with open(file_path, "wb") as buffer:
                    shutil.copyfileobj(image.file, buffer)
                service.image_url = f"http://localhost:8000/uploads/{file_name}"
            except Exception as e:
                # If image upload fails, continue without updating image
                pass
        
        db.commit()
        db.refresh(service)

        try:
            provider_name = service.provider.name if service.provider else "Unknown"
        except:
            provider_name = "Unknown"

        return {
            "id": service.id,
            "provider_id": service.provider_id,
            "provider_name": provider_name,
            "title": service.title or "",
            "description": service.description or "",
            "category": service.category or "",
            "location": service.location or "",
            "price": float(service.price) if service.price else 0.0,
            "image_url": service.image_url or "",
            "rating": float(service.rating) if service.rating else 0.0,
            "review_count": int(service.review_count) if service.review_count else 0
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update service: {str(e)}")

# --- BOOKING ENDPOINTS ---

@app.post("/bookings")
def create_booking(req: BookingCreate, db: Session = Depends(get_db)):
    try:
        new_booking = Booking(
            service_id=int(req.service_id),
            user_id=int(req.user_id),
            booking_date=req.booking_date,
            status="Pending"
        )
        db.add(new_booking)
        db.commit()
        return {"message": "Booking created"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create booking: {str(e)}")

def serialize_booking(booking: Booking):
    try:
        service_title = booking.service.title if booking.service else "Unknown Service"
        service_image = booking.service.image_url if booking.service else ""
        price = float(booking.service.price) if booking.service and booking.service.price else 0.0
    except Exception:
        service_title = "Unknown Service"
        service_image = ""
        price = 0.0

    try:
        user_name = booking.user.name if booking.user else "Unknown User"
        user_email = booking.user.email if booking.user else ""
        user_avatar = booking.user.avatar_url if booking.user else ""
    except Exception:
        user_name = "Unknown User"
        user_email = ""
        user_avatar = ""

    return {
        "id": booking.id,
        "service_id": booking.service_id,
        "user_id": booking.user_id,
        "service_title": service_title,
        "service_image": service_image,
        "status": booking.status or "Pending",
        "booking_date": booking.booking_date or "",
        "price": price,
        "user_name": user_name,
        "user_email": user_email,
        "user_avatar": user_avatar
    }

@app.get("/bookings/user/{user_id}")
def get_user_bookings(user_id: int, db: Session = Depends(get_db)):
    try:
        bookings = db.query(Booking).filter(Booking.user_id == user_id).all()
        return [serialize_booking(b) for b in bookings]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch bookings: {str(e)}")

@app.get("/bookings/provider/{provider_id}")
def get_provider_bookings(provider_id: int, db: Session = Depends(get_db)):
    try:
        bookings = (
            db.query(Booking)
            .join(Service, Booking.service_id == Service.id)
            .filter(Service.provider_id == provider_id)
            .all()
        )
        return [serialize_booking(b) for b in bookings]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch provider bookings: {str(e)}")

@app.put("/bookings/{booking_id}/status")
def update_booking_status(
    booking_id: int, req: BookingStatusUpdate, db: Session = Depends(get_db)
):
    try:
        booking = db.query(Booking).filter(Booking.id == booking_id).first()
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")

        allowed_statuses = {"Pending", "Confirmed", "Completed"}
        if req.status not in allowed_statuses:
            raise HTTPException(status_code=400, detail="Invalid booking status")

        booking.status = req.status
        db.commit()
        db.refresh(booking)
        return serialize_booking(booking)
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update booking: {str(e)}")

# --- REVIEW ENDPOINTS ---

@app.post("/reviews")
def create_review(req: ReviewCreate, db: Session = Depends(get_db)):
    try:
        new_review = Review(
            service_id=int(req.service_id),
            user_id=int(req.user_id),
            rating=req.rating,
            comment=req.comment
        )
        db.add(new_review)
        
        # Update Service Average Rating
        service = db.query(Service).filter(Service.id == int(req.service_id)).first()
        if service:
            # Get all existing reviews + this one (not committed yet, so we query carefully)
            # Easier to commit review first
            db.commit()
            db.refresh(service)
            
            # Calculate new average
            all_reviews = db.query(Review).filter(Review.service_id == service.id).all()
            if all_reviews:
                total_rating = sum([r.rating for r in all_reviews if r.rating])
                service.rating = round(total_rating / len(all_reviews), 1)
                service.review_count = len(all_reviews)
                db.commit()
        else:
            db.commit()

        return {"message": "Review added"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create review: {str(e)}")

@app.get("/reviews/service/{service_id}")
def get_service_reviews(service_id: int, db: Session = Depends(get_db)):
    try:
        reviews = db.query(Review).filter(Review.service_id == service_id).all()
        results = []
        for r in reviews:
            try:
                user_name = r.user.name if r.user else "Anonymous"
            except:
                user_name = "Anonymous"
            
            try:
                created_at_str = r.created_at.isoformat() if r.created_at else datetime.now(timezone.utc).isoformat()
            except:
                created_at_str = datetime.now(timezone.utc).isoformat()
            
            results.append({
                "id": r.id,
                "service_id": r.service_id,
                "user_id": r.user_id,
                "user_name": user_name,
                "rating": int(r.rating) if r.rating else 0,
                "comment": r.comment or "",
                "created_at": created_at_str
            })
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch reviews: {str(e)}")

# Run with: uvicorn main:app --reload
