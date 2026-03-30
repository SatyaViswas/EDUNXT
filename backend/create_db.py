# /server/create_db.py
from app.db.session import engine
from app.models.user import Base # Import your Base where models are registered

print("Connecting to Neon and creating tables...")
Base.metadata.create_all(bind=engine)
print("Tables created successfully! ✅")